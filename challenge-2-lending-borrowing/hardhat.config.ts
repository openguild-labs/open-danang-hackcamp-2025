import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import dotenv from 'dotenv';
dotenv.config();

// Function to get valid accounts, filtering out undefined values
function getAccounts(): string[] {
    const accounts: string[] = [];

    if (process.env.PRIVATE_KEY) {
        accounts.push(process.env.PRIVATE_KEY);
    }

    if (process.env.PRIVATE_KEY_2) {
        accounts.push(process.env.PRIVATE_KEY_2);
    }

    // If no valid accounts, provide a dummy one for compilation
    if (accounts.length === 0) {
        console.warn('Warning: No PRIVATE_KEY found. Using dummy account for compilation only.');
        accounts.push('0x0000000000000000000000000000000000000000000000000000000000000001');
    }

    return accounts;
}

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.28",
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
            blockGasLimit: 30000000,
            gas: 30000000,
            gasPrice: 8000000000,
            allowUnlimitedContractSize: true,
            accounts: {
                accountsBalance: "10000000000000000000000", // 10000 ETH,
                count: 10,
            },
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 1337,
        },
        paseoAssetHub: {
            url: 'https://testnet-passet-hub-eth-rpc.polkadot.io/',
            chainId: parseInt("0x190f1b45", 16),
            accounts: getAccounts(),
            gasPrice: 20000000000,
            gas: 6000000,
        },
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

export default config;
