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

- [x] Finish `pallet-vesting` runtime
- [x] Finish `pallet-native-pools` runtime
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

## Submissions for vesting pallets

### Test cases all pass

![Vesting](https://drive.google.com/uc?export=view&id=1_1PWkrvosrhVsRXEmzoKfoVbo8vzYYPN)

Add additional test case for `force_remove_vesting_schedule`

```
#[test]
fn force_remove_vesting_schedule_works() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		// Create two vesting schedules
		let schedule1 = VestingSchedule {
			start: 2u64,
			period: 10u64,
			period_count: 3u32,
			per_period: 100u64,
		}; // total=300
		let schedule2 = VestingSchedule {
			start: 5u64,
			period: 5u64,
			period_count: 4u32,
			per_period: 50u64,
		}; // total=200

		// Create vesting schedules for BOB
		assert_ok!(Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule1));
		assert_ok!(Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule2.clone()));

		// Verify initial state
		let total_transferred = 300 + 200;
		assert_eq!(PalletBalances::free_balance(&BOB), total_transferred);
		let initial_schedules = VestingSchedules::<Runtime>::get(&BOB);
		assert_eq!(initial_schedules.len(), 2);

		// Try to remove schedule with non-root origin (should fail)
		assert_noop!(
			Vesting::force_remove_vesting_schedule(RuntimeOrigin::signed(ALICE), BOB, 0),
			DispatchError::BadOrigin
		);

		// Try to remove schedule with invalid index (should fail)
		assert_noop!(
			Vesting::force_remove_vesting_schedule(RuntimeOrigin::root(), BOB, 2),
			Error::<Runtime>::InvalidVestingIndex
		);

		// Remove first schedule (index 0)
		assert_ok!(Vesting::force_remove_vesting_schedule(RuntimeOrigin::root(), BOB, 0));

		// Verify state after removal
		let remaining_schedules = VestingSchedules::<Runtime>::get(&BOB);
		assert_eq!(remaining_schedules.len(), 1);
		assert_eq!(remaining_schedules[0], schedule2);

		// Verify lock amount is updated
		let locks = PalletBalances::locks(&BOB);
		assert_eq!(locks[0].amount, 200); // Only schedule2 remains (200 total)

		// Remove second schedule (index 0 since we removed the first one)
		assert_ok!(Vesting::force_remove_vesting_schedule(RuntimeOrigin::root(), BOB, 0));

		// Verify all schedules are removed
		let final_schedules = VestingSchedules::<Runtime>::get(&BOB);
		assert_eq!(final_schedules.len(), 0);

		// Verify lock is removed
		let final_locks = PalletBalances::locks(&BOB);
		assert_eq!(final_locks.len(), 0);
	});
}
```

### Click on the below images to watch the video.

### Successful Vested Transfer And Claiming Vested Tokens

This simulation shows:

- a standard vested_transfer works correctly, locks the funds, and creates a vesting schedule. It corresponds to `vested_transfer_works` in `tests.rs`.

- a recipient can claim tokens that have vested over time. It corresponds to `claim_works` in `tests.rs`.

Video:

```
https://youtu.be/qiq1HjmwqoA
```

[![Successful Vested Transfer And Claiming Vested Tokens](https://img.youtube.com/vi/qiq1HjmwqoA/maxresdefault.jpg)](https://youtu.be/qiq1HjmwqoA)

### Invalid Vesting Schedule Parameters

This simulation ensures that a `vested_transfer` will fail if the schedule has a period or period count of zero. It corresponds to `vested_transfer_fails_if_zero_period_or_count` in `tests.rs`.

Video:

```
https://youtu.be/AbTQ29Ja5MY
```

[![Invalid Vesting Schedule Parameters](https://img.youtube.com/vi/AbTQ29Ja5MY/maxresdefault.jpg)](https://youtu.be/AbTQ29Ja5MY)

### Updating Vesting Schedules (Sudo)

This simulation shows that a privileged account (Root origin) can update the vesting schedules for any account. It corresponds to `update_vesting_schedules_works` in `tests.rs`.

Video:

```
https://youtu.be/OebEBDlAetk
```

[![Updating Vesting Schedules (Sudo)](https://img.youtube.com/vi/OebEBDlAetk/maxresdefault.jpg)](https://youtu.be/OebEBDlAetk)

### Force remove vesting schedules

This simulation shows the logic when force remove vesting schedules. It corresponds to `force_remove_vesting_schedule_works` in `tests.rs`.

Video:

```
https://youtu.be/_Dn5y5Ns4tU
```

[![Force remove vesting schedules](https://img.youtube.com/vi/_Dn5y5Ns4tU/maxresdefault.jpg)](https://youtu.be/_Dn5y5Ns4tU)

### Claiming with Multiple Schedules

This simulation shows the claim logic when an account has multiple, overlapping vesting schedules. It corresponds to `multiple_vesting_schedule_claim_works` in `tests.rs`.

Video:

```
https://youtu.be/GQZQAUFtbQw
```

[![Claiming with Multiple Schedules](https://img.youtube.com/vi/GQZQAUFtbQw/maxresdefault.jpg)](https://youtu.be/GQZQAUFtbQw)

## Submissions for native_pools pallets

### Test cases pass

![Native Pools Test](https://drive.google.com/uc?export=view&id=1Ru212gEM_lH6zcg-6XTa5vm41xGOxUFM)
