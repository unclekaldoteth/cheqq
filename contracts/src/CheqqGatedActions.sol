// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IEAS
 * @notice Interface for Ethereum Attestation Service
 */
interface IEAS {
    struct Attestation {
        bytes32 uid;
        bytes32 schema;
        uint64 time;
        uint64 expirationTime;
        uint64 revocationTime;
        bytes32 refUID;
        address recipient;
        address attester;
        bool revocable;
        bytes data;
    }
    
    function getAttestation(bytes32 uid) external view returns (Attestation memory);
}

/**
 * @title CheqqGatedActions
 * @notice EIP-712 permit verifier with EAS attestation checking for Cheqq
 * @dev Enables gated contract calls using short-lived permits signed by backend
 */
contract CheqqGatedActions is EIP712, Ownable {
    using ECDSA for bytes32;

    // ========== STORAGE ==========
    IEAS public immutable eas;
    address public permitSigner;
    
    // Schema UIDs (set per network)
    bytes32 public freelancerKYCSchemaUID;
    bytes32 public companyKYBSchemaUID;
    bytes32 public companyRoleSchemaUID;
    
    // Nonce tracking: subject => nonce => used
    mapping(address => mapping(uint256 => bool)) public usedNonces;
    
    // Max nonce per subject (for efficient queries)
    mapping(address => uint256) public maxNonce;
    
    // ========== EVENTS ==========
    event PermitUsed(
        address indexed subject,
        bytes32 indexed action,
        uint256 nonce,
        bytes32 attestationUID
    );
    
    event PermitFailed(
        address indexed subject,
        bytes32 indexed action,
        string reason
    );
    
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);
    event SchemaUpdated(string schemaType, bytes32 schemaUID);

    // ========== ERRORS ==========
    error InvalidSignature();
    error PermitExpired();
    error NonceAlreadyUsed();
    error AttestationInvalid();
    error AttestationRevoked();
    error AttestationExpired();
    error SchemaMismatch();
    error Unauthorized();
    error ZeroAddress();

    // ========== TYPES ==========
    bytes32 private constant PERMIT_TYPEHASH = keccak256(
        "Permit(address subject,bytes32 action,bytes32 paramsHash,uint256 nonce,uint64 expiry,bytes32 requiredSchemaUID,bytes32 requiredAttestationUID)"
    );

    struct Permit {
        address subject;
        bytes32 action;
        bytes32 paramsHash;
        uint256 nonce;
        uint64 expiry;
        bytes32 requiredSchemaUID;
        bytes32 requiredAttestationUID;
    }

    // ========== CONSTRUCTOR ==========
    constructor(
        address _eas,
        address _permitSigner,
        address _owner
    ) EIP712("CheqqPermit", "1") Ownable(_owner) {
        if (_eas == address(0)) revert ZeroAddress();
        if (_permitSigner == address(0)) revert ZeroAddress();
        
        eas = IEAS(_eas);
        permitSigner = _permitSigner;
    }

    // ========== ADMIN ==========
    
    /**
     * @notice Update the permit signer address
     * @param _signer New signer address
     */
    function setPermitSigner(address _signer) external onlyOwner {
        if (_signer == address(0)) revert ZeroAddress();
        emit SignerUpdated(permitSigner, _signer);
        permitSigner = _signer;
    }

    /**
     * @notice Set EAS schema UIDs for verification
     * @param _freelancerKYC Schema UID for freelancer KYC
     * @param _companyKYB Schema UID for company KYB
     * @param _companyRole Schema UID for company roles
     */
    function setSchemaUIDs(
        bytes32 _freelancerKYC,
        bytes32 _companyKYB,
        bytes32 _companyRole
    ) external onlyOwner {
        freelancerKYCSchemaUID = _freelancerKYC;
        companyKYBSchemaUID = _companyKYB;
        companyRoleSchemaUID = _companyRole;
        
        emit SchemaUpdated("freelancerKYC", _freelancerKYC);
        emit SchemaUpdated("companyKYB", _companyKYB);
        emit SchemaUpdated("companyRole", _companyRole);
    }

    // ========== PERMIT VERIFICATION ==========
    
    /**
     * @notice Verify a permit signature without consuming the nonce
     * @param permit The permit struct
     * @param signature The EIP-712 signature
     * @return valid Whether the permit signature is valid
     */
    function verifyPermit(
        Permit calldata permit,
        bytes calldata signature
    ) public view returns (bool valid) {
        // 1. Check expiry
        if (block.timestamp > permit.expiry) {
            return false;
        }
        
        // 2. Check nonce
        if (usedNonces[permit.subject][permit.nonce]) {
            return false;
        }
        
        // 3. Verify signature
        bytes32 structHash = keccak256(abi.encode(
            PERMIT_TYPEHASH,
            permit.subject,
            permit.action,
            permit.paramsHash,
            permit.nonce,
            permit.expiry,
            permit.requiredSchemaUID,
            permit.requiredAttestationUID
        ));
        
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
        
        return signer == permitSigner;
    }

    /**
     * @notice Verify an EAS attestation is valid
     * @param attestationUID The attestation UID to verify
     * @param requiredSchemaUID The schema that the attestation must match
     * @param expectedRecipient The expected recipient (0x0 to skip check)
     * @return valid Whether the attestation is valid
     */
    function verifyAttestation(
        bytes32 attestationUID,
        bytes32 requiredSchemaUID,
        address expectedRecipient
    ) public view returns (bool valid) {
        IEAS.Attestation memory att = eas.getAttestation(attestationUID);
        
        // Check attestation exists
        if (att.uid == bytes32(0)) return false;
        
        // Check schema matches
        if (att.schema != requiredSchemaUID) return false;
        
        // Check not revoked
        if (att.revocationTime != 0) return false;
        
        // Check not expired (0 = no expiry)
        if (att.expirationTime != 0 && block.timestamp > att.expirationTime) {
            return false;
        }
        
        // Check recipient (if specified)
        if (expectedRecipient != address(0) && att.recipient != expectedRecipient) {
            return false;
        }
        
        return true;
    }

    /**
     * @notice Verify a company role attestation and its parent KYB
     * @param roleAttestationUID The role attestation UID
     * @param expectedRecipient The wallet expected to have the role
     * @return valid Whether the role is valid and KYB is not expired
     */
    function verifyCompanyRole(
        bytes32 roleAttestationUID,
        address expectedRecipient
    ) public view returns (bool valid) {
        // Get role attestation
        IEAS.Attestation memory roleAtt = eas.getAttestation(roleAttestationUID);
        
        // Check role attestation exists and is valid
        if (roleAtt.uid == bytes32(0)) return false;
        if (roleAtt.schema != companyRoleSchemaUID) return false;
        if (roleAtt.revocationTime != 0) return false;
        if (roleAtt.recipient != expectedRecipient) return false;
        
        // Check parent KYB attestation (via refUID)
        bytes32 kybUID = roleAtt.refUID;
        if (kybUID == bytes32(0)) return false;
        
        IEAS.Attestation memory kybAtt = eas.getAttestation(kybUID);
        
        // Verify KYB is valid
        if (kybAtt.uid == bytes32(0)) return false;
        if (kybAtt.schema != companyKYBSchemaUID) return false;
        if (kybAtt.revocationTime != 0) return false;
        
        // Check KYB expiry (role inherits from parent)
        if (kybAtt.expirationTime != 0 && block.timestamp > kybAtt.expirationTime) {
            return false;
        }
        
        return true;
    }

    // ========== PERMIT CONSUMPTION ==========
    
    /**
     * @notice Verify and consume a permit (marks nonce as used)
     * @param permit The permit struct
     * @param signature The EIP-712 signature
     * @param attestationUID The attestation UID to verify
     */
    function verifyAndUsePermit(
        Permit calldata permit,
        bytes calldata signature,
        bytes32 attestationUID
    ) external {
        _usePermit(permit, signature, attestationUID);
    }

    /**
     * @notice Internal function to verify and consume a permit
     */
    function _usePermit(
        Permit calldata permit,
        bytes calldata signature,
        bytes32 attestationUID
    ) internal {
        // Verify permit signature
        if (!verifyPermit(permit, signature)) {
            emit PermitFailed(permit.subject, permit.action, "invalid_signature_or_expired");
            revert InvalidSignature();
        }

        if (permit.requiredAttestationUID != bytes32(0) && attestationUID != permit.requiredAttestationUID) {
            emit PermitFailed(permit.subject, permit.action, "attestation_uid_mismatch");
            revert AttestationInvalid();
        }
        
        // Verify attestation based on schema type
        bool attestationValid;
        if (permit.requiredSchemaUID == companyRoleSchemaUID) {
            // For company roles, also verify parent KYB
            attestationValid = verifyCompanyRole(attestationUID, permit.subject);
        } else {
            attestationValid = verifyAttestation(
                attestationUID, 
                permit.requiredSchemaUID, 
                permit.subject
            );
        }
        
        if (!attestationValid) {
            emit PermitFailed(permit.subject, permit.action, "attestation_invalid");
            revert AttestationInvalid();
        }
        
        // Mark nonce as used
        usedNonces[permit.subject][permit.nonce] = true;
        
        // Update max nonce
        if (permit.nonce > maxNonce[permit.subject]) {
            maxNonce[permit.subject] = permit.nonce;
        }
        
        emit PermitUsed(permit.subject, permit.action, permit.nonce, attestationUID);
    }

    // ========== MODIFIERS ==========
    
    /**
     * @notice Modifier to gate functions with permit verification
     */
    modifier withPermit(
        Permit calldata permit,
        bytes calldata signature,
        bytes32 attestationUID
    ) {
        _usePermit(permit, signature, attestationUID);
        _;
    }

    // ========== VIEW FUNCTIONS ==========
    
    /**
     * @notice Check if a nonce has been used
     * @param subject The subject address
     * @param nonce The nonce to check
     * @return used Whether the nonce has been used
     */
    function isNonceUsed(address subject, uint256 nonce) external view returns (bool used) {
        return usedNonces[subject][nonce];
    }

    /**
     * @notice Get the EIP-712 domain separator
     * @return The domain separator
     */
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
