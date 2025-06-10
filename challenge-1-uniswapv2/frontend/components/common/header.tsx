"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, ChevronDown, Copy, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SigpassKit from "../sigpasskit";

export function Header() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0.0");

  const connectWallet = async () => {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          // Mock balance - in real app, fetch from blockchain
          setBalance("2.45");
        }
      } else {
        alert("Please install MetaMask!");
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAccount("");
    setBalance("0.0");
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(account);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tizun Swap
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <SigpassKit />
        </div>
      </div>
    </header>
  );
}
