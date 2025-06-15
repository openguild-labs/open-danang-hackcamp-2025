//SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

contract Storage {
    uint256 public storedNumber;

    constructor(uint256 _initialNumber) {
        storedNumber = _initialNumber;
    }

    function setNumber(uint256 _number) external {
        storedNumber = _number;
    }
}