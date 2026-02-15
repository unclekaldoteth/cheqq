// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CheqqPayroll.sol";

/**
 * @title DeployCheqqPayroll
 * @notice Deployment script for CheqqPayroll contract
 * 
 * Usage:
 *   forge script script/DeployCheqqPayroll.s.sol:DeployCheqqPayroll \
 *     --rpc-url $TEMPO_TESTNET_RPC \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast \
 *     --verify
 */
contract DeployCheqqPayroll is Script {
    uint256 constant TEMPO_CHAIN_ID = 42431;
    address constant ALPHA_USD_TEMPO = 0x20C0000000000000000000000000000000000001;
    address constant BETA_USD_TEMPO = 0x20C0000000000000000000000000000000000002;
    address constant PATH_USD_TEMPO = 0x20C0000000000000000000000000000000000000;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 chainId = block.chainid;
        
        console.log("Deploying CheqqPayroll...");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", chainId);

        if (chainId != TEMPO_CHAIN_ID) {
            revert("Unsupported chain. Use Tempo Testnet (42431)");
        }

        vm.startBroadcast(deployerPrivateKey);

        // Deploy contract with deployer as owner
        CheqqPayroll payroll = new CheqqPayroll(deployer);
        console.log("CheqqPayroll deployed at:", address(payroll));

        payroll.setTokenWhitelist(ALPHA_USD_TEMPO, true);
        payroll.setTokenWhitelist(BETA_USD_TEMPO, true);
        payroll.setTokenWhitelist(PATH_USD_TEMPO, true);
        console.log("AlphaUSD whitelisted:", ALPHA_USD_TEMPO);
        console.log("BetaUSD whitelisted:", BETA_USD_TEMPO);
        console.log("pathUSD whitelisted:", PATH_USD_TEMPO);

        // Register deployer as a company for testing
        payroll.setCompanyRegistration(deployer, true);
        console.log("Deployer registered as company");

        vm.stopBroadcast();

        console.log("Deployment complete!");
    }
}
