import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@parity/hardhat-polkadot';
import dotenv from 'dotenv';
dotenv.config();

function getAccounts(): string[] {
    const accounts: string[] = [];

    if (process.env.PRIVATE_KEY) {
        accounts.push(process.env.PRIVATE_KEY);
    }

    if (accounts.length === 0) {
        accounts.push('0x0000000000000000000000000000000000000000000000000000000000000001');
    }

    return accounts;
}

const config: HardhatUserConfig = {
    solidity: '0.8.28',
    resolc: {
        compilerSource: 'npm',
    },
    networks: {
        hardhat: {
            polkavm: true,
        },
        paseoAssetHub: {
            polkavm: true,
            url: 'https://testnet-passet-hub-eth-rpc.polkadot.io/',
            accounts: getAccounts(),
        },
    }
};

export default config;
