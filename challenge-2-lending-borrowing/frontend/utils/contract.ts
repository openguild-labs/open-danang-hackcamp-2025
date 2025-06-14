import { ethers } from "ethers";
import LendingBorrowingABI from "./LendingBorrowing.json"; 

export const CONTRACT_ADDRESS = "0xAd2Ed397B4c0bcCbed9dFc588389D15E08Cfc276"; 

export function getLendingContract(signerOrProvider: any) {
  console.log(LendingBorrowingABI.abi)
  return new ethers.Contract(CONTRACT_ADDRESS, LendingBorrowingABI.abi, signerOrProvider);
}
