// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CheqqPayroll
 * @notice Batch payroll contract for Cheqq - enables companies to pay multiple 
 *         employees in a single transaction using USDC or other ERC-20 tokens.
 * @dev Optimized for Base L2 with minimal gas costs.
 */
contract CheqqPayroll is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Events
    event PayrollExecuted(
        bytes32 indexed payrollId,
        address indexed company,
        address indexed token,
        uint256 totalAmount,
        uint256 recipientCount
    );
    
    event PaymentSent(
        bytes32 indexed payrollId,
        address indexed recipient,
        uint256 amount
    );
    
    event TokenWhitelisted(address indexed token, bool whitelisted);
    event CompanyRegistered(address indexed company, bool registered);

    // State
    mapping(address => bool) public whitelistedTokens;
    mapping(address => bool) public registeredCompanies;
    mapping(bytes32 => bool) public executedPayrolls;

    // Fee configuration (in basis points, 100 = 1%)
    uint256 public feeBps = 0; // No fee by default
    address public feeRecipient;

    // Structs
    struct PaymentItem {
        address recipient;
        uint256 amount;
    }

    // Constructor
    constructor(address _owner) Ownable(_owner) {
        feeRecipient = _owner;
    }

    // ========== ADMIN FUNCTIONS ==========

    /**
     * @notice Whitelist a token for payroll payments
     */
    function setTokenWhitelist(address token, bool whitelisted) external onlyOwner {
        require(token != address(0), "Invalid token address");
        whitelistedTokens[token] = whitelisted;
        emit TokenWhitelisted(token, whitelisted);
    }

    /**
     * @notice Register a company to use the payroll system
     */
    function setCompanyRegistration(address company, bool registered) external onlyOwner {
        require(company != address(0), "Invalid company address");
        registeredCompanies[company] = registered;
        emit CompanyRegistered(company, registered);
    }

    /**
     * @notice Set fee configuration
     */
    function setFee(uint256 _feeBps, address _feeRecipient) external onlyOwner {
        require(_feeBps <= 500, "Fee too high"); // Max 5%
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeBps = _feeBps;
        feeRecipient = _feeRecipient;
    }

    // ========== PAYROLL FUNCTIONS ==========

    /**
     * @notice Execute batch payroll payment
     * @param payrollId Unique identifier for this payroll run (prevents duplicates)
     * @param token The ERC-20 token to use for payments (e.g., USDC)
     * @param payments Array of recipient addresses and amounts
     */
    function executePayroll(
        bytes32 payrollId,
        address token,
        PaymentItem[] calldata payments
    ) external nonReentrant {
        require(!executedPayrolls[payrollId], "Payroll already executed");
        require(whitelistedTokens[token], "Token not whitelisted");
        require(registeredCompanies[msg.sender], "Company not registered");
        require(payments.length > 0, "No payments provided");
        require(payments.length <= 100, "Too many payments"); // Gas limit safety

        // Calculate total amount
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < payments.length; i++) {
            require(payments[i].recipient != address(0), "Invalid recipient");
            require(payments[i].amount > 0, "Invalid amount");
            totalAmount += payments[i].amount;
        }

        // Calculate fee
        uint256 feeAmount = (totalAmount * feeBps) / 10000;
        uint256 totalRequired = totalAmount + feeAmount;

        // Transfer tokens from company to contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), totalRequired);

        // Distribute payments
        for (uint256 i = 0; i < payments.length; i++) {
            IERC20(token).safeTransfer(payments[i].recipient, payments[i].amount);
            emit PaymentSent(payrollId, payments[i].recipient, payments[i].amount);
        }

        // Transfer fee if applicable
        if (feeAmount > 0) {
            IERC20(token).safeTransfer(feeRecipient, feeAmount);
        }

        // Mark payroll as executed
        executedPayrolls[payrollId] = true;

        emit PayrollExecuted(payrollId, msg.sender, token, totalAmount, payments.length);
    }

    /**
     * @notice Calculate total amount needed for a payroll run (including fees)
     */
    function calculatePayrollTotal(
        PaymentItem[] calldata payments
    ) external view returns (uint256 totalAmount, uint256 feeAmount, uint256 totalRequired) {
        for (uint256 i = 0; i < payments.length; i++) {
            totalAmount += payments[i].amount;
        }
        feeAmount = (totalAmount * feeBps) / 10000;
        totalRequired = totalAmount + feeAmount;
    }

    /**
     * @notice Check if a payroll has been executed
     */
    function isPayrollExecuted(bytes32 payrollId) external view returns (bool) {
        return executedPayrolls[payrollId];
    }

    // ========== EMERGENCY FUNCTIONS ==========

    /**
     * @notice Recover stuck tokens (emergency only)
     */
    function recoverTokens(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        IERC20(token).safeTransfer(to, amount);
    }
}
