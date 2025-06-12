require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

// Function to get accounts array with proper validation
function getAccounts() {
    const privateKey = process.env.PRIVATE_KEY;

    // If no private key, return a dummy account for compilation (won't work for deployment)
    if (!privateKey || privateKey.trim() === '' || privateKey === 'your_private_key_here') {
        console.warn('Warning: PRIVATE_KEY not set in .env file. Using dummy account for compilation only.');
        return ['0x0000000000000000000000000000000000000000000000000000000000000001'];
    }

    // Ensure proper format (add 0x prefix if not present)
    const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

    // Basic validation - private key should be 64 hex characters (+ 0x prefix)
    if (formattedKey.length !== 66) {
        console.warn('Warning: PRIVATE_KEY appears to be invalid length. Using dummy account.');
        return ['0x0000000000000000000000000000000000000000000000000000000000000001'];
    }

    return [formattedKey];
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.26",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        hardhat: {
            chainId: 1337,
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 1337,
        },
        paseo: {
            url: "https://testnet-passet-hub-eth-rpc.polkadot.io/",
            chainId: 420420421.,
            accounts: getAccounts(),
            gasPrice: 20000000000,
            gas: 6000000,
        },
    },
    etherscan: {
        apiKey: {
            paseo: "dummy-key"
        },
        customChains: [
            {
                network: "paseo",
                chainId: 420420421,
                urls: {
                    apiURL: "https://blockscout-passet-hub.parity-testnet.parity.io/api",
                    browserURL: "https://blockscout-passet-hub.parity-testnet.parity.io/"
                }
            }
        ]
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS !== undefined,
        currency: "USD",
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
};
