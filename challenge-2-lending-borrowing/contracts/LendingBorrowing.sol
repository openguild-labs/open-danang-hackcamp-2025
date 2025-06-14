// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LendingBorrowing is Ownable {
    struct Loan {
        uint256 amount;
        uint256 collateral;
        bool isActive;
    }

    IERC20 public collateralToken;
    IERC20 public lendingToken;
    uint256 public collateralFactor;
    mapping(address => uint256) public collateralBalances;
    mapping(address => Loan) public loans;

    event CollateralFactorUpdated(uint256 newFactor);
    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event LoanTaken(address indexed user, uint256 amount);
    event LoanRepaid(address indexed user, uint256 amount);

    constructor(
        IERC20 _collateralToken,
        IERC20 _lendingToken,
        uint256 _collateralFactor
    ) Ownable(msg.sender) {
        collateralToken = _collateralToken;
        lendingToken = _lendingToken;
        collateralFactor = _collateralFactor;
    }

    function setCollateralFactor(uint256 _newFactor) external onlyOwner {
        require(_newFactor > 0, "Collateral factor must be greater than zero");
        require(_newFactor <= 100, "Collateral factor must not exceed 100%");
        collateralFactor = _newFactor;
        emit CollateralFactorUpdated(_newFactor);
    }

    function depositCollateral(uint256 _amount) external {
        require(_amount > 0, "Deposit amount must be greater than zero");
        collateralBalances[msg.sender] += _amount;
        collateralToken.transferFrom(msg.sender, address(this), _amount);
        emit CollateralDeposited(msg.sender, _amount);
    }

    function withdrawCollateral(uint256 _amount) external {
        require(_amount > 0, "Withdrawal amount must be greater than zero");
        Loan memory loan = loans[msg.sender];
        require(!loan.isActive, "Cannot withdraw locked collateral");
        uint256 currentCollateral = collateralBalances[msg.sender];
        require(
            currentCollateral >= _amount,
            "Insufficient collateral balance"
        );
        collateralBalances[msg.sender] -= _amount;
        collateralToken.transfer(msg.sender, _amount);
        emit CollateralWithdrawn(msg.sender, _amount);
    }

    function takeLoan(uint256 _amount) external {
        Loan memory loan = loans[msg.sender];
        require(!loan.isActive, "Existing loan must be repaid first");
        require(_amount > 0, "Loan amount must be greater than zero");
        uint256 maxBorrowable = _maxBorrowableAmount(msg.sender);
        require(maxBorrowable >= _amount, "Insufficient collateral for loan");

        uint256 currentCollateral = collateralBalances[msg.sender];
        collateralBalances[msg.sender] -= currentCollateral;

        loans[msg.sender] = Loan({
            amount: _amount,
            collateral: currentCollateral,
            isActive: true
        });

        lendingToken.transfer(msg.sender, _amount);
        emit LoanTaken(msg.sender, _amount);
    }

    function repayLoan(uint256 _amount) external {
        require(_amount > 0, "Repayment amount must be greater than zero");
        Loan storage loan = loans[msg.sender];
        require(loan.isActive, "No active loan found for user");
        require(_amount <= loan.amount, "Repayment amount exceeds loan amount");

        loan.amount -= _amount;

        if (loan.amount == 0) {
            loan.isActive = false;
            collateralBalances[msg.sender] += loan.collateral;
            loan.collateral = 0;
        }

        lendingToken.transferFrom(msg.sender, address(this), _amount);
        emit LoanRepaid(msg.sender, _amount);
    }

    function _maxBorrowableAmount(
        address _user
    ) internal view returns (uint256) {
        return (collateralBalances[_user] * collateralFactor) / 100;
    }

    function getLoanDetails(
        address _user
    )
        external
        view
        returns (uint256 amount, uint256 collateral, bool isActive)
    {
        Loan memory loan = loans[_user];
        return (loan.amount, loan.collateral, loan.isActive);
    }
}
