"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  Wallet,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  Image,
  Send,
  Eye,
  History,
  Coins,
  Zap,
  RefreshCw,
} from "lucide-react";

import { Builder } from "@paraspell/sdk";
import { createClient } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/web";
import { useAccount, useBalance } from "wagmi";
import { useAtomValue } from "jotai";
import { addressAtom } from "@/components/sigpasskit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface NFTMetadata {
  id: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  chain: string;
  status: "minted" | "transferred" | "pending";
  owner: string;
  txHash?: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  type: "mint" | "transfer" | "swap";
  status: "pending" | "success" | "failed";
  from: string;
  to: string;
  hash: string;
  timestamp: string;
  amount?: string;
  nftId?: string;
}

interface SwapData {
  fromToken: string;
  toToken: string;
  amount: string;
  slippage: string;
}

const XCMNFTMarketplace = () => {
  const [activeTab, setActiveTab] = useState("mint");
  const [walletConnected, setWalletConnected] = useState(false);
  const [polkadotAccount, setPolkadotAccount] = useState<any>(null);
  const [api, setApi] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // State for NFT data
  const [nftData, setNftData] = useState({
    name: "",
    description: "",
    image: null as File | null,
    collection: "1",
  });

  // State for transfer data
  const [transferData, setTransferData] = useState({
    nftId: "",
    targetChain: "moonbeam",
    recipient: "",
  });

  // State for swap data
  const [swapData, setSwapData] = useState<SwapData>({
    fromToken: "DOT",
    toToken: "HDX",
    amount: "",
    slippage: "0.5",
  });

  const [mintedNFTs, setMintedNFTs] = useState<NFTMetadata[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balances, setBalances] = useState({
    dot: "0",
    hdx: "0",
  });

  // Get wallet info from existing components
  const account = useAccount();
  const sigpassAddress = useAtomValue(addressAtom);

  // Chain configurations for Paseo testnet
  const chains = [
    {
      id: "AssetHub",
      name: "Paseo Asset Hub",
      color: "bg-blue-500",
      wsUrl: "wss://paseo-asset-hub-rpc.polkadot.io",
      explorer: "https://paseo.subscan.io",
    },
    {
      id: "Hydration",
      name: "Hydration Testnet",
      color: "bg-cyan-500",
      wsUrl: "wss://rpc.hydradx.cloud",
      explorer: "https://hydration.subscan.io",
    },
    {
      id: "Moonbeam",
      name: "Moonbase Alpha",
      color: "bg-purple-500",
      wsUrl: "wss://wss.api.moonbase.moonbeam.network",
      explorer: "https://moonbase.subscan.io",
    },
  ];

  const supportedTokens = [
    { symbol: "DOT", name: "Polkadot", decimals: 10 },
    { symbol: "HDX", name: "HydraDX", decimals: 12 },
    { symbol: "USDT", name: "Tether USD", decimals: 6 },
    { symbol: "USDC", name: "USD Coin", decimals: 6 },
  ];

  // Initialize Polkadot API connection
  useEffect(() => {
    const initializeApi = async () => {
      try {
        const assetHubChain = chains.find((c) => c.id === "AssetHub");
        if (!assetHubChain) return;

        const provider = getWsProvider(assetHubChain.wsUrl);
        const client = createClient(provider);
        setApi(client);
        console.log("Connected to Paseo Asset Hub");
      } catch (error) {
        console.error("Failed to initialize API:", error);
        setError("Failed to connect to Paseo Asset Hub");
      }
    };

    initializeApi();
  }, []);

  // Connect Polkadot wallet
  const connectPolkadotWallet = async () => {
    setLoading(true);
    setError("");

    try {
      if (typeof window !== "undefined" && window.injectedWeb3) {
        const { web3Accounts, web3Enable } = await import(
          "@polkadot/extension-dapp"
        );

        const extensions = await web3Enable("XCM NFT Marketplace");
        if (extensions.length === 0) {
          throw new Error(
            "No Polkadot extension found. Please install Polkadot{.js} extension."
          );
        }

        const accounts = await web3Accounts();
        if (accounts.length === 0) {
          throw new Error("No accounts found in Polkadot extension");
        }

        const selectedAccount = accounts[0];
        setPolkadotAccount(selectedAccount);
        setWalletConnected(true);

        // Mock balance fetch - in real implementation, query chain state
        await fetchBalances(selectedAccount.address);
        setSuccess("Polkadot wallet connected successfully!");
      } else {
        throw new Error("Polkadot extension not detected");
      }
    } catch (error: any) {
      console.error("Wallet connection failed:", error);
      setError(error.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  const fetchBalances = async (address: string) => {
    try {
      // Mock implementation - in real app, query actual balances
      setBalances({
        dot: "125.4567",
        hdx: "89.2341",
      });
    } catch (error) {
      console.error("Failed to fetch balances:", error);
    }
  };

  // Mint NFT on Asset Hub
  const mintNFT = async () => {
    if (!nftData.name || !nftData.description || !polkadotAccount) {
      setError("Please fill all required fields and connect wallet");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: "mint",
        status: "pending",
        from: "Asset Hub",
        to: "Asset Hub",
        hash: txHash,
        timestamp: new Date().toISOString(),
        nftId: (mintedNFTs.length + 1).toString(),
      };

      setTransactions((prev) => [newTransaction, ...prev]);

      // Simulate minting process using Asset Hub NFT pallet
      const nftMetadata: NFTMetadata = {
        id: (mintedNFTs.length + 1).toString().padStart(3, "0"),
        name: nftData.name,
        description: nftData.description,
        image: nftData.image ? URL.createObjectURL(nftData.image) : "🎨",
        collection: nftData.collection,
        chain: "AssetHub",
        status: "pending",
        owner: polkadotAccount.address,
        txHash: txHash,
        createdAt: new Date().toISOString(),
      };

      // In real implementation, this would:
      // 1. Upload metadata to IPFS
      // 2. Create NFT collection if it doesn't exist
      // 3. Mint NFT using nfts.mint extrinsic
      // 4. Monitor transaction status

      setTimeout(() => {
        setMintedNFTs((prev) => [
          { ...nftMetadata, status: "minted" },
          ...prev,
        ]);
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === newTransaction.id ? { ...tx, status: "success" } : tx
          )
        );
        setNftData({ name: "", description: "", image: null, collection: "1" });
        setSuccess(
          `NFT "${nftMetadata.name}" minted successfully on Asset Hub!`
        );
      }, 3000);
    } catch (error: any) {
      console.error("Minting failed:", error);
      setError("Failed to mint NFT: " + error.message);
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === Date.now().toString() ? { ...tx, status: "failed" } : tx
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Transfer NFT using XCM
  const transferNFT = async () => {
    if (
      !transferData.nftId ||
      !transferData.targetChain ||
      !transferData.recipient ||
      !polkadotAccount
    ) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const nft = mintedNFTs.find((n) => n.id === transferData.nftId);
      const targetChain = chains.find((c) => c.id === transferData.targetChain);

      if (!nft || !targetChain) {
        throw new Error("Invalid NFT or target chain");
      }

      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: "transfer",
        status: "pending",
        from: "Asset Hub",
        to: targetChain.name,
        hash: txHash,
        timestamp: new Date().toISOString(),
        nftId: nft.id,
      };

      setTransactions((prev) => [newTransaction, ...prev]);

      // Build XCM transfer using ParaSpell SDK
      try {
        const xcmTransfer = Builder()
          .from("AssetHub")
          .to(transferData.targetChain)
          .currency({
            // NFT asset configuration
            multilocation: {
              parents: 1,
              interior: {
                X2: [
                  { Parachain: 1000 }, // Asset Hub para ID
                  {
                    GeneralIndex: parseInt(nft.collection),
                  },
                ],
              },
            },
          })
          .amount("1") // NFT quantity
          .address(transferData.recipient)
          .build();

        console.log("XCM Transfer built:", xcmTransfer);

        // Simulate successful transfer
        setTimeout(() => {
          setMintedNFTs((prev) =>
            prev.map((nftItem) =>
              nftItem.id === transferData.nftId
                ? {
                    ...nftItem,
                    chain: transferData.targetChain,
                    status: "transferred",
                  }
                : nftItem
            )
          );
          setTransactions((prev) =>
            prev.map((tx) =>
              tx.id === newTransaction.id ? { ...tx, status: "success" } : tx
            )
          );
          setTransferData({
            nftId: "",
            targetChain: "moonbeam",
            recipient: "",
          });
          setSuccess(`NFT transferred successfully to ${targetChain.name}!`);
        }, 4000);
      } catch (xcmError) {
        console.error("XCM transfer failed:", xcmError);
        throw new Error("XCM transfer configuration failed");
      }
    } catch (error: any) {
      console.error("Transfer failed:", error);
      setError("Failed to transfer NFT: " + error.message);
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === Date.now().toString() ? { ...tx, status: "failed" } : tx
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Swap tokens on Hydration
  const swapTokens = async () => {
    if (!swapData.amount || !polkadotAccount) {
      setError("Please enter amount and connect wallet");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: "swap",
        status: "pending",
        from: swapData.fromToken,
        to: swapData.toToken,
        hash: txHash,
        timestamp: new Date().toISOString(),
        amount: swapData.amount,
      };

      setTransactions((prev) => [newTransaction, ...prev]);

      // Build XCM swap using ParaSpell SDK for Hydration
      try {
        const xcmSwap = Builder()
          .from("AssetHub")
          .to("Hydration")
          .currency(swapData.fromToken)
          .amount(swapData.amount)
          .address(polkadotAccount.address)
          .build();

        console.log("XCM Swap built:", xcmSwap);

        // Simulate successful swap
        setTimeout(() => {
          setTransactions((prev) =>
            prev.map((tx) =>
              tx.id === newTransaction.id ? { ...tx, status: "success" } : tx
            )
          );
          // Update balances after swap
          fetchBalances(polkadotAccount.address);
          setSwapData({ ...swapData, amount: "" });
          setSuccess(
            `Successfully swapped ${swapData.amount} ${swapData.fromToken} for ${swapData.toToken}!`
          );
        }, 3000);
      } catch (swapError) {
        console.error("XCM swap failed:", swapError);
        throw new Error("XCM swap configuration failed");
      }
    } catch (error: any) {
      console.error("Swap failed:", error);
      setError("Failed to swap tokens: " + error.message);
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === Date.now().toString() ? { ...tx, status: "failed" } : tx
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNftData((prev) => ({ ...prev, image: file }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                <span className="text-xl">🔗</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  XCM NFT Marketplace
                </h1>
                <p className="text-sm text-gray-300">
                  Paseo Testnet | Cross-chain NFT & Token operations
                </p>
              </div>
            </div>

            {!walletConnected ? (
              <Button
                onClick={connectPolkadotWallet}
                disabled={loading}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Wallet className="w-4 h-4 mr-2" />
                )}
                Connect Polkadot Wallet
              </Button>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="text-right text-sm">
                  <p className="text-gray-300">DOT: {balances.dot}</p>
                  <p className="text-gray-300">HDX: {balances.hdx}</p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-500/20 text-green-400"
                >
                  {polkadotAccount?.address?.slice(0, 6)}...
                  {polkadotAccount?.address?.slice(-4)}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {error && (
          <Card className="mb-6 border-red-500/30 bg-red-500/10">
            <CardContent className="p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError("")}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                ×
              </Button>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="mb-6 border-green-500/30 bg-green-500/10">
            <CardContent className="p-4 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400">{success}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSuccess("")}
                className="ml-auto text-green-400 hover:text-green-300"
              >
                ×
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-8"
        >
          <TabsList className="bg-white/10 border-0">
            <TabsTrigger
              value="mint"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900"
            >
              <Image className="w-4 h-4 mr-2" />
              Mint NFT
            </TabsTrigger>
            <TabsTrigger
              value="transfer"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900"
            >
              <Send className="w-4 h-4 mr-2" />
              Transfer NFT
            </TabsTrigger>
            <TabsTrigger
              value="swap"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900"
            >
              <Zap className="w-4 h-4 mr-2" />
              Swap Tokens
            </TabsTrigger>
            <TabsTrigger
              value="gallery"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900"
            >
              <Eye className="w-4 h-4 mr-2" />
              My NFTs
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900"
            >
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Mint NFT Tab */}
          <TabsContent value="mint">
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">
                  Mint NFT on Paseo Asset Hub
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Collection ID
                      </label>
                      <Input
                        type="number"
                        value={nftData.collection}
                        onChange={(e) =>
                          setNftData((prev) => ({
                            ...prev,
                            collection: e.target.value,
                          }))
                        }
                        className="bg-white/5 border-white/20 text-white"
                        placeholder="Enter collection ID"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        NFT Name
                      </label>
                      <Input
                        value={nftData.name}
                        onChange={(e) =>
                          setNftData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="bg-white/5 border-white/20 text-white"
                        placeholder="Enter NFT name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <Textarea
                        value={nftData.description}
                        onChange={(e) =>
                          setNftData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="bg-white/5 border-white/20 text-white"
                        placeholder="Describe your NFT"
                        rows={4}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Upload Image
                    </label>
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        {nftData.image ? (
                          <div className="space-y-2">
                            <img
                              src={URL.createObjectURL(nftData.image)}
                              alt="Preview"
                              className="w-24 h-24 object-cover rounded-lg mx-auto"
                            />
                            <p className="text-green-400">Image uploaded</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                            <p className="text-gray-400">
                              Click to upload image
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                <Card className="bg-blue-500/20 border-blue-500/30">
                  <CardContent className="p-4">
                    <h3 className="text-blue-400 font-medium mb-2">
                      Minting Process
                    </h3>
                    <div className="text-sm text-blue-200 space-y-1">
                      <p>• NFT will be minted on Paseo Asset Hub</p>
                      <p>• Collection #{nftData.collection} will be used</p>
                      <p>• You can transfer it to any parachain using XCM</p>
                      <p>• Metadata stored on-chain for permanence</p>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={mintNFT}
                  disabled={
                    !walletConnected ||
                    loading ||
                    !nftData.name ||
                    !nftData.description
                  }
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Image className="w-4 h-4 mr-2" />
                  )}
                  {loading ? "Minting..." : "Mint NFT on Asset Hub"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transfer NFT Tab */}
          <TabsContent value="transfer">
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">
                  Transfer NFT via XCM
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Select NFT
                      </label>
                      <select
                        value={transferData.nftId}
                        onChange={(e) =>
                          setTransferData((prev) => ({
                            ...prev,
                            nftId: e.target.value,
                          }))
                        }
                        className="w-full bg-white/5 border border-white/20 rounded-md px-3 py-2 text-white"
                      >
                        <option value="">Choose an NFT</option>
                        {mintedNFTs
                          .filter((nft) => nft.chain === "AssetHub")
                          .map((nft) => (
                            <option key={nft.id} value={nft.id}>
                              {nft.name} (#{nft.id})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Target Chain
                      </label>
                      <select
                        value={transferData.targetChain}
                        onChange={(e) =>
                          setTransferData((prev) => ({
                            ...prev,
                            targetChain: e.target.value,
                          }))
                        }
                        className="w-full bg-white/5 border border-white/20 rounded-md px-3 py-2 text-white"
                      >
                        {chains
                          .filter((chain) => chain.id !== "AssetHub")
                          .map((chain) => (
                            <option key={chain.id} value={chain.id}>
                              {chain.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Recipient Address
                      </label>
                      <Input
                        value={transferData.recipient}
                        onChange={(e) =>
                          setTransferData((prev) => ({
                            ...prev,
                            recipient: e.target.value,
                          }))
                        }
                        className="bg-white/5 border-white/20 text-white"
                        placeholder="Enter recipient address"
                      />
                    </div>
                  </div>

                  <Card className="bg-blue-500/20 border-blue-500/30">
                    <CardContent className="p-4">
                      <h3 className="text-blue-400 font-medium mb-2">
                        XCM Transfer Process
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-blue-200 mb-3">
                        <span>Asset Hub</span>
                        <ArrowRight className="w-4 h-4" />
                        <span>XCM Message</span>
                        <ArrowRight className="w-4 h-4" />
                        <span>
                          {
                            chains.find(
                              (c) => c.id === transferData.targetChain
                            )?.name
                          }
                        </span>
                      </div>
                      <div className="text-xs text-blue-300 space-y-1">
                        <p>• Uses ParaSpell SDK for XCM construction</p>
                        <p>• Secure cross-chain transfer via Polkadot XCM</p>
                        <p>• NFT ownership preserved across chains</p>
                        <p>• Automatic execution on target parachain</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Button
                  onClick={transferNFT}
                  disabled={
                    !walletConnected ||
                    loading ||
                    !transferData.nftId ||
                    !transferData.recipient
                  }
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {loading ? "Transferring..." : "Transfer via XCM"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Swap Tokens Tab */}
          <TabsContent value="swap">
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">
                  Swap Tokens on Hydration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        From Token
                      </label>
                      <select
                        value={swapData.fromToken}
                        onChange={(e) =>
                          setSwapData((prev) => ({
                            ...prev,
                            fromToken: e.target.value,
                          }))
                        }
                        className="w-full bg-white/5 border border-white/20 rounded-md px-3 py-2 text-white"
                      >
                        {supportedTokens.map((token) => (
                          <option key={token.symbol} value={token.symbol}>
                            {token.symbol} - {token.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        To Token
                      </label>
                      <select
                        value={swapData.toToken}
                        onChange={(e) =>
                          setSwapData((prev) => ({
                            ...prev,
                            toToken: e.target.value,
                          }))
                        }
                        className="w-full bg-white/5 border border-white/20 rounded-md px-3 py-2 text-white"
                      >
                        {supportedTokens
                          .filter(
                            (token) => token.symbol !== swapData.fromToken
                          )
                          .map((token) => (
                            <option key={token.symbol} value={token.symbol}>
                              {token.symbol} - {token.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Amount
                      </label>
                      <Input
                        type="number"
                        value={swapData.amount}
                        onChange={(e) =>
                          setSwapData((prev) => ({
                            ...prev,
                            amount: e.target.value,
                          }))
                        }
                        className="bg-white/5 border-white/20 text-white"
                        placeholder="Enter amount to swap"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Available:{" "}
                        {swapData.fromToken === "DOT"
                          ? balances.dot
                          : balances.hdx}{" "}
                        {swapData.fromToken}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Slippage Tolerance (%)
                      </label>
                      <Input
                        type="number"
                        value={swapData.slippage}
                        onChange={(e) =>
                          setSwapData((prev) => ({
                            ...prev,
                            slippage: e.target.value,
                          }))
                        }
                        className="bg-white/5 border-white/20 text-white"
                        placeholder="0.5"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Card className="bg-cyan-500/20 border-cyan-500/30">
                      <CardContent className="p-4">
                        <h3 className="text-cyan-400 font-medium mb-2">
                          Hydration DEX
                        </h3>
                        <div className="text-sm text-cyan-200 space-y-1">
                          <p>• Omnipool AMM with efficient pricing</p>
                          <p>• Low slippage for major token pairs</p>
                          <p>• Cross-chain swaps via XCM</p>
                          <p>• Automatic execution and settlement</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/20">
                      <CardContent className="p-4">
                        <h3 className="text-white font-medium mb-2">
                          Swap Preview
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">You pay:</span>
                            <span className="text-white">
                              {swapData.amount || "0"} {swapData.fromToken}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">You receive:</span>
                            <span className="text-white">
                              ~
                              {swapData.amount
                                ? (parseFloat(swapData.amount) * 0.95).toFixed(
                                    4
                                  )
                                : "0"}{" "}
                              {swapData.toToken}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">
                              Exchange rate:
                            </span>
                            <span className="text-white">
                              1 {swapData.fromToken} = 0.95 {swapData.toToken}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Network fee:</span>
                            <span className="text-white">~0.001 DOT</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Button
                  onClick={swapTokens}
                  disabled={!walletConnected || loading || !swapData.amount}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  {loading
                    ? "Swapping..."
                    : `Swap ${swapData.fromToken} for ${swapData.toToken}`}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">My NFT Collection</CardTitle>
              </CardHeader>
              <CardContent>
                {mintedNFTs.length === 0 ? (
                  <div className="text-center py-12">
                    <Image className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No NFTs minted yet</p>
                    <p className="text-gray-500">
                      Start by minting your first NFT!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mintedNFTs.map((nft) => {
                      const chain = chains.find((c) => c.id === nft.chain);
                      return (
                        <Card
                          key={nft.id}
                          className="bg-white/5 border-white/20"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="text-2xl">
                                {typeof nft.image === "string" &&
                                nft.image.startsWith("blob:") ? (
                                  <img
                                    src={nft.image}
                                    alt={nft.name}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                ) : (
                                  <span>🎨</span>
                                )}
                              </div>
                              <Badge className={`${chain?.color} text-white`}>
                                {chain?.name}
                              </Badge>
                            </div>
                            <h3 className="text-white font-medium mb-2">
                              {nft.name}
                            </h3>
                            <p className="text-gray-400 text-sm mb-2">
                              {nft.description}
                            </p>
                            <p className="text-gray-400 text-sm mb-4">
                              Token ID: #{nft.id} | Collection: #
                              {nft.collection}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge
                                variant={
                                  nft.status === "minted"
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  nft.status === "minted"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-blue-500/20 text-blue-400"
                                }
                              >
                                {nft.status === "minted"
                                  ? "Minted"
                                  : "Transferred"}
                              </Badge>
                              {nft.txHash && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-purple-400 hover:text-purple-300 p-0"
                                  onClick={() => {
                                    const chain = chains.find(
                                      (c) => c.id === nft.chain
                                    );
                                    if (chain) {
                                      window.open(
                                        `${chain.explorer}/extrinsic/${nft.txHash}`,
                                        "_blank"
                                      );
                                    }
                                  }}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">
                        No transactions yet
                      </p>
                      <p className="text-gray-500">
                        Your operations will appear here
                      </p>
                    </div>
                  ) : (
                    transactions.map((tx) => (
                      <Card key={tx.id} className="bg-white/5 border-white/20">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                tx.type === "mint"
                                  ? "bg-green-500/20"
                                  : tx.type === "transfer"
                                  ? "bg-blue-500/20"
                                  : "bg-cyan-500/20"
                              }`}
                            >
                              {tx.type === "mint" ? (
                                <Image className="w-5 h-5 text-green-400" />
                              ) : tx.type === "transfer" ? (
                                <Send className="w-5 h-5 text-blue-400" />
                              ) : (
                                <Zap className="w-5 h-5 text-cyan-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {tx.type === "mint"
                                  ? "Minted NFT"
                                  : tx.type === "transfer"
                                  ? "Transferred NFT"
                                  : `Swapped ${tx.amount} ${tx.from}`}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {tx.from} → {tx.to}
                              </p>
                              <p className="text-gray-500 text-xs">{tx.hash}</p>
                              <p className="text-gray-500 text-xs">
                                {new Date(tx.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <Badge
                              variant={
                                tx.status === "success"
                                  ? "default"
                                  : tx.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className={
                                tx.status === "success"
                                  ? "bg-green-500/20 text-green-400"
                                  : tx.status === "pending"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-red-500/20 text-red-400"
                              }
                            >
                              {tx.status === "success" ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : tx.status === "pending" ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <AlertCircle className="w-3 h-3 mr-1" />
                              )}
                              <span className="capitalize">{tx.status}</span>
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-purple-400 hover:text-purple-300 p-0"
                              onClick={() => {
                                window.open(
                                  `https://paseo.subscan.io/extrinsic/${tx.hash}`,
                                  "_blank"
                                );
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sidebar Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Chain Status */}
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Chain Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {chains.map((chain) => (
                <div
                  key={chain.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${chain.color}`}
                    ></div>
                    <span className="text-white">{chain.name}</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-300">NFTs Minted</span>
                <span className="text-white font-medium">
                  {mintedNFTs.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Cross-chain Transfers</span>
                <span className="text-white font-medium">
                  {transactions.filter((tx) => tx.type === "transfer").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Token Swaps</span>
                <span className="text-white font-medium">
                  {transactions.filter((tx) => tx.type === "swap").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Success Rate</span>
                <span className="text-white font-medium">
                  {transactions.length > 0
                    ? Math.round(
                        (transactions.filter((tx) => tx.status === "success")
                          .length /
                          transactions.length) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
            </CardContent>
          </Card>

          {/* XCM Info */}
          <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white">XCM Protocol</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm mb-4">
                Cross-Consensus Messaging enables secure communication between
                different blockchains in the Polkadot ecosystem.
              </p>
              <div className="space-y-2 text-sm text-gray-300 mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Secure asset transfers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Cross-chain interoperability</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Powered by ParaSpell SDK</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Paseo testnet integration</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-purple-400 hover:text-purple-300 p-0"
                onClick={() => {
                  window.open(
                    "https://wiki.polkadot.network/docs/learn-xcm",
                    "_blank"
                  );
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Learn more about XCM
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default XCMNFTMarketplace;
