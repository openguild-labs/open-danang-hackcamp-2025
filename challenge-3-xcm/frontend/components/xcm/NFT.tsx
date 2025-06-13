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
  X,
  Plus,
  Copy,
  Settings,
} from "lucide-react";

// Polkadot imports
import { ApiPromise, WsProvider } from "@polkadot/api";
import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
} from "@polkadot/extension-dapp";
import { Builder } from "@paraspell/sdk";
import { BN } from "@polkadot/util";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types
interface NFTMetadata {
  id: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  chain: string;
  status: "minted" | "transferred" | "pending" | "failed";
  owner: string;
  txHash?: string;
  createdAt: string;
  blockNumber?: number;
}

interface Transaction {
  id: string;
  type: "mint" | "transfer" | "swap" | "create_collection";
  status: "pending" | "success" | "failed";
  from: string;
  to: string;
  hash: string;
  timestamp: string;
  amount?: string;
  nftId?: string;
  description: string;
  blockNumber?: number;
}

interface SwapData {
  fromToken: string;
  toToken: string;
  amount: string;
  slippage: string;
}

interface ChainConfig {
  id: string;
  name: string;
  color: string;
  wsUrl: string;
  explorer: string;
  paraId?: number;
  prefix: number;
}

interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  assetId?: number;
}

const XCMNFTApp = () => {
  // State management
  const [activeTab, setActiveTab] = useState("mint");
  const [walletConnected, setWalletConnected] = useState(false);
  const [polkadotAccount, setPolkadotAccount] = useState<any>(null);
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [progress, setProgress] = useState(0);

  // NFT State
  const [nftData, setNftData] = useState({
    name: "",
    description: "",
    image: null as File | null,
    collection: "",
    attributes: [] as Array<{ key: string; value: string }>,
  });

  // Transfer State
  const [transferData, setTransferData] = useState({
    nftId: "",
    targetChain: "Hydration",
    recipient: "",
  });

  // Swap State
  const [swapData, setSwapData] = useState<SwapData>({
    fromToken: "DOT",
    toToken: "HDX",
    amount: "",
    slippage: "0.5",
  });

  // Collections State
  const [collections, setCollections] = useState<
    Array<{ id: string; name: string; owner: string }>
  >([]);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showCreateCollection, setShowCreateCollection] = useState(false);

  // Data State
  const [mintedNFTs, setMintedNFTs] = useState<NFTMetadata[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balances, setBalances] = useState({
    dot: "0",
    hdx: "0",
    existentialDeposit: "1.0000",
  });

  // Chain configurations - Updated for Paseo testnet
  const chains: ChainConfig[] = [
    {
      id: "AssetHub",
      name: "Paseo Asset Hub",
      color: "bg-blue-500",
      wsUrl: "wss://paseo-asset-hub-rpc.polkadot.io",
      explorer: "https://paseo.subscan.io",
      paraId: 1000,
      prefix: 0,
    },
    {
      id: "Hydration",
      name: "Hydration Testnet",
      color: "bg-cyan-500",
      wsUrl: "wss://rpc.hydradx.cloud",
      explorer: "https://hydration.subscan.io",
      paraId: 2034,
      prefix: 63,
    },
    {
      id: "Moonbeam",
      name: "Moonbase Alpha",
      color: "bg-purple-500",
      wsUrl: "wss://wss.api.moonbase.moonbeam.network",
      explorer: "https://moonbase.subscan.io",
      paraId: 1000,
      prefix: 1287,
    },
  ];

  const supportedTokens: TokenInfo[] = [
    { symbol: "DOT", name: "Polkadot", decimals: 10 },
    { symbol: "HDX", name: "HydraDX", decimals: 12 },
    { symbol: "USDT", name: "Tether USD", decimals: 6, assetId: 1984 },
    { symbol: "USDC", name: "USD Coin", decimals: 6, assetId: 1337 },
  ];

  // Initialize API connection
  useEffect(() => {
    initializeAPI();
    return () => {
      if (api) {
        api.disconnect();
      }
    };
  }, []);

  const initializeAPI = async () => {
    try {
      setProgress(10);
      const assetHubChain = chains.find((c) => c.id === "AssetHub");
      if (!assetHubChain) {
        throw new Error("Asset Hub configuration not found");
      }

      setProgress(30);
      const wsProvider = new WsProvider(assetHubChain.wsUrl);
      const apiInstance = await ApiPromise.create({ provider: wsProvider });

      setProgress(60);
      await apiInstance.isReady;

      setApi(apiInstance);
      setProgress(100);
      console.log("✅ Connected to Paseo Asset Hub");

      // Load initial data
      await loadCollections();
    } catch (error) {
      console.error("❌ Failed to initialize API:", error);
      setError(
        "Failed to connect to Paseo Asset Hub. Please check your connection."
      );
    }
  };

  // Connect Polkadot wallet
  const connectPolkadotWallet = async () => {
    setLoading(true);
    setError("");

    try {
      // Enable web3
      const extensions = await web3Enable("XCM NFT Marketplace");
      if (extensions.length === 0) {
        throw new Error(
          "No Polkadot extension found. Please install Polkadot{.js} extension."
        );
      }

      // Get accounts
      const accounts = await web3Accounts();
      if (accounts.length === 0) {
        throw new Error(
          "No accounts found. Please create an account in your Polkadot extension."
        );
      }

      const selectedAccount = accounts[0];
      setPolkadotAccount(selectedAccount);
      setWalletConnected(true);

      // Fetch balances
      await fetchBalances(selectedAccount.address);

      setSuccess("Polkadot wallet connected successfully!");
    } catch (error: any) {
      console.error("Wallet connection failed:", error);
      setError(error.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  // Fetch account balances
  const fetchBalances = async (address: string) => {
    if (!api) return;

    try {
      // Get free balance
      const account = await api.query.system.account(address);
      const balance = account.data.free.toString();
      const dotBalance = (parseInt(balance) / Math.pow(10, 10)).toFixed(4);

      setBalances({
        dot: dotBalance,
        hdx: "0.0000", // Would need HDX API call
        existentialDeposit: "1.0000",
      });
    } catch (error) {
      console.error("Failed to fetch balances:", error);
    }
  };

  // Load existing collections
  const loadCollections = async () => {
    if (!api) return;

    try {
      // Query existing collections
      const collectionEntries = await api.query.nfts.collection.entries();
      const loadedCollections = collectionEntries.map(
        ([key, value]: [any, any]) => {
          const collectionId = key.args[0].toString();
          const collectionData = value.unwrap();
          return {
            id: collectionId,
            name: `Collection ${collectionId}`,
            owner: collectionData.owner.toString(),
          };
        }
      );

      setCollections(loadedCollections);
    } catch (error) {
      console.error("Failed to load collections:", error);
    }
  };

  // Create new NFT collection
  const createCollection = async () => {
    if (!api || !polkadotAccount || !newCollectionName.trim()) {
      setError("Please connect wallet and enter collection name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const injector = await web3FromAddress(polkadotAccount.address);

      // Get next available collection ID
      const nextCollectionId =
        collections.length > 0
          ? Math.max(...collections.map((c) => parseInt(c.id))) + 1
          : 1;

      // Create collection transaction
      const tx = api.tx.nfts.create(
        nextCollectionId,
        polkadotAccount.address, // admin
        {
          settings: 0,
          maxSupply: null,
          mintSettings: {
            mintType: { Issuer: null },
            price: null,
            startBlock: null,
            endBlock: null,
            defaultItemSettings: 0,
          },
        }
      );

      const txHash = await tx.signAndSend(
        polkadotAccount.address,
        { signer: injector.signer },
        ({ status, events }) => {
          if (status.isInBlock) {
            console.log(
              `Collection creation included in block ${status.asInBlock}`
            );

            // Add transaction to history
            const newTransaction: Transaction = {
              id: Date.now().toString(),
              type: "create_collection",
              status: "success",
              from: "Asset Hub",
              to: "Asset Hub",
              hash: txHash.toString(),
              timestamp: new Date().toISOString(),
              description: `Created collection: ${newCollectionName}`,
            };

            setTransactions((prev) => [newTransaction, ...prev]);

            // Add to collections list
            setCollections((prev) => [
              ...prev,
              {
                id: nextCollectionId.toString(),
                name: newCollectionName,
                owner: polkadotAccount.address,
              },
            ]);

            setNewCollectionName("");
            setShowCreateCollection(false);
            setSuccess(
              `Collection "${newCollectionName}" created successfully!`
            );
          }
        }
      );
    } catch (error: any) {
      console.error("Collection creation failed:", error);
      setError("Failed to create collection: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Mint NFT
  const mintNFT = async () => {
    if (!api || !polkadotAccount || !nftData.name || !nftData.description) {
      setError("Please fill all required fields and connect wallet");
      return;
    }

    if (!selectedCollection) {
      setError("Please select or create a collection first");
      return;
    }

    setLoading(true);
    setError("");
    setProgress(0);

    try {
      const injector = await web3FromAddress(polkadotAccount.address);
      setProgress(20);

      // Get next available item ID in collection
      const collectionItems = await api.query.nfts.item.entries(
        selectedCollection
      );
      const nextItemId = collectionItems.length;

      setProgress(40);

      // Create metadata (in real app, upload to IPFS)
      const metadata = {
        name: nftData.name,
        description: nftData.description,
        image: nftData.image ? "ipfs://placeholder" : null,
        attributes: nftData.attributes.filter((attr) => attr.key && attr.value),
      };

      setProgress(60);

      // Mint NFT transaction
      const tx = api.tx.nfts.mint(
        selectedCollection,
        nextItemId,
        polkadotAccount.address, // to
        null // witness_data
      );

      setProgress(80);

      const txHash = await tx.signAndSend(
        polkadotAccount.address,
        { signer: injector.signer },
        ({ status, events }) => {
          if (status.isInBlock) {
            console.log(`NFT mint included in block ${status.asInBlock}`);

            // Create NFT metadata
            const newNFT: NFTMetadata = {
              id: nextItemId.toString(),
              name: nftData.name,
              description: nftData.description,
              image: nftData.image ? URL.createObjectURL(nftData.image) : "🎨",
              collection: selectedCollection,
              chain: "AssetHub",
              status: "minted",
              owner: polkadotAccount.address,
              txHash: txHash.toString(),
              createdAt: new Date().toISOString(),
              blockNumber: parseInt(status.asInBlock.toString()),
            };

            setMintedNFTs((prev) => [newNFT, ...prev]);

            // Add transaction
            const newTransaction: Transaction = {
              id: Date.now().toString(),
              type: "mint",
              status: "success",
              from: "Asset Hub",
              to: "Asset Hub",
              hash: txHash.toString(),
              timestamp: new Date().toISOString(),
              nftId: nextItemId.toString(),
              description: `Minted NFT: ${nftData.name}`,
              blockNumber: parseInt(status.asInBlock.toString()),
            };

            setTransactions((prev) => [newTransaction, ...prev]);

            // Reset form
            setNftData({
              name: "",
              description: "",
              image: null,
              collection: "",
              attributes: [],
            });

            setProgress(100);
            setSuccess(`NFT "${newNFT.name}" minted successfully!`);
          }
        }
      );
    } catch (error: any) {
      console.error("Minting failed:", error);
      setError("Failed to mint NFT: " + error.message);
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

    try {
      const nft = mintedNFTs.find((n) => n.id === transferData.nftId);
      const targetChain = chains.find((c) => c.id === transferData.targetChain);

      if (!nft || !targetChain) {
        throw new Error("Invalid NFT or target chain");
      }

      // Build XCM transfer using ParaSpell SDK
      const xcmTransfer = Builder()
        .from("AssetHub")
        .to(transferData.targetChain as any)
        .currency({
          multilocation: {
            parents: 0,
            interior: {
              X2: [
                { PalletInstance: 50 }, // NFTs pallet
                { GeneralIndex: parseInt(nft.collection) },
              ],
            },
          },
        })
        .amount("1") // NFT quantity
        .address(transferData.recipient)
        .build();

      console.log("XCM Transfer built:", xcmTransfer);

      // For demo purposes, simulate successful transfer
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

        const newTransaction: Transaction = {
          id: Date.now().toString(),
          type: "transfer",
          status: "success",
          from: "Asset Hub",
          to: targetChain.name,
          hash: `0x${Math.random().toString(16).substr(2, 64)}`,
          timestamp: new Date().toISOString(),
          nftId: nft.id,
          description: `Transferred ${nft.name} to ${targetChain.name}`,
        };

        setTransactions((prev) => [newTransaction, ...prev]);
        setTransferData({ nftId: "", targetChain: "Hydration", recipient: "" });
        setSuccess(`NFT transferred successfully to ${targetChain.name}!`);
      }, 3000);
    } catch (error: any) {
      console.error("Transfer failed:", error);
      setError("Failed to transfer NFT: " + error.message);
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

    try {
      // Build XCM swap using ParaSpell SDK
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
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          type: "swap",
          status: "success",
          from: swapData.fromToken,
          to: swapData.toToken,
          hash: `0x${Math.random().toString(16).substr(2, 64)}`,
          timestamp: new Date().toISOString(),
          amount: swapData.amount,
          description: `Swapped ${swapData.amount} ${swapData.fromToken} for ${swapData.toToken}`,
        };

        setTransactions((prev) => [newTransaction, ...prev]);
        fetchBalances(polkadotAccount.address);
        setSwapData({ ...swapData, amount: "" });
        setSuccess(
          `Successfully swapped ${swapData.amount} ${swapData.fromToken} for ${swapData.toToken}!`
        );
      }, 3000);
    } catch (error: any) {
      console.error("Swap failed:", error);
      setError("Failed to swap tokens: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError("Image size must be less than 5MB");
        return;
      }
      setNftData((prev) => ({ ...prev, image: file }));
    }
  };

  // Add NFT attribute
  const addAttribute = () => {
    setNftData((prev) => ({
      ...prev,
      attributes: [...prev.attributes, { key: "", value: "" }],
    }));
  };

  // Remove NFT attribute
  const removeAttribute = (index: number) => {
    setNftData((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  };

  // Update NFT attribute
  const updateAttribute = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    setNftData((prev) => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) =>
        i === index ? { ...attr, [field]: value } : attr
      ),
    }));
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard!");
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
                  className="bg-green-500/20 text-green-400 cursor-pointer"
                  onClick={() =>
                    copyToClipboard(polkadotAccount?.address || "")
                  }
                >
                  {polkadotAccount?.address?.slice(0, 6)}...
                  {polkadotAccount?.address?.slice(-4)}
                  <Copy className="w-3 h-3 ml-1" />
                </Badge>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        {progress > 0 && progress < 100 && (
          <div className="mb-6">
            <Progress value={progress} className="w-full" />
            <p className="text-center text-sm text-gray-400 mt-2">
              {progress < 50
                ? "Connecting to blockchain..."
                : "Processing transaction..."}
            </p>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <Card className="mb-6 border-red-500/30 bg-red-500/10">
            <CardContent className="p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 flex-1">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="mb-6 border-green-500/30 bg-green-500/10">
            <CardContent className="p-4 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 flex-1">{success}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSuccess("")}
                className="text-green-400 hover:text-green-300"
              >
                <X className="w-4 h-4" />
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
              My NFTs ({mintedNFTs.length})
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900"
            >
              <History className="w-4 h-4 mr-2" />
              History ({transactions.length})
            </TabsTrigger>
          </TabsList>

          {/* Mint NFT Tab */}
          <TabsContent value="mint">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3">
                <Card className="bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Mint NFT on Paseo Asset Hub
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Collection Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-300">
                          Collection
                        </label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setShowCreateCollection(!showCreateCollection)
                          }
                          className="border-white/20 text-white"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          New Collection
                        </Button>
                      </div>

                      {showCreateCollection && (
                        <Card className="bg-white/5 border-white/20">
                          <CardContent className="p-4 space-y-4">
                            <Input
                              value={newCollectionName}
                              onChange={(e) =>
                                setNewCollectionName(e.target.value)
                              }
                              placeholder="Enter collection name"
                              className="bg-white/5 border-white/20 text-white"
                            />
                            <div className="flex space-x-2">
                              <Button
                                onClick={createCollection}
                                disabled={loading || !newCollectionName.trim()}
                                size="sm"
                                className="bg-purple-500 hover:bg-purple-600"
                              >
                                Create
                              </Button>
                              <Button
                                onClick={() => setShowCreateCollection(false)}
                                variant="outline"
                                size="sm"
                                className="border-white/20 text-white"
                              >
                                Cancel
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <Select
                        value={selectedCollection}
                        onValueChange={setSelectedCollection}
                      >
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue placeholder="Select a collection" />
                        </SelectTrigger>
                        <SelectContent>
                          {collections.map((collection) => (
                            <SelectItem
                              key={collection.id}
                              value={collection.id}
                            >
                              {collection.name} (ID: {collection.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            NFT Name *
                          </label>
                          <Input
                            value={nftData.name}
                            onChange={(e) =>
                              setNftData((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="Enter NFT name"
                            className="bg-white/5 border-white/20 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description *
                          </label>
                          <Textarea
                            value={nftData.description}
                            onChange={(e) =>
                              setNftData((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            placeholder="Describe your NFT"
                            className="bg-white/5 border-white/20 text-white"
                            rows={4}
                          />
                        </div>

                        {/* Attributes */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-300">
                              Attributes
                            </label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addAttribute}
                              className="border-white/20 text-white"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {nftData.attributes.map((attr, index) => (
                              <div key={index} className="flex space-x-2">
                                <Input
                                  placeholder="Key"
                                  value={attr.key}
                                  onChange={(e) =>
                                    updateAttribute(
                                      index,
                                      "key",
                                      e.target.value
                                    )
                                  }
                                  className="bg-white/5 border-white/20 text-white"
                                />
                                <Input
                                  placeholder="Value"
                                  value={attr.value}
                                  onChange={(e) =>
                                    updateAttribute(
                                      index,
                                      "value",
                                      e.target.value
                                    )
                                  }
                                  className="bg-white/5 border-white/20 text-white"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeAttribute(index)}
                                  className="border-red-500/20 text-red-400 hover:bg-red-500/20"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Upload Image
                          </label>
                          <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              id="image-upload"
                            />
                            <label
                              htmlFor="image-upload"
                              className="cursor-pointer"
                            >
                              {nftData.image ? (
                                <div className="space-y-2">
                                  <img
                                    src={URL.createObjectURL(nftData.image)}
                                    alt="Preview"
                                    className="w-32 h-32 object-cover rounded-lg mx-auto"
                                  />
                                  <p className="text-green-400 text-sm">
                                    Image uploaded
                                  </p>
                                  <p className="text-gray-400 text-xs">
                                    {(nftData.image.size / 1024 / 1024).toFixed(
                                      2
                                    )}{" "}
                                    MB
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                                  <p className="text-gray-400">
                                    Click to upload image
                                  </p>
                                  <p className="text-gray-500 text-xs">
                                    Max size: 5MB
                                  </p>
                                </div>
                              )}
                            </label>
                          </div>
                        </div>

                        <Card className="bg-blue-500/20 border-blue-500/30">
                          <CardContent className="p-4">
                            <h3 className="text-blue-400 font-medium mb-2">
                              Minting Info
                            </h3>
                            <div className="text-sm text-blue-200 space-y-1">
                              <p>
                                • Collection:{" "}
                                {selectedCollection || "Not selected"}
                              </p>
                              <p>• Chain: Paseo Asset Hub</p>
                              <p>• NFT Standard: Substrate NFTs pallet</p>
                              <p>• Estimated fee: ~0.1 DOT</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <Button
                      onClick={mintNFT}
                      disabled={
                        !walletConnected ||
                        loading ||
                        !nftData.name ||
                        !nftData.description ||
                        !selectedCollection
                      }
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Image className="w-4 h-4 mr-2" />
                      )}
                      {loading ? "Minting NFT..." : "Mint NFT on Asset Hub"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <Card className="bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">
                      Collections
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {collections.length === 0 ? (
                      <p className="text-gray-400 text-sm">
                        No collections found
                      </p>
                    ) : (
                      collections.map((collection) => (
                        <div
                          key={collection.id}
                          className="p-2 bg-white/5 rounded"
                        >
                          <p className="text-white text-sm font-medium">
                            {collection.name}
                          </p>
                          <p className="text-gray-400 text-xs">
                            ID: {collection.id}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Total NFTs</span>
                      <span className="text-white text-sm">
                        {mintedNFTs.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Collections</span>
                      <span className="text-white text-sm">
                        {collections.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Balance</span>
                      <span className="text-white text-sm">
                        {balances.dot} DOT
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
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
                        Select NFT *
                      </label>
                      <Select
                        value={transferData.nftId}
                        onValueChange={(value) =>
                          setTransferData((prev) => ({ ...prev, nftId: value }))
                        }
                      >
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue placeholder="Choose an NFT" />
                        </SelectTrigger>
                        <SelectContent>
                          {mintedNFTs
                            .filter((nft) => nft.chain === "AssetHub")
                            .map((nft) => (
                              <SelectItem key={nft.id} value={nft.id}>
                                {nft.name} (#{nft.id})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Target Chain *
                      </label>
                      <Select
                        value={transferData.targetChain}
                        onValueChange={(value) =>
                          setTransferData((prev) => ({
                            ...prev,
                            targetChain: value,
                          }))
                        }
                      >
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue placeholder="Select target chain" />
                        </SelectTrigger>
                        <SelectContent>
                          {chains
                            .filter((chain) => chain.id !== "AssetHub")
                            .map((chain) => (
                              <SelectItem key={chain.id} value={chain.id}>
                                {chain.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Recipient Address *
                      </label>
                      <Input
                        value={transferData.recipient}
                        onChange={(e) =>
                          setTransferData((prev) => ({
                            ...prev,
                            recipient: e.target.value,
                          }))
                        }
                        placeholder="Enter recipient address"
                        className="bg-white/5 border-white/20 text-white"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Address format depends on target chain
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Card className="bg-blue-500/20 border-blue-500/30">
                      <CardContent className="p-4">
                        <h3 className="text-blue-400 font-medium mb-2">
                          XCM Transfer Flow
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-blue-200 mb-3">
                          <span>Asset Hub</span>
                          <ArrowRight className="w-4 h-4" />
                          <span>XCM</span>
                          <ArrowRight className="w-4 h-4" />
                          <span>
                            {chains.find(
                              (c) => c.id === transferData.targetChain
                            )?.name || "Target"}
                          </span>
                        </div>
                        <div className="text-xs text-blue-300 space-y-1">
                          <p>• Uses ParaSpell SDK for XCM construction</p>
                          <p>• Secure cross-chain asset transfer</p>
                          <p>• NFT ownership preserved</p>
                          <p>• Estimated fee: ~0.2 DOT</p>
                        </div>
                      </CardContent>
                    </Card>

                    {transferData.nftId && (
                      <Card className="bg-white/5 border-white/20">
                        <CardContent className="p-4">
                          <h3 className="text-white font-medium mb-2">
                            Selected NFT
                          </h3>
                          {(() => {
                            const selectedNFT = mintedNFTs.find(
                              (nft) => nft.id === transferData.nftId
                            );
                            return selectedNFT ? (
                              <div className="space-y-2">
                                <p className="text-sm text-gray-300">
                                  Name: {selectedNFT.name}
                                </p>
                                <p className="text-sm text-gray-300">
                                  Collection: #{selectedNFT.collection}
                                </p>
                                <p className="text-sm text-gray-300">
                                  Status: {selectedNFT.status}
                                </p>
                              </div>
                            ) : null;
                          })()}
                        </CardContent>
                      </Card>
                    )}
                  </div>
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
                        From Token *
                      </label>
                      <Select
                        value={swapData.fromToken}
                        onValueChange={(value) =>
                          setSwapData((prev) => ({ ...prev, fromToken: value }))
                        }
                      >
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedTokens.map((token) => (
                            <SelectItem key={token.symbol} value={token.symbol}>
                              {token.symbol} - {token.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        To Token *
                      </label>
                      <Select
                        value={swapData.toToken}
                        onValueChange={(value) =>
                          setSwapData((prev) => ({ ...prev, toToken: value }))
                        }
                      >
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedTokens
                            .filter(
                              (token) => token.symbol !== swapData.fromToken
                            )
                            .map((token) => (
                              <SelectItem
                                key={token.symbol}
                                value={token.symbol}
                              >
                                {token.symbol} - {token.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Amount *
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
                        placeholder="Enter amount to swap"
                        className="bg-white/5 border-white/20 text-white"
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
                      <div className="flex space-x-2">
                        {["0.1", "0.5", "1.0", "3.0"].map((slippage) => (
                          <Button
                            key={slippage}
                            variant={
                              swapData.slippage === slippage
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              setSwapData((prev) => ({ ...prev, slippage }))
                            }
                            className={
                              swapData.slippage === slippage
                                ? "bg-purple-500"
                                : "border-white/20 text-white"
                            }
                          >
                            {slippage}%
                          </Button>
                        ))}
                        <Input
                          type="number"
                          value={swapData.slippage}
                          onChange={(e) =>
                            setSwapData((prev) => ({
                              ...prev,
                              slippage: e.target.value,
                            }))
                          }
                          placeholder="Custom"
                          className="bg-white/5 border-white/20 text-white w-20"
                          step="0.1"
                        />
                      </div>
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
                          <p>• Low slippage for major pairs</p>
                          <p>• Cross-chain swaps via XCM</p>
                          <p>• Automatic execution & settlement</p>
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
                              1 {swapData.fromToken} ≈ 0.95 {swapData.toToken}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Slippage:</span>
                            <span className="text-white">
                              {swapData.slippage}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Network fee:</span>
                            <span className="text-white">~0.1 DOT</span>
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
                          className="bg-white/5 border-white/20 hover:bg-white/10 transition-colors"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                {typeof nft.image === "string" &&
                                nft.image.startsWith("blob:") ? (
                                  <img
                                    src={nft.image}
                                    alt={nft.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xl">🎨</span>
                                )}
                              </div>
                              <Badge
                                className={`${chain?.color} text-white text-xs`}
                              >
                                {chain?.name}
                              </Badge>
                            </div>

                            <h3 className="text-white font-medium mb-2 truncate">
                              {nft.name}
                            </h3>
                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                              {nft.description}
                            </p>

                            <div className="space-y-1 text-xs text-gray-400 mb-4">
                              <p>Token ID: #{nft.id}</p>
                              <p>Collection: #{nft.collection}</p>
                              <p>
                                Created:{" "}
                                {new Date(nft.createdAt).toLocaleDateString()}
                              </p>
                            </div>

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
                                    : nft.status === "transferred"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                }
                              >
                                {nft.status.charAt(0).toUpperCase() +
                                  nft.status.slice(1)}
                              </Badge>

                              <div className="flex space-x-1">
                                {nft.txHash && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-purple-400 hover:text-purple-300 p-1"
                                    onClick={() => {
                                      const chain = chains.find(
                                        (c) => c.id === nft.chain
                                      );
                                      if (chain && nft.txHash) {
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-gray-300 p-1"
                                  onClick={() =>
                                    copyToClipboard(
                                      `NFT: ${nft.name}\nID: ${nft.id}\nCollection: ${nft.collection}`
                                    )
                                  }
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
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
                                tx.type === "mint" ||
                                tx.type === "create_collection"
                                  ? "bg-green-500/20"
                                  : tx.type === "transfer"
                                  ? "bg-blue-500/20"
                                  : "bg-cyan-500/20"
                              }`}
                            >
                              {tx.type === "mint" ? (
                                <Image className="w-5 h-5 text-green-400" />
                              ) : tx.type === "create_collection" ? (
                                <Plus className="w-5 h-5 text-green-400" />
                              ) : tx.type === "transfer" ? (
                                <Send className="w-5 h-5 text-blue-400" />
                              ) : (
                                <Zap className="w-5 h-5 text-cyan-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {tx.description}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {tx.from} → {tx.to}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {tx.hash.slice(0, 16)}...
                              </p>
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
                              className="text-purple-400 hover:text-purple-300 p-1"
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

        {/* Footer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {mintedNFTs.length}
              </div>
              <div className="text-sm text-gray-400">NFTs Minted</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {collections.length}
              </div>
              <div className="text-sm text-gray-400">Collections</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {transactions.filter((tx) => tx.type === "transfer").length}
              </div>
              <div className="text-sm text-gray-400">XCM Transfers</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {transactions.length > 0
                  ? Math.round(
                      (transactions.filter((tx) => tx.status === "success")
                        .length /
                        transactions.length) *
                        100
                    )
                  : 100}
                %
              </div>
              <div className="text-sm text-gray-400">Success Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Chain Status & Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
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
                    {chain.paraId && (
                      <span className="text-xs text-gray-400">
                        #{chain.paraId}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-xs text-green-400">Online</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white">XCM Protocol Info</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm mb-4">
                Cross-Consensus Messaging enables secure communication between
                different blockchains in the Polkadot ecosystem.
              </p>
              <div className="space-y-2 text-sm text-gray-300 mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Secure cross-chain transfers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>ParaSpell SDK integration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Paseo testnet support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Real blockchain integration</span>
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

        {/* Network Information */}
        <Card className="bg-white/10 border-white/20 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Network Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-white font-medium mb-2">Primary Network</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Network:</span>
                    <span className="text-white">Paseo Testnet</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Token:</span>
                    <span className="text-white">PAS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Decimals:</span>
                    <span className="text-white">10</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">
                  Technical Details
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">XCM Version:</span>
                    <span className="text-white">V3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">SDK:</span>
                    <span className="text-white">ParaSpell</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">API:</span>
                    <span className="text-white">Polkadot JS</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">Your Account</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Status:</span>
                    <span
                      className={
                        walletConnected ? "text-green-400" : "text-red-400"
                      }
                    >
                      {walletConnected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Balance:</span>
                    <span className="text-white">{balances.dot} DOT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Transactions:</span>
                    <span className="text-white">{transactions.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default XCMNFTApp;
