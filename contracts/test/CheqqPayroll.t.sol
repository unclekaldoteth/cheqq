// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CheqqPayroll.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock USDC for testing
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1_000_000 * 10**6); // 1M USDC
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract CheqqPayrollTest is Test {
    CheqqPayroll public payroll;
    MockUSDC public usdc;
    
    address public owner = address(1);
    address public company = address(2);
    address public employee1 = address(3);
    address public employee2 = address(4);
    address public employee3 = address(5);

    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy contracts
        payroll = new CheqqPayroll(owner);
        usdc = new MockUSDC();
        
        // Setup
        payroll.setTokenWhitelist(address(usdc), true);
        payroll.setCompanyRegistration(company, true);
        
        // Fund company with USDC
        usdc.mint(company, 100_000 * 10**6); // 100k USDC
        
        vm.stopPrank();
    }

    function test_ExecutePayroll() public {
        // Prepare payroll
        CheqqPayroll.PaymentItem[] memory payments = new CheqqPayroll.PaymentItem[](3);
        payments[0] = CheqqPayroll.PaymentItem(employee1, 1000 * 10**6); // 1000 USDC
        payments[1] = CheqqPayroll.PaymentItem(employee2, 2000 * 10**6); // 2000 USDC
        payments[2] = CheqqPayroll.PaymentItem(employee3, 1500 * 10**6); // 1500 USDC

        bytes32 payrollId = keccak256("PAYROLL-2024-01");

        // Approve and execute
        vm.startPrank(company);
        usdc.approve(address(payroll), 5000 * 10**6);
        payroll.executePayroll(payrollId, address(usdc), payments);
        vm.stopPrank();

        // Verify balances
        assertEq(usdc.balanceOf(employee1), 1000 * 10**6);
        assertEq(usdc.balanceOf(employee2), 2000 * 10**6);
        assertEq(usdc.balanceOf(employee3), 1500 * 10**6);
        assertEq(payroll.isPayrollExecuted(payrollId), true);
    }

    function test_RevertDuplicatePayroll() public {
        CheqqPayroll.PaymentItem[] memory payments = new CheqqPayroll.PaymentItem[](1);
        payments[0] = CheqqPayroll.PaymentItem(employee1, 1000 * 10**6);

        bytes32 payrollId = keccak256("PAYROLL-DUP");

        vm.startPrank(company);
        usdc.approve(address(payroll), 2000 * 10**6);
        
        // First execution should succeed
        payroll.executePayroll(payrollId, address(usdc), payments);
        
        // Second execution should fail
        vm.expectRevert("Payroll already executed");
        payroll.executePayroll(payrollId, address(usdc), payments);
        
        vm.stopPrank();
    }

    function test_RevertUnregisteredCompany() public {
        CheqqPayroll.PaymentItem[] memory payments = new CheqqPayroll.PaymentItem[](1);
        payments[0] = CheqqPayroll.PaymentItem(employee1, 1000 * 10**6);

        address unregisteredCompany = address(99);
        
        vm.startPrank(unregisteredCompany);
        vm.expectRevert("Company not registered");
        payroll.executePayroll(keccak256("TEST"), address(usdc), payments);
        vm.stopPrank();
    }

    function test_RevertNonWhitelistedToken() public {
        MockUSDC fakeToken = new MockUSDC();
        
        CheqqPayroll.PaymentItem[] memory payments = new CheqqPayroll.PaymentItem[](1);
        payments[0] = CheqqPayroll.PaymentItem(employee1, 1000 * 10**6);

        vm.startPrank(company);
        vm.expectRevert("Token not whitelisted");
        payroll.executePayroll(keccak256("TEST"), address(fakeToken), payments);
        vm.stopPrank();
    }

    function test_CalculatePayrollTotal() public view {
        CheqqPayroll.PaymentItem[] memory payments = new CheqqPayroll.PaymentItem[](2);
        payments[0] = CheqqPayroll.PaymentItem(employee1, 1000 * 10**6);
        payments[1] = CheqqPayroll.PaymentItem(employee2, 2000 * 10**6);

        (uint256 total, uint256 fee, uint256 required) = payroll.calculatePayrollTotal(payments);
        
        assertEq(total, 3000 * 10**6);
        assertEq(fee, 0); // No fee by default
        assertEq(required, 3000 * 10**6);
    }

    function test_FeeCalculation() public {
        // Set 1% fee
        vm.prank(owner);
        payroll.setFee(100, owner); // 100 bps = 1%

        CheqqPayroll.PaymentItem[] memory payments = new CheqqPayroll.PaymentItem[](1);
        payments[0] = CheqqPayroll.PaymentItem(employee1, 10000 * 10**6); // 10k USDC

        (uint256 total, uint256 fee, uint256 required) = payroll.calculatePayrollTotal(payments);
        
        assertEq(total, 10000 * 10**6);
        assertEq(fee, 100 * 10**6); // 1% = 100 USDC
        assertEq(required, 10100 * 10**6);
    }
}
