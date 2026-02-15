// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CheqqGatedActions} from "../src/CheqqGatedActions.sol";

/**
 * @title DeployCheqqGatedActions
 * @notice Deploys the CheqqGatedActions contract on Tempo Testnet (no EAS)
 * @dev Run with: forge script script/DeployCheqqGatedActions.s.sol --rpc-url https://rpc.moderato.tempo.xyz --broadcast
 */
contract DeployCheqqGatedActions is Script {
    uint256 constant TEMPO_CHAIN_ID = 42431;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying CheqqGatedActions (no EAS)...");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        if (block.chainid != TEMPO_CHAIN_ID) {
            revert("Must deploy on Tempo Testnet (42431)");
        }
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy CheqqGatedActions
        // Constructor: permitSigner, owner
        CheqqGatedActions gatedActions = new CheqqGatedActions(
            deployer,       // permit signer
            deployer        // owner
        );
        
        // Register deployer wallet for testing
        gatedActions.setWalletRegistered(deployer, true);
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("CheqqGatedActions:", address(gatedActions));
        console.log("");
        console.log("Next steps:");
        console.log("1. Set CHEQQ_GATED_ACTIONS_ADDRESS in .env.local");
        console.log("2. Set NEXT_PUBLIC_CHEQQ_GATED_ACTIONS_ADDRESS in .env.local");
    }
}
