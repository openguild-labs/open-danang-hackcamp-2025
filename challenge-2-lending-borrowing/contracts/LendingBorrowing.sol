// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LendingBorrowing is Ownable {
    using SafeERC20 for IERC20;

    /* -------------------------------------------------------------------------- */
    /*                                   TYPES                                    */
    /* -------------------------------------------------------------------------- */

    struct Loan {
        uint256 amount;     // Lending token amount borrowed
        uint256 collateral; // Collateral locked when the loan was taken
        bool    isActive;   // Loan status flag
    }

    /* -------------------------------------------------------------------------- */
    /*                              STATE VARIABLES                               */
    /* -------------------------------------------------------------------------- */

    IERC20  public immutable collateralToken; // Token accepted as collateral
    IERC20  public immutable lendingToken;    // Token lent out to users
    uint256 public collateralFactor;          // Percentage (1‑100)

    mapping(address => uint256) public collateralBalances; // User → total collateral
    mapping(address => Loan)    public loans;              // User → loan info

    /* -------------------------------------------------------------------------- */
    /*                                    EVENTS                                  */
    /* -------------------------------------------------------------------------- */

    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event LoanTaken(address indexed user, uint256 amount, uint256 collateralLocked);
    event LoanRepaid(address indexed user, uint256 amountRepaid);

    /* -------------------------------------------------------------------------- */
    /*                               CONSTRUCTOR                                  */
    /* -------------------------------------------------------------------------- */

    constructor(
        IERC20 _collateralToken,
        IERC20 _lendingToken,
        uint256 _collateralFactor
    ) Ownable(msg.sender) {
        require(address(_collateralToken) != address(0), "Invalid collateral token");
        require(address(_lendingToken)    != address(0), "Invalid lending token");
        require(_collateralFactor > 0 && _collateralFactor <= 100, "Collateral factor must be 1-100");

        collateralToken  = _collateralToken;
        lendingToken     = _lendingToken;
        collateralFactor = _collateralFactor;
    }

    /* -------------------------------------------------------------------------- */
    /*                            ADMINISTRATIVE LOGIC                            */
    /* -------------------------------------------------------------------------- */

    function setCollateralFactor(uint256 _newFactor) external onlyOwner {
        require(_newFactor > 0 && _newFactor <= 100, "Factor must be 1-100");
        collateralFactor = _newFactor;
    }

    /* -------------------------------------------------------------------------- */
    /*                           COLLATERAL MANAGEMENT                            */
    /* -------------------------------------------------------------------------- */

    function depositCollateral(uint256 _amount) external {
        require(_amount > 0, "Amount must be > 0");

        collateralToken.safeTransferFrom(msg.sender, address(this), _amount);

        collateralBalances[msg.sender] += _amount;
        emit CollateralDeposited(msg.sender, _amount);
    }

    function withdrawCollateral(uint256 _amount) external {
        require(_amount > 0, "Amount must be > 0");
        uint256 currentBalance = collateralBalances[msg.sender];
        require(currentBalance >= _amount, "Insufficient collateral balance");

        uint256 newBalance = currentBalance - _amount;

        if (loans[msg.sender].isActive) {
            require(
                newBalance >= _loanRequiredCollateral(msg.sender),
                "Remaining collateral below required minimum"
            );
        }

        collateralBalances[msg.sender] = newBalance;
        collateralToken.safeTransfer(msg.sender, _amount);

        emit CollateralWithdrawn(msg.sender, _amount);
    }

    /* -------------------------------------------------------------------------- */
    /*                              LOAN OPERATIONS                               */
    /* -------------------------------------------------------------------------- */

    function takeLoan(uint256 _amount) external {
        require(_amount > 0, "Amount must be > 0");
        require(!loans[msg.sender].isActive, "Existing loan active");

        uint256 maxLoan = (collateralBalances[msg.sender] * collateralFactor) / 100;
        require(_amount <= maxLoan, "Insufficient collateral deposited");

        uint256 requiredCollateral = maxLoan;
        require(
            lendingToken.balanceOf(address(this)) >= _amount,
            "Protocol has insufficient liquidity"
        );

        loans[msg.sender] = Loan({
            amount:     _amount,
            collateral: requiredCollateral,
            isActive:   true
        });

        lendingToken.safeTransfer(msg.sender, _amount);

        emit LoanTaken(msg.sender, _amount, requiredCollateral);
    }

    function repayLoan(uint256 _amount) external {
        Loan storage userLoan = loans[msg.sender];
        require(userLoan.isActive, "No active loan");
        require(_amount > 0 && _amount <= userLoan.amount, "Invalid repayment amount");

        lendingToken.safeTransferFrom(msg.sender, address(this), _amount);

        userLoan.amount -= _amount;

        if (userLoan.amount == 0) {
            userLoan.isActive = false;
            userLoan.collateral = 0;
        }

        emit LoanRepaid(msg.sender, _amount);
    }

    /* -------------------------------------------------------------------------- */
    /*                                 VIEW HELPERS                               */
    /* -------------------------------------------------------------------------- */

    function _loanRequiredCollateral(address _user) internal view returns (uint256) {
        Loan storage userLoan = loans[_user];
        if (!userLoan.isActive) return 0;
        return userLoan.collateral;
    }

    function getLoanDetails(address _user)
        external
        view
        returns (uint256 amount, uint256 collateral, bool isActive)
    {
        Loan storage userLoan = loans[_user];
        return (userLoan.amount, userLoan.collateral, userLoan.isActive);
    }
}