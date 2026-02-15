// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CheqqGatedActions
 * @notice EIP-712 permit verifier for Cheqq on Tempo (no EAS dependency)
 * @dev Enables gated contract calls using short-lived permits signed by backend.
 *      Attestation verification is handled off-chain (database-level) since
 *      EAS is not available on Tempo.
 */
contract CheqqGatedActions is EIP712, Ownable {
    using ECDSA for bytes32;

    // ========== STORAGE ==========
    address public permitSigner;
    
    // Nonce tracking: subject => nonce => used
    mapping(address => mapping(uint256 => bool)) public usedNonces;
    
    // Max nonce per subject (for efficient queries)
    mapping(address => uint256) public maxNonce;

    // Wallet registration: address => registered
    mapping(address => bool) public registeredWallets;
    
    // ========== EVENTS ==========
    event PermitUsed(
        address indexed subject,
        bytes32 indexed action,
        uint256 nonce
    );
    
    event PermitFailed(
        address indexed subject,
        bytes32 indexed action,
        string reason
    );
    
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);
    event WalletRegistered(address indexed wallet, bool registered);

    // ========== ERRORS ==========
    error InvalidSignature();
    error PermitExpired();
    error NonceAlreadyUsed();
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
        bytes32 requiredSchemaUID;       // kept for ABI compatibility (ignored on Tempo)
        bytes32 requiredAttestationUID;  // kept for ABI compatibility (ignored on Tempo)
    }

    // ========== CONSTRUCTOR ==========
    constructor(
        address _permitSigner,
        address _owner
    ) EIP712("CheqqPermit", "1") Ownable(_owner) {
        if (_permitSigner == address(0)) revert ZeroAddress();
        
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
     * @notice Register or unregister a wallet
     * @param wallet The wallet address
     * @param registered Whether to register or unregister
     */
    function setWalletRegistered(address wallet, bool registered) external onlyOwner {
        if (wallet == address(0)) revert ZeroAddress();
        registeredWallets[wallet] = registered;
        emit WalletRegistered(wallet, registered);
    }

    /**
     * @notice Batch register wallets
     * @param wallets Array of wallet addresses
     * @param registered Whether to register or unregister
     */
    function batchSetWalletRegistered(address[] calldata wallets, bool registered) external onlyOwner {
        for (uint256 i = 0; i < wallets.length; i++) {
            if (wallets[i] == address(0)) revert ZeroAddress();
            registeredWallets[wallets[i]] = registered;
            emit WalletRegistered(wallets[i], registered);
        }
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

    // ========== PERMIT CONSUMPTION ==========
    
    /**
     * @notice Verify and consume a permit (marks nonce as used)
     * @param permit The permit struct
     * @param signature The EIP-712 signature
     */
    function verifyAndUsePermit(
        Permit calldata permit,
        bytes calldata signature
    ) external {
        _usePermit(permit, signature);
    }

    /**
     * @notice Internal function to verify and consume a permit
     */
    function _usePermit(
        Permit calldata permit,
        bytes calldata signature
    ) internal {
        // Verify permit signature
        if (!verifyPermit(permit, signature)) {
            emit PermitFailed(permit.subject, permit.action, "invalid_signature_or_expired");
            revert InvalidSignature();
        }
        
        // Mark nonce as used
        usedNonces[permit.subject][permit.nonce] = true;
        
        // Update max nonce
        if (permit.nonce > maxNonce[permit.subject]) {
            maxNonce[permit.subject] = permit.nonce;
        }
        
        emit PermitUsed(permit.subject, permit.action, permit.nonce);
    }

    // ========== MODIFIERS ==========
    
    /**
     * @notice Modifier to gate functions with permit verification
     */
    modifier withPermit(
        Permit calldata permit,
        bytes calldata signature
    ) {
        _usePermit(permit, signature);
        _;
    }

    // ========== VIEW FUNCTIONS ==========
    
    /**
     * @notice Check if a nonce has been used
     */
    function isNonceUsed(address subject, uint256 nonce) external view returns (bool used) {
        return usedNonces[subject][nonce];
    }

    /**
     * @notice Check if a wallet is registered
     */
    function isWalletRegistered(address wallet) external view returns (bool) {
        return registeredWallets[wallet];
    }

    /**
     * @notice Get the EIP-712 domain separator
     */
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
