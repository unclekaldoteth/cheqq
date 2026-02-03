// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CheqqPayroll.sol";

/**
 * @title ConfigureCheqqPayroll
 * @notice Configure an existing CheqqPayroll deployment.
 *
 * Required env vars:
 * - PRIVATE_KEY (owner of the CheqqPayroll contract)
 * - CHEQQ_PAYROLL_ADDRESS (deployed CheqqPayroll address)
 * - COMPANY_ADDRESS (company wallet to register)
 *
 * Optional env vars:
 * - TOKEN_ADDRESS (override token address to whitelist)
 *
 * Usage:
 *   forge script script/ConfigureCheqqPayroll.s.sol:ConfigureCheqqPayroll \
 *     --rpc-url $BASE_SEPOLIA_RPC_URL \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast
 */
contract ConfigureCheqqPayroll is Script {
    address constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    address constant USDC_BASE_MAINNET = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address payrollAddress = vm.envAddress("CHEQQ_PAYROLL_ADDRESS");
        address companyAddress = vm.envAddress("COMPANY_ADDRESS");

        address tokenOverride = vm.envOr("TOKEN_ADDRESS", address(0));
        address tokenAddress;

        if (tokenOverride != address(0)) {
            tokenAddress = tokenOverride;
        } else if (block.chainid == 84532) {
            tokenAddress = USDC_BASE_SEPOLIA;
        } else if (block.chainid == 8453) {
            tokenAddress = USDC_BASE_MAINNET;
        } else {
            revert("Unsupported chain");
        }

        CheqqPayroll payroll = CheqqPayroll(payrollAddress);

        console.log("Configuring CheqqPayroll...");
        console.log("Deployer:", deployer);
        console.log("Payroll:", payrollAddress);
        console.log("Company:", companyAddress);
        console.log("Token:", tokenAddress);
        console.log("Chain ID:", block.chainid);

        if (payroll.owner() != deployer) {
            revert("Signer is not the contract owner");
        }

        vm.startBroadcast(deployerPrivateKey);

        payroll.setTokenWhitelist(tokenAddress, true);
        payroll.setCompanyRegistration(companyAddress, true);

        vm.stopBroadcast();

        console.log("Configuration complete.");
    }
}
