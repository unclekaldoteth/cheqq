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
 *     --rpc-url $TEMPO_TESTNET_RPC_URL \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast
 */
contract ConfigureCheqqPayroll is Script {
    uint256 constant TEMPO_CHAIN_ID = 42431;
    address constant ALPHA_USD_TEMPO = 0x20C0000000000000000000000000000000000001;
    address constant BETA_USD_TEMPO = 0x20C0000000000000000000000000000000000002;
    address constant PATH_USD_TEMPO = 0x20C0000000000000000000000000000000000000;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address payrollAddress = vm.envAddress("CHEQQ_PAYROLL_ADDRESS");
        address companyAddress = vm.envAddress("COMPANY_ADDRESS");

        address tokenOverride = vm.envOr("TOKEN_ADDRESS", address(0));
        if (block.chainid != TEMPO_CHAIN_ID) {
            revert("Unsupported chain. Use Tempo Testnet (42431)");
        }

        CheqqPayroll payroll = CheqqPayroll(payrollAddress);

        console.log("Configuring CheqqPayroll...");
        console.log("Deployer:", deployer);
        console.log("Payroll:", payrollAddress);
        console.log("Company:", companyAddress);
        console.log("Chain ID:", block.chainid);

        if (payroll.owner() != deployer) {
            revert("Signer is not the contract owner");
        }

        vm.startBroadcast(deployerPrivateKey);

        if (tokenOverride != address(0)) {
            payroll.setTokenWhitelist(tokenOverride, true);
            console.log("Token whitelisted:", tokenOverride);
        } else {
            payroll.setTokenWhitelist(ALPHA_USD_TEMPO, true);
            payroll.setTokenWhitelist(BETA_USD_TEMPO, true);
            payroll.setTokenWhitelist(PATH_USD_TEMPO, true);
            console.log("AlphaUSD whitelisted:", ALPHA_USD_TEMPO);
            console.log("BetaUSD whitelisted:", BETA_USD_TEMPO);
            console.log("pathUSD whitelisted:", PATH_USD_TEMPO);
        }
        payroll.setCompanyRegistration(companyAddress, true);

        vm.stopBroadcast();

        console.log("Configuration complete.");
    }
}
