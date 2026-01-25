// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";

/**
 * @title RegisterEASSchemas
 * @notice Script to register KYC/KYB schemas on EAS Schema Registry
 * @dev Run with: forge script script/RegisterSchemas.s.sol --rpc-url base-sepolia --broadcast
 */
contract RegisterEASSchemas is Script {
    // EAS Schema Registry (same address on all Base chains)
    address constant SCHEMA_REGISTRY = 0x4200000000000000000000000000000000000020;
    
    // Schema definitions
    string constant FREELANCER_KYC_SCHEMA = "uint8 level,uint64 expiresAt,bytes32 dataRoot";
    string constant COMPANY_KYB_SCHEMA = "bytes32 companyId,uint8 level,uint64 expiresAt,bytes32 dataRoot";
    string constant COMPANY_ROLE_SCHEMA = "bytes32 companyId,uint8 role";
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("ATTESTER_PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Register FreelancerKYC schema
        bytes32 freelancerKycUID = _registerSchema(FREELANCER_KYC_SCHEMA, "FreelancerKYC_v1");
        console.log("FreelancerKYC_v1 Schema UID:");
        console.logBytes32(freelancerKycUID);
        
        // Register CompanyKYB schema
        bytes32 companyKybUID = _registerSchema(COMPANY_KYB_SCHEMA, "CompanyKYB_v1");
        console.log("CompanyKYB_v1 Schema UID:");
        console.logBytes32(companyKybUID);
        
        // Register CompanyRole schema
        bytes32 companyRoleUID = _registerSchema(COMPANY_ROLE_SCHEMA, "CompanyRole_v1");
        console.log("CompanyRole_v1 Schema UID:");
        console.logBytes32(companyRoleUID);
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== Update lib/eas.ts with these UIDs ===");
        console.log("baseSepolia: {");
        console.log("  freelancerKYC: '", vm.toString(freelancerKycUID), "',");
        console.log("  companyKYB: '", vm.toString(companyKybUID), "',");
        console.log("  companyRole: '", vm.toString(companyRoleUID), "',");
        console.log("}");
    }
    
    function _registerSchema(string memory schema, string memory name) internal returns (bytes32) {
        // ISchemaRegistry.register(string schema, address resolver, bool revocable)
        (bool success, bytes memory result) = SCHEMA_REGISTRY.call(
            abi.encodeWithSignature(
                "register(string,address,bool)",
                schema,
                address(0), // No resolver
                true        // Revocable
            )
        );
        
        require(success, string.concat("Failed to register schema: ", name));
        
        bytes32 schemaUID = abi.decode(result, (bytes32));
        return schemaUID;
    }
}
