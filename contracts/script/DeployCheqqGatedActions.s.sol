// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CheqqGatedActions} from "../src/CheqqGatedActions.sol";

/**
 * @title DeployCheqqGatedActions
 * @notice Deploys the CheqqGatedActions contract to Base Sepolia
 * @dev Run with: forge script script/DeployCheqqGatedActions.s.sol --rpc-url base-sepolia --broadcast --verify
 */
contract DeployCheqqGatedActions is Script {
    // EAS Contract (predeploy on Base)
    address constant EAS_CONTRACT = 0x4200000000000000000000000000000000000021;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("ATTESTER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying CheqqGatedActions...");
        console.log("Deployer:", deployer);
        console.log("EAS Contract:", EAS_CONTRACT);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy CheqqGatedActions
        // Constructor: eas, permitSigner, owner
        CheqqGatedActions gatedActions = new CheqqGatedActions(
            EAS_CONTRACT,   // eas
            deployer,       // permit signer
            deployer        // owner
        );
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("CheqqGatedActions:", address(gatedActions));
        console.log("");
        console.log("Next steps:");
        console.log("1. Update GATED_ACTIONS_ADDRESS in lib/permit.ts");
        console.log("2. Update PAYROLL_GATED_ADDRESS in hooks/useGatedPayroll.ts");
        console.log("3. Call setSchemaUIDs() on the contract with the schema UIDs");
    }
}
