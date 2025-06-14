import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();

  console.log(owner.address);
  console.log(await ethers.provider.getBalance(owner.address));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
