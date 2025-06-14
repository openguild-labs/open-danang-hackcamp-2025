// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LendingBorrowing is Ownable {
    // TODO: Define Loan struct in the following format:
    // - amount: The amount of the loan
    // - collateral: The amount of collateral deposited
    // - isActive: Whether the loan is active
    struct Loan{
        uint256 amount;
        uint256 collateral;
        bool isActive;
    }

    // TODO: Define state variables in the following format:
    // - collateralToken: The address of the collateral token
    // - lendingToken: The address of the lending token
    // - collateralFactor: The collateral factor
    // - collateralBalances: A mapping of user addresses to their collateral balances
    // - loans: A mapping of user addresses to their loans
    address public collateralToken;
    address public lendingToken;
    uint256 public collateralFactor;
    mapping(address => uint256) public collateralBalances;
    mapping(address => Loan) public loans;


    // TODO: Define events in the following format:
    // - CollateralDeposited: Emitted when a user deposits collateral
    // - CollateralWithdrawn: Emitted when a user withdraws collateral
    // - LoanTaken: Emitted when a user takes a loan
    // - LoanRepaid: Emitted when a user repays a loan
    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event LoanTaken(address indexed user, uint256 amount);
    event LoanRepaid(address indexed user, uint256 amount);

    constructor(IERC20 _collateralToken, IERC20 _lendingToken, uint256 _collateralFactor) Ownable(msg.sender) {
        // TODO: Implement constructor logic
        require(_collateralFactor <= 100, "Collatereal Factor must be <= 100");
        collateralToken = address(_collateralToken);
        lendingToken = address(_lendingToken);
        collateralFactor = _collateralFactor;
    }

    function setCollateralFactor(uint256 _newFactor) external onlyOwner {
        // TODO: Implement setCollateralFactor logic
        require(_newFactor <= 100, "Collatereal Factor must be <= 100");
        collateralFactor = _newFactor;
    }

    function depositCollateral(uint256 _amount) external {
        // TODO: Implement depositCollateral logic
        require(_amount > 0, "Amount must be > 0");
        collateralBalances[msg.sender] += _amount;
        IERC20(collateralToken).transferFrom(msg.sender, address(this), _amount);
        emit CollateralDeposited(msg.sender, _amount);
    }

    function withdrawCollateral(uint256 _amount) external {
        // TODO: Implement withdrawCollateral logic
        require(_amount > 0, "Amount must be > 0");
        require(collateralBalances[msg.sender] >= _amount, "Insufficient collateral");
        uint256 withdrawLimit = collateralBalances[msg.sender] - _loanRequiredCollateral(msg.sender);
        require(_amount <= withdrawLimit, "Cant withdraw collateral");
        collateralBalances[msg.sender] -= _amount;
        IERC20(collateralToken).transfer(msg.sender, _amount);
        emit CollateralWithdrawn(msg.sender, _amount);
    }

    function takeLoan(uint256 _amount) external {
        // TODO: Implement takeLoan logic
        require(_amount > 0, "Amount must be greater than zero");
        require(loans[msg.sender].isActive == false, "Existing loan must be repaid first");
        uint256 maxLoan = (collateralBalances[msg.sender] * collateralFactor) / 100;
        require(_amount <= maxLoan, "Loan exceeds collateral limit");
        loans[msg.sender] = Loan({
            amount: _amount,
            collateral: collateralBalances[msg.sender],
            isActive: true
        });
        IERC20(lendingToken).transfer(msg.sender, _amount);
        emit LoanTaken(msg.sender, _amount);
    }

    function repayLoan(uint256 _amount) external {
        // TODO: Implement repayLoan logic
        require(_amount > 0, "Amount must be greater than zero");
        Loan storage userLoan = loans[msg.sender];
        require(userLoan.isActive, "No active loan");
        require(_amount <= userLoan.amount, "Repay amount exceeds loan");
        IERC20(lendingToken).transferFrom(msg.sender, address(this), _amount);
        userLoan.amount -= _amount;
        if (userLoan.amount == 0) {
            userLoan.isActive = false;
        }
        emit LoanRepaid(msg.sender, _amount);
    }

    function _loanRequiredCollateral(address _user) internal view returns (uint256) {
        // TODO: Implement _loanRequiredCollateral logic
        Loan memory userLoan = loans[_user];
        if (!userLoan.isActive) return 0;
        return (userLoan.amount * 100) / collateralFactor;
    }

    function getLoanDetails(address _user) external view returns (uint256 amount, uint256 collateral, bool isActive) {
        // TODO: Implement getLoanDetails logic
        Loan memory userLoan = loans[_user];
        return (userLoan.amount, userLoan.collateral, userLoan.isActive);
    }
}
