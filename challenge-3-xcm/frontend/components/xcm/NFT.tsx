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
} from "lucide-react";

import { Builder, NODE_NAMES } from "@paraspell/sdk";
import { createClient } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/web";

const XCMNFTApp = () => {
  const [activeTab, setActiveTab] = useState("mint");
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [api, setApi] = useState(null);
  const [balances, setBalances] = useState({ assetHub: "0", parachain: "0" });
  const [nftData, setNftData] = useState({
    name: "",
    description: "",
    image: null,
    collection: "1", // Default collection ID
  });
  const [transferData, setTransferData] = useState({
    nftId: "",
    targetChain: "moonbeam",
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mintedNFTs, setMintedNFTs] = useState([]);
  const [error, setError] = useState("");

  // Chain configurations
  const chains = [
    {
      id: "AssetHub",
      name: "Asset Hub",
      color: "bg-blue-500",
      wsUrl: "wss://polkadot-asset-hub-rpc.polkadot.io",
    },
    {
      id: "Moonbeam",
      name: "Moonbeam",
      color: "bg-purple-500",
      wsUrl: "wss://wss.api.moonbeam.network",
    },
    {
      id: "Astar",
      name: "Astar",
      color: "bg-green-500",
      wsUrl: "wss://rpc.astar.network",
    },
    {
      id: "Acala",
      name: "Acala",
      color: "bg-red-500",
      wsUrl: "wss://acala-rpc.aca-api.network",
    },
  ];

  // Initialize Polkadot API connection
  useEffect(() => {
    const initializeApi = async () => {
      try {
        const assetHubChain = chains.find((c) => c.id === "AssetHub");
        const provider = getWsProvider(assetHubChain.wsUrl);
        const client = createClient(provider);
        setApi(client);
      } catch (error) {
        console.error("Failed to initialize API:", error);
        setError("Failed to connect to Asset Hub");
      }
    };

    initializeApi();
  }, []);

  const connectWallet = async () => {
    setLoading(true);
    setError("");

    try {
      // Check if Polkadot extension is available
      if (typeof window !== "undefined" && window.injectedWeb3) {
        const { web3Accounts, web3Enable, web3FromAddress } = await import(
          "@polkadot/extension-dapp"
        );

        // Request access to extension
        const extensions = await web3Enable("XCM NFT App");
        if (extensions.length === 0) {
          throw new Error("No extension found");
        }

        // Get accounts
        const accounts = await web3Accounts();
        if (accounts.length === 0) {
          throw new Error("No accounts found");
        }

        const selectedAccount = accounts[0];
        setAccount(selectedAccount.address);
        setWalletConnected(true);

        // Mock balance fetch - in real implementation, query chain state
        setBalances({ assetHub: "125.4", parachain: "89.2" });
      }
    } catch (error) {
      console.error("Wallet connection failed:", error);
      setError(
        "Failed to connect wallet. Make sure Polkadot extension is installed."
      );
    } finally {
      setLoading(false);
    }
  };

  // Mint NFT on Asset Hub
  const mintNFT = async () => {
    if (!nftData.name || !nftData.description || !account) return;

    setLoading(true);
    setError("");

    try {
      // Create transaction hash for tracking
      const txHash = `0x${Math.random()
        .toString(16)
        .substr(2, 8)}...${Math.random().toString(16).substr(2, 3)}`;

      const newTransaction = {
        id: Date.now().toString(),
        type: "mint",
        nft: nftData.name,
        from: "Asset Hub",
        to: "Asset Hub",
        status: "pending",
        hash: txHash,
      };

      setTransactions((prev) => [newTransaction, ...prev]);

      // In a real implementation, you would:
      // 1. Create NFT metadata and upload to IPFS
      // 2. Build extrinsic using Asset Hub's NFT pallet
      // 3. Sign and submit transaction

      // For demo, we'll simulate the process
      const nftMetadata = {
        name: nftData.name,
        description: nftData.description,
        image: nftData.image || "https://via.placeholder.com/200",
      };

      // Simulate NFT minting process
      setTimeout(() => {
        const newNFT = {
          id: (mintedNFTs.length + 1).toString().padStart(3, "0"),
          name: nftData.name,
          description: nftData.description,
          chain: "AssetHub",
          status: "minted",
          image: nftData.image ? "🖼️" : "🎨",
          collection: nftData.collection,
          metadata: nftMetadata,
          owner: account,
        };

        setMintedNFTs((prev) => [newNFT, ...prev]);
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === newTransaction.id ? { ...tx, status: "success" } : tx
          )
        );
        setNftData({ name: "", description: "", image: null, collection: "1" });
        setError("");
      }, 3000);
    } catch (error) {
      console.error("Minting failed:", error);
      setError("Failed to mint NFT: " + error.message);
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === newTransaction?.id ? { ...tx, status: "failed" } : tx
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Transfer NFT using XCM
  const transferNFT = async () => {
    if (!transferData.nftId || !transferData.targetChain || !account) return;

    setLoading(true);
    setError("");

    try {
      const nft = mintedNFTs.find((n) => n.id === transferData.nftId);
      const targetChain = chains.find((c) => c.id === transferData.targetChain);

      if (!nft || !targetChain) {
        throw new Error("Invalid NFT or target chain");
      }

      const txHash = `0x${Math.random()
        .toString(16)
        .substr(2, 8)}...${Math.random().toString(16).substr(2, 3)}`;

      const newTransaction = {
        id: Date.now().toString(),
        type: "transfer",
        nft: nft.name,
        from: "Asset Hub",
        to: targetChain.name,
        status: "pending",
        hash: txHash,
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
              parents: 0,
              interior: {
                X2: [
                  { PalletInstance: 50 }, // NFTs pallet
                  { GeneralIndex: nft.collection },
                ],
              },
            },
          })
          .amount("1") // NFT quantity
          .address(account)
          .build();

        console.log("XCM Transfer built:", xcmTransfer);

        // In real implementation:
        // 1. Sign the transaction with user's account
        // 2. Submit to Asset Hub
        // 3. Monitor XCM message execution on target chain

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
          setTransferData({ nftId: "", targetChain: "Moonbeam" });
          setError("");
        }, 4000);
      } catch (xcmError) {
        console.error("XCM transfer failed:", xcmError);
        throw new Error("XCM transfer configuration failed");
      }
    } catch (error) {
      console.error("Transfer failed:", error);
      setError("Failed to transfer NFT: " + error.message);
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === newTransaction?.id ? { ...tx, status: "failed" } : tx
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNftData((prev) => ({ ...prev, image: e.target.result }));
      };
      reader.readAsDataURL(file);
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
                  XCM NFT Bridge
                </h1>
                <p className="text-sm text-gray-300">
                  Cross-chain NFT minting & transfers powered by XCM
                </p>
              </div>
            </div>

            {!walletConnected ? (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl font-medium hover:from-pink-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Wallet className="w-5 h-5" />
                )}
                <span>{loading ? "Connecting..." : "Connect Wallet"}</span>
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-300">
                    Asset Hub: {balances.assetHub} DOT
                  </p>
                  <p className="text-sm text-gray-300">
                    Parachain: {balances.parachain} DOT
                  </p>
                </div>
                <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg text-sm">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white/10 p-1 rounded-xl mb-8 backdrop-blur-sm">
          {[
            { id: "mint", label: "Mint NFT", icon: Image },
            { id: "transfer", label: "Transfer NFT", icon: Send },
            { id: "gallery", label: "My NFTs", icon: Eye },
            { id: "history", label: "History", icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white text-gray-900"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Panel */}
          <div className="lg:col-span-2">
            {activeTab === "mint" && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Mint NFT on Asset Hub
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Collection ID
                    </label>
                    <input
                      type="number"
                      value={nftData.collection}
                      onChange={(e) =>
                        setNftData((prev) => ({
                          ...prev,
                          collection: e.target.value,
                        }))
                      }
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter collection ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      NFT Name
                    </label>
                    <input
                      type="text"
                      value={nftData.name}
                      onChange={(e) =>
                        setNftData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter NFT name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={nftData.description}
                      onChange={(e) =>
                        setNftData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={4}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Describe your NFT"
                    />
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
                              src={nftData.image}
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

                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                    <h3 className="text-blue-400 font-medium mb-2">
                      Minting Process
                    </h3>
                    <div className="text-sm text-blue-200 space-y-1">
                      <p>• Metadata will be stored on-chain</p>
                      <p>
                        • NFT will be minted to Asset Hub collection #
                        {nftData.collection}
                      </p>
                      <p>• You can transfer it to any parachain using XCM</p>
                    </div>
                  </div>

                  <button
                    onClick={mintNFT}
                    disabled={
                      !walletConnected ||
                      loading ||
                      !nftData.name ||
                      !nftData.description ||
                      !nftData.collection
                    }
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-medium hover:from-pink-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Image className="w-5 h-5" />
                    )}
                    <span>
                      {loading ? "Minting..." : "Mint NFT on Asset Hub"}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "transfer" && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Transfer NFT to Parachain via XCM
                </h2>

                <div className="space-y-6">
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
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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

                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
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
                          chains.find((c) => c.id === transferData.targetChain)
                            ?.name
                        }
                      </span>
                    </div>
                    <div className="text-xs text-blue-300 space-y-1">
                      <p>• Uses ParaSpell SDK for XCM message construction</p>
                      <p>• Secure cross-chain transfer via Polkadot XCM</p>
                      <p>• NFT ownership preserved across chains</p>
                    </div>
                  </div>

                  <button
                    onClick={transferNFT}
                    disabled={
                      !walletConnected || loading || !transferData.nftId
                    }
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    <span>
                      {loading ? "Transferring..." : "Transfer via XCM"}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "gallery" && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  My NFT Collection
                </h2>

                {mintedNFTs.length === 0 ? (
                  <div className="text-center py-12">
                    <Image className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No NFTs minted yet</p>
                    <p className="text-gray-500">
                      Start by minting your first NFT!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {mintedNFTs.map((nft) => {
                      const chain = chains.find((c) => c.id === nft.chain);
                      return (
                        <div key={nft.id} className="bg-white/5 rounded-xl p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-4xl">{nft.image}</div>
                            <div
                              className={`px-3 py-1 rounded-full text-xs font-medium ${chain?.color} text-white`}
                            >
                              {chain?.name}
                            </div>
                          </div>
                          <h3 className="text-white font-medium mb-2">
                            {nft.name}
                          </h3>
                          <p className="text-gray-400 text-sm mb-2">
                            {nft.description}
                          </p>
                          <p className="text-gray-400 text-sm mb-4">
                            Token ID: #{nft.id} | Collection: #{nft.collection}
                          </p>
                          <div className="flex items-center justify-between">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                nft.status === "minted"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              {nft.status === "minted"
                                ? "Minted"
                                : "Transferred"}
                            </span>
                            <button className="text-purple-400 hover:text-purple-300 text-sm">
                              View Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Transaction History
                </h2>

                <div className="space-y-4">
                  {transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">
                        No transactions yet
                      </p>
                      <p className="text-gray-500">
                        Your NFT operations will appear here
                      </p>
                    </div>
                  ) : (
                    transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="bg-white/5 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              tx.type === "mint"
                                ? "bg-green-500/20"
                                : "bg-blue-500/20"
                            }`}
                          >
                            {tx.type === "mint" ? (
                              <Image className="w-5 h-5 text-green-400" />
                            ) : (
                              <Send className="w-5 h-5 text-blue-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {tx.type === "mint" ? "Minted" : "Transferred"}{" "}
                              {tx.nft}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {tx.from} → {tx.to}
                            </p>
                            <p className="text-gray-500 text-xs">{tx.hash}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div
                            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                              tx.status === "success"
                                ? "bg-green-500/20 text-green-400"
                                : tx.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {tx.status === "success" ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : tx.status === "pending" ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            <span className="capitalize">{tx.status}</span>
                          </div>
                          <button className="text-purple-400 hover:text-purple-300">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Chain Status */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Chain Status
              </h3>
              <div className="space-y-3">
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
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Statistics</h3>
              <div className="space-y-4">
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
                  <span className="text-gray-300">Active Chains</span>
                  <span className="text-white font-medium">
                    {chains.length}
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
              </div>
            </div>

            {/* XCM Info */}
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                XCM Protocol
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Cross-Consensus Messaging (XCM) enables secure communication
                between different blockchains in the Polkadot ecosystem.
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
              </div>
              <div className="flex items-center space-x-2 text-purple-400">
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">Learn more about XCM</span>
              </div>
            </div>

            {/* Network Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Network Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Network</span>
                  <span className="text-white">Polkadot</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">XCM Version</span>
                  <span className="text-white">V3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">SDK</span>
                  <span className="text-white">ParaSpell</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">API</span>
                  <span className="text-white">Polkadot-API</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XCMNFTApp;
