// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LendingBorrowing is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable collateralToken;
    IERC20 public immutable loanToken;

    uint256 public collateralFactor = 150; // 150% collateralization ratio
    uint256 public constant PRECISION = 100;

    struct LoanDetails {
        uint256 collateralAmount;
        uint256 loanAmount;
        uint256 timestamp;
        bool isActive;
    }

    mapping(address => LoanDetails) public loans;
    mapping(address => uint256) public collateralBalances;

    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event LoanTaken(
        address indexed user,
        uint256 loanAmount,
        uint256 collateralAmount
    );
    event LoanRepaid(address indexed user, uint256 amount);
    event CollateralFactorUpdated(uint256 newFactor);

    constructor(
        address _collateralToken,
        address _loanToken
    ) Ownable(msg.sender) {
        collateralToken = IERC20(_collateralToken);
        loanToken = IERC20(_loanToken);
    }

    function depositCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        collateralToken.safeTransferFrom(msg.sender, address(this), amount);
        collateralBalances[msg.sender] += amount;

        emit CollateralDeposited(msg.sender, amount);
    }

    function withdrawCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(
            collateralBalances[msg.sender] >= amount,
            "Insufficient collateral balance"
        );

        LoanDetails storage loan = loans[msg.sender];
        if (loan.isActive) {
            uint256 remainingCollateral = collateralBalances[msg.sender] -
                amount;
            uint256 requiredCollateral = _loanRequiredCollateral(
                loan.loanAmount
            );
            require(
                remainingCollateral >= requiredCollateral,
                "Cannot withdraw, insufficient collateral for loan"
            );
        }

        collateralBalances[msg.sender] -= amount;
        collateralToken.safeTransfer(msg.sender, amount);

        emit CollateralWithdrawn(msg.sender, amount);
    }

    function takeLoan(uint256 loanAmount) external nonReentrant {
        require(loanAmount > 0, "Loan amount must be greater than 0");
        require(!loans[msg.sender].isActive, "Already have an active loan");

        uint256 requiredCollateral = _loanRequiredCollateral(loanAmount);
        require(
            collateralBalances[msg.sender] >= requiredCollateral,
            "Insufficient collateral"
        );
        require(
            loanToken.balanceOf(address(this)) >= loanAmount,
            "Insufficient loan tokens in contract"
        );

        loans[msg.sender] = LoanDetails({
            collateralAmount: requiredCollateral,
            loanAmount: loanAmount,
            timestamp: block.timestamp,
            isActive: true
        });

        loanToken.safeTransfer(msg.sender, loanAmount);

        emit LoanTaken(msg.sender, loanAmount, requiredCollateral);
    }

    function repayLoan() external nonReentrant {
        LoanDetails storage loan = loans[msg.sender];
        require(loan.isActive, "No active loan");

        uint256 repayAmount = loan.loanAmount;

        loanToken.safeTransferFrom(msg.sender, address(this), repayAmount);

        loan.isActive = false;
        loan.loanAmount = 0;

        emit LoanRepaid(msg.sender, repayAmount);
    }

    function _loanRequiredCollateral(
        uint256 loanAmount
    ) internal view returns (uint256) {
        return (loanAmount * collateralFactor) / PRECISION;
    }

    function getLoanDetails(
        address user
    ) external view returns (LoanDetails memory) {
        return loans[user];
    }

    function setCollateralFactor(uint256 _collateralFactor) external onlyOwner {
        require(
            _collateralFactor >= 100,
            "Collateral factor must be at least 100%"
        );
        collateralFactor = _collateralFactor;
        emit CollateralFactorUpdated(_collateralFactor);
    }

    function getCollateralBalance(
        address user
    ) external view returns (uint256) {
        return collateralBalances[user];
    }

    function getAvailableLiquidity() external view returns (uint256) {
        return loanToken.balanceOf(address(this));
    }
}