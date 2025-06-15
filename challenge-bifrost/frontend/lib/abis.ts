export const l2SlpxAbi = [
  {
    inputs: [{ internalType: "address", name: "_owner", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "ETHTransferFailed", type: "error" },
  { inputs: [], name: "InsufficientApproval", type: "error" },
  { inputs: [], name: "InsufficientBalance", type: "error" },
  { inputs: [], name: "InsufficientVTokenBalance", type: "error" },
  { inputs: [], name: "InvalidMinOrderAmount", type: "error" },
  { inputs: [], name: "InvalidOperation", type: "error" },
  { inputs: [], name: "InvalidOrderAmount", type: "error" },
  { inputs: [], name: "InvalidTokenAddress", type: "error" },
  { inputs: [], name: "InvalidTokenConversionRate", type: "error" },
  { inputs: [], name: "InvalidTokenFee", type: "error" },
  { inputs: [], name: "InvalidVTokenAddress", type: "error" },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "tokenAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "enum L2Slpx.Operation",
        name: "operation",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "remark",
        type: "string",
      },
    ],
    name: "CreateOrder",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "addressToTokenConversionInfo",
    outputs: [
      {
        internalType: "enum L2Slpx.Operation",
        name: "operation",
        type: "uint8",
      },
      { internalType: "uint256", name: "minOrderAmount", type: "uint256" },
      { internalType: "uint256", name: "tokenConversionRate", type: "uint256" },
      { internalType: "uint256", name: "orderFee", type: "uint256" },
      { internalType: "address", name: "outputTokenAddress", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "tokenAddress", type: "address" },
    ],
    name: "checkSupportToken",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "tokenAddress", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      {
        internalType: "enum L2Slpx.Operation",
        name: "operation",
        type: "uint8",
      },
      { internalType: "string", name: "remark", type: "string" },
    ],
    name: "createOrder",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "tokenAddress", type: "address" },
    ],
    name: "getTokenConversionInfo",
    outputs: [
      {
        components: [
          {
            internalType: "enum L2Slpx.Operation",
            name: "operation",
            type: "uint8",
          },
          { internalType: "uint256", name: "minOrderAmount", type: "uint256" },
          {
            internalType: "uint256",
            name: "tokenConversionRate",
            type: "uint256",
          },
          { internalType: "uint256", name: "orderFee", type: "uint256" },
          {
            internalType: "address",
            name: "outputTokenAddress",
            type: "address",
          },
        ],
        internalType: "struct L2Slpx.TokenConversionInfo",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "tokenAddress", type: "address" },
    ],
    name: "removeTokenConversionInfo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "tokenAddress", type: "address" },
      {
        internalType: "enum L2Slpx.Operation",
        name: "operation",
        type: "uint8",
      },
      { internalType: "uint256", name: "minOrderAmount", type: "uint256" },
      { internalType: "uint256", name: "tokenConversionRate", type: "uint256" },
      { internalType: "uint256", name: "orderFee", type: "uint256" },
      { internalType: "address", name: "outputTokenAddress", type: "address" },
    ],
    name: "setTokenConversionInfo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "tokenAddress", type: "address" },
    ],
    name: "withdrawFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const yieldDelegationVaultAbi = [
  {
      "type": "constructor",
      "inputs": [
          {
              "name": "_owner",
              "type": "address",
              "internalType": "address"
          },
          {
              "name": "_l2Slpx",
              "type": "address",
              "internalType": "address"
          },
          {
              "name": "_vDOT",
              "type": "address",
              "internalType": "address"
          },
          {
              "name": "_vETH",
              "type": "address",
              "internalType": "address"
          },
          {
              "name": "_minimumDepositAmount",
              "type": "uint256",
              "internalType": "uint256"
          }
      ],
      "stateMutability": "nonpayable"
  },
  {
      "type": "function",
      "name": "addressToDepositorRecord",
      "inputs": [
          {
              "name": "",
              "type": "address",
              "internalType": "address"
          }
      ],
      "outputs": [
          {
              "name": "totalNumberOfDeposits",
              "type": "uint256",
              "internalType": "uint256"
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "currentDepositId",
      "inputs": [],
      "outputs": [
          {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "deposit",
      "inputs": [
          {
              "name": "tokenAddress",
              "type": "address",
              "internalType": "address"
          },
          {
              "name": "amount",
              "type": "uint256",
              "internalType": "uint256"
          }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
  },
  {
      "type": "function",
      "name": "depositIdToDepositRecord",
      "inputs": [
          {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
          }
      ],
      "outputs": [
          {
              "name": "depositId",
              "type": "uint256",
              "internalType": "uint256"
          },
          {
              "name": "indexInDepositorRecord",
              "type": "uint256",
              "internalType": "uint256"
          },
          {
              "name": "depositor",
              "type": "address",
              "internalType": "address"
          },
          {
              "name": "tokenAddress",
              "type": "address",
              "internalType": "address"
          },
          {
              "name": "amountDeposited",
              "type": "uint256",
              "internalType": "uint256"
          },
          {
              "name": "depositConversionRate",
              "type": "uint256",
              "internalType": "uint256"
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "getDepositorRecord",
      "inputs": [
          {
              "name": "depositor",
              "type": "address",
              "internalType": "address"
          }
      ],
      "outputs": [
          {
              "name": "",
              "type": "tuple",
              "internalType": "struct YieldDelegationVault.DepositorRecord",
              "components": [
                  {
                      "name": "depositIds",
                      "type": "uint256[]",
                      "internalType": "uint256[]"
                  },
                  {
                      "name": "totalNumberOfDeposits",
                      "type": "uint256",
                      "internalType": "uint256"
                  }
              ]
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "getVaultDepositRecord",
      "inputs": [
          {
              "name": "depositId",
              "type": "uint256",
              "internalType": "uint256"
          }
      ],
      "outputs": [
          {
              "name": "",
              "type": "tuple",
              "internalType": "struct YieldDelegationVault.VaultDepositRecord",
              "components": [
                  {
                      "name": "depositId",
                      "type": "uint256",
                      "internalType": "uint256"
                  },
                  {
                      "name": "indexInDepositorRecord",
                      "type": "uint256",
                      "internalType": "uint256"
                  },
                  {
                      "name": "depositor",
                      "type": "address",
                      "internalType": "address"
                  },
                  {
                      "name": "tokenAddress",
                      "type": "address",
                      "internalType": "address"
                  },
                  {
                      "name": "amountDeposited",
                      "type": "uint256",
                      "internalType": "uint256"
                  },
                  {
                      "name": "depositConversionRate",
                      "type": "uint256",
                      "internalType": "uint256"
                  }
              ]
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "l2Slpx",
      "inputs": [],
      "outputs": [
          {
              "name": "",
              "type": "address",
              "internalType": "contract IL2Slpx"
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "minimumDepositAmount",
      "inputs": [],
      "outputs": [
          {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "owner",
      "inputs": [],
      "outputs": [
          {
              "name": "",
              "type": "address",
              "internalType": "address"
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "ownerWithdrawYield",
      "inputs": [
          {
              "name": "tokenAddress",
              "type": "address",
              "internalType": "address"
          }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
  },
  {
      "type": "function",
      "name": "renounceOwnership",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
  },
  {
      "type": "function",
      "name": "setMinimumDepositAmount",
      "inputs": [
          {
              "name": "_minimumDepositAmount",
              "type": "uint256",
              "internalType": "uint256"
          }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
  },
  {
      "type": "function",
      "name": "totalAmountOfDotDeposited",
      "inputs": [],
      "outputs": [
          {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "totalAmountOfDotWithdrawn",
      "inputs": [],
      "outputs": [
          {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "totalAmountOfEthDeposited",
      "inputs": [],
      "outputs": [
          {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "totalAmountOfEthWithdrawn",
      "inputs": [],
      "outputs": [
          {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "transferOwnership",
      "inputs": [
          {
              "name": "newOwner",
              "type": "address",
              "internalType": "address"
          }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
  },
  {
      "type": "function",
      "name": "vdot",
      "inputs": [],
      "outputs": [
          {
              "name": "",
              "type": "address",
              "internalType": "contract IVDOT"
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "veth",
      "inputs": [],
      "outputs": [
          {
              "name": "",
              "type": "address",
              "internalType": "contract IVETH"
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "withdraw",
      "inputs": [
          {
              "name": "depositId",
              "type": "uint256",
              "internalType": "uint256"
          }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
  },
  {
      "type": "event",
      "name": "Deposit",
      "inputs": [
          {
              "name": "user",
              "type": "address",
              "indexed": true,
              "internalType": "address"
          },
          {
              "name": "depositId",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
          },
          {
              "name": "tokenAddress",
              "type": "address",
              "indexed": false,
              "internalType": "address"
          },
          {
              "name": "depositedAmount",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
          },
          {
              "name": "depositConversionRate",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
          }
      ],
      "anonymous": false
  },
  {
      "type": "event",
      "name": "OwnerWithdrawYield",
      "inputs": [
          {
              "name": "owner",
              "type": "address",
              "indexed": true,
              "internalType": "address"
          },
          {
              "name": "tokenAddress",
              "type": "address",
              "indexed": false,
              "internalType": "address"
          },
          {
              "name": "withdrawnAmount",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
          },
          {
              "name": "withdrawalConversionRate",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
          }
      ],
      "anonymous": false
  },
  {
      "type": "event",
      "name": "OwnershipTransferred",
      "inputs": [
          {
              "name": "previousOwner",
              "type": "address",
              "indexed": true,
              "internalType": "address"
          },
          {
              "name": "newOwner",
              "type": "address",
              "indexed": true,
              "internalType": "address"
          }
      ],
      "anonymous": false
  },
  {
      "type": "event",
      "name": "Withdraw",
      "inputs": [
          {
              "name": "user",
              "type": "address",
              "indexed": true,
              "internalType": "address"
          },
          {
              "name": "depositId",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
          },
          {
              "name": "tokenAddress",
              "type": "address",
              "indexed": false,
              "internalType": "address"
          },
          {
              "name": "withdrawnAmount",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
          },
          {
              "name": "withdrawalConversionRate",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
          }
      ],
      "anonymous": false
  },
  {
      "type": "error",
      "name": "InsufficientDepositAmount",
      "inputs": []
  },
  {
      "type": "error",
      "name": "InsufficientYield",
      "inputs": []
  },
  {
      "type": "error",
      "name": "InvalidDepositId",
      "inputs": []
  },
  {
      "type": "error",
      "name": "InvalidTokenAddress",
      "inputs": []
  },
  {
      "type": "error",
      "name": "NotDepositor",
      "inputs": []
  },
  {
      "type": "error",
      "name": "OwnableInvalidOwner",
      "inputs": [
          {
              "name": "owner",
              "type": "address",
              "internalType": "address"
          }
      ]
  },
  {
      "type": "error",
      "name": "OwnableUnauthorizedAccount",
      "inputs": [
          {
              "name": "account",
              "type": "address",
              "internalType": "address"
          }
      ]
  }
] as const;