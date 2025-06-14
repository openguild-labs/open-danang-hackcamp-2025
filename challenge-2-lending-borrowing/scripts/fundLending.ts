import { ethers } from "hardhat";

export const fundLendingContract = async ({
  signer,
  tokenAddress,
  contractAddress,
  amount,
  isMintable = true, 
}: {
  signer: any;
  tokenAddress: string;
  contractAddress: string;
  amount: string; 
  isMintable?: boolean;
}) => {
  const abi = isMintable
    ? [
        "function mint(address to, uint256 amount)",
        "function balanceOf(address account) view returns (uint256)",
      ]
    : [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function balanceOf(address account) view returns (uint256)",
      ];

  const token = new ethers.Contract(tokenAddress, abi, signer);
  const amt = ethers.parseUnits(amount, 18);

  console.log(`💰 Nạp ${amount} token vào contract: ${contractAddress}`);

  if (isMintable) {
    const tx = await token.mint(contractAddress, amt);
    await tx.wait();
    console.log("✅ Mint thành công!");
  } else {
    const tx = await token.transfer(contractAddress, amt);
    await tx.wait();
    console.log("✅ Transfer thành công!");
  }

  const balance = await token.balanceOf(contractAddress);
  console.log(
    `📦 Token trong contract: ${ethers.formatUnits(balance, 18)} token`
  );
};

async function main() {
  const [signer] = await ethers.getSigners(); // ✅ Hoạt động với Hardhat

  const tokenAddress = "0x9FBD5A1b99569c346CB1cAaFb780d4a1a9DFfe37";
  const contractAddress = "0xAd2Ed397B4c0bcCbed9dFc588389D15E08Cfc276";
  const amount = "1000"; 
  const isMintable = true; 
  await fundLendingContract({
    signer,
    tokenAddress,
    contractAddress,
    amount,
    isMintable,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});