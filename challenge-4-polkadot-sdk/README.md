## Challenge details

Polkadot SDK provides a framework for building custom blockchains (parachains) with modular runtime pallets. It enables developers to create specialized blockchain solutions with custom functionality.

## Hackers can choose one of the following features:

1. Vesting:

- Vesting schedule creation
- Vesting amount calculation
- Vesting claim processing
- Vesting schedule updates

2. Native Pool:

NativePool provides a service where people can deposit native token and they will receive daily rewards. Users must be able to take out their deposits along with their portion of rewards at any time. New rewards are deposited manually into the pool by the NativePool team each daily using a contract function.

- Requirements:

* Only the team can deposit rewards.
* Deposited rewards go to the pool of users, not to individual users.
* Users should be able to withdraw their deposits along with their share of rewards considering the time when they deposited.

## Submission Requirements

- [x] Finish `pallet-vesting`/ `pallet-native-pool` runtime
- [x] Finish mocks and tests
- [x] Record a video that run/simulate the logic on Polkadot JS explorer.

## How to run minimal template

### Prerequisites

Completed the Install [Polkadot SDK Dependencies](https://docs.polkadot.com/develop/parachains/install-polkadot-sdk/) guide and successfully installed [Rust](https://www.rust-lang.org/) and the required packages to set up your development environment

### Step 1: Install `polkadot-omni-node`

```sh
cargo install --locked polkadot-omni-node@0.5.0
```

### Step 2: Install `staging-chain-spec-builder`

```sh
cargo install --locked staging-chain-spec-builder@10.0.0
```

### Step 3: Build both node & runtime

```sh
cargo build --workspace --release
```

### Step 4: Use chain-spec-builder to generate the chain_spec.json file

```sh
chain-spec-builder create --relay-chain "dev" --para-id 1000 --runtime \
    target/release/wbuild/minimal-template-runtime/minimal_template_runtime.wasm named-preset development
```

### Step 5: Run Omni Node

Start Omni Node in development mode (sets up block production and finalization based on manual seal,
sealing a new block every 3 seconds), with a minimal template runtime chain spec.

```sh
polkadot-omni-node --chain <path/to/chain_spec.json> --dev
```
