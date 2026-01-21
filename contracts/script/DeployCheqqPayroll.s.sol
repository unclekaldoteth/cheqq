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
 *     --rpc-url $BASE_SEPOLIA_RPC \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast \
 *     --verify
 */
contract DeployCheqqPayroll is Script {
    // USDC addresses
    address constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    address constant USDC_BASE_MAINNET = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 chainId = block.chainid;
        
        console.log("Deploying CheqqPayroll...");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", chainId);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy contract with deployer as owner
        CheqqPayroll payroll = new CheqqPayroll(deployer);
        console.log("CheqqPayroll deployed at:", address(payroll));

        // Whitelist USDC based on network
        address usdcAddress;
        if (chainId == 8453) {
            usdcAddress = USDC_BASE_MAINNET;
        } else if (chainId == 84532) {
            usdcAddress = USDC_BASE_SEPOLIA;
        } else {
            revert("Unsupported chain");
        }

        payroll.setTokenWhitelist(usdcAddress, true);
        console.log("USDC whitelisted:", usdcAddress);

        // Register deployer as a company for testing
        payroll.setCompanyRegistration(deployer, true);
        console.log("Deployer registered as company");

        vm.stopBroadcast();

        console.log("Deployment complete!");
    }
}
