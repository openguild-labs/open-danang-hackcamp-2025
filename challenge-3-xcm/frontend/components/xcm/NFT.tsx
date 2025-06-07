import React, { useState, useEffect } from "react";
import {
  Upload,
  Wallet,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  Send,
  Eye,
  History,
} from "lucide-react";
import { Builder } from "@paraspell/sdk";
import { createClient } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/web";

const XCMNFTApp = () => {
  const [activeTab, setActiveTab] = useState("mint");
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [api, setApi] = useState(null);
  const [balance, setBalance] = useState("0");
  const [nftData, setNftData] = useState({
    name: "",
    description: "",
    image: null,
  });
  const [transferData, setTransferData] = useState({
    nftId: "",
    targetChain: "moonbeam",
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mintedNFTs, setMintedNFTs] = useState([]);
  const [error, setError] = useState("");

  // Simplified chain configurations
  const chains = [
    {
      id: "AssetHub",
      name: "Asset Hub",
      wsUrl: "wss://polkadot-asset-hub-rpc.polkadot.io",
      color: "bg-blue-500",
    },
    {
      id: "Moonbeam",
      name: "Moonbeam",
      wsUrl: "wss://wss.api.moonbeam.network",
      color: "bg-purple-500",
    },
  ];

  // Initialize Polkadot API connection
  useEffect(() => {
    const initializeApi = async () => {
      try {
        const provider = getWsProvider(chains[0].wsUrl);
        const client = createClient(provider);
        setApi(client);
      } catch (error) {
        console.error("Failed to initialize API:", error);
        setError("Failed to connect to Asset Hub");
      }
    };

    initializeApi();
  }, []);

  // IPFS Upload Function (simplified mock version)
  const uploadToIPFS = async (file) => {
    if (!file) return null;
    // Mock implementation for demo
    return `ipfs://QmMockHash${Date.now()}`;
  };

  // Connect Wallet
  const connectWallet = async () => {
    setLoading(true);
    setError("");

    try {
      if (typeof window !== "undefined" && window.injectedWeb3) {
        const { web3Accounts, web3Enable } = await import(
          "@polkadot/extension-dapp"
        );

        await web3Enable("XCM NFT App");
        const accounts = await web3Accounts();

        if (accounts.length === 0) {
          throw new Error("No accounts found");
        }

        setAccount(accounts[0].address);
        setWalletConnected(true);
        setBalance("125.4"); // Mock balance
      }
    } catch (error) {
      console.error("Wallet connection failed:", error);
      setError("Failed to connect wallet. Install Polkadot extension.");
    } finally {
      setLoading(false);
    }
  };

  // Mint NFT (simplified without collections)
  const mintNFT = async () => {
    if (!nftData.name || !account || !api) {
      setError("Please fill in required fields and connect wallet");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { web3FromAddress } = await import("@polkadot/extension-dapp");
      const injector = await web3FromAddress(account);

      // Generate simple ID
      const nftId = mintedNFTs.length + 1;

      // Upload image if provided
      const imageUrl = nftData.image ? await uploadToIPFS(nftData.image) : null;

      // Create metadata
      const metadata = {
        name: nftData.name,
        description: nftData.description,
        image: imageUrl,
      };

      // Mock metadata URL
      const metadataUrl = `ipfs://metadata-${nftId}`;

      // Create transactions (using default collection 1)
      const mintTx = api.tx.uniques.mint(1, nftId, account);
      const metadataTx = api.tx.uniques.setMetadata(
        1,
        nftId,
        metadataUrl,
        false
      );
      const batchTx = api.tx.utility.batchAll([mintTx, metadataTx]);

      // Create transaction record
      const txHash = `0x${Math.random().toString(16).substr(2, 8)}`;
      const newTransaction = {
        id: Date.now().toString(),
        type: "mint",
        nft: nftData.name,
        status: "pending",
        hash: txHash,
        timestamp: new Date().toISOString(),
      };

      setTransactions((prev) => [newTransaction, ...prev]);

      // Submit transaction
      await batchTx.signAndSend(
        account,
        { signer: injector.signer },
        ({ status, dispatchError }) => {
          if (dispatchError) {
            handleTxError(new Error("Transaction failed"), setError);
            setTransactions((prev) =>
              prev.map((tx) =>
                tx.id === newTransaction.id ? { ...tx, status: "failed" } : tx
              )
            );
            return;
          }

          if (status.isFinalized) {
            // Create NFT record
            const newNFT = {
              id: nftId.toString(),
              name: nftData.name,
              description: nftData.description,
              image: nftData.image || "🎨",
              chain: "AssetHub",
              metadataUrl,
              owner: account,
            };

            setMintedNFTs((prev) => [newNFT, ...prev]);
            setTransactions((prev) =>
              prev.map((tx) =>
                tx.id === newTransaction.id ? { ...tx, status: "success" } : tx
              )
            );

            // Reset form
            setNftData({
              name: "",
              description: "",
              image: null,
            });
          }
        }
      );
    } catch (error) {
      console.error("Minting failed:", error);
      setError("Minting failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Transfer NFT using XCM
  const transferNFT = async () => {
    if (!transferData.nftId || !account || !api) {
      setError("Please select an NFT");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { web3FromAddress } = await import("@polkadot/extension-dapp");
      const injector = await web3FromAddress(account);

      const nft = mintedNFTs.find((n) => n.id === transferData.nftId);
      if (!nft) throw new Error("NFT not found");

      // Create transaction record
      const txHash = `0x${Math.random().toString(16).substr(2, 8)}`;
      const newTransaction = {
        id: Date.now().toString(),
        type: "transfer",
        nft: nft.name,
        to: transferData.targetChain,
        status: "pending",
        hash: txHash,
        timestamp: new Date().toISOString(),
      };

      setTransactions((prev) => [newTransaction, ...prev]);

      // Build XCM transfer
      const xcmTransfer = Builder()
        .from("AssetHub")
        .to(transferData.targetChain)
        .currency({
          multilocation: {
            parents: 0,
            interior: {
              X2: [
                { GeneralIndex: 1 }, // Default collection
                { GeneralIndex: parseInt(nft.id) },
              ],
            },
          },
        })
        .amount("1")
        .address(account)
        .build();

      // Submit XCM transaction
      const xcmTx = api.tx.polkadotXcm.limitedReserveTransferAssets(
        xcmTransfer.destination,
        xcmTransfer.beneficiary,
        xcmTransfer.assets,
        0,
        xcmTransfer.weight_limit
      );

      await xcmTx.signAndSend(
        account,
        { signer: injector.signer },
        ({ status, dispatchError }) => {
          if (dispatchError) {
            handleTxError(new Error("XCM transfer failed"), setError);
            setTransactions((prev) =>
              prev.map((tx) =>
                tx.id === newTransaction.id ? { ...tx, status: "failed" } : tx
              )
            );
            return;
          }

          if (status.isFinalized) {
            // Update NFT status
            setMintedNFTs((prev) =>
              prev.map((n) =>
                n.id === nft.id ? { ...n, chain: transferData.targetChain } : n
              )
            );

            setTransactions((prev) =>
              prev.map((tx) =>
                tx.id === newTransaction.id ? { ...tx, status: "success" } : tx
              )
            );

            // Reset transfer form
            setTransferData({
              nftId: "",
              targetChain: "moonbeam",
            });
          }
        }
      );
    } catch (error) {
      console.error("XCM transfer failed:", error);
      setError("Transfer failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Simplified error handler
  const handleTxError = (error, setError) => {
    console.error(error);
    setError("Transaction failed. Please try again.");
  };

  // Handle image upload
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
              <h1 className="text-2xl font-bold text-white">XCM NFT Bridge</h1>
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
              <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg text-sm">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            { id: "mint", label: "Mint NFT", icon: ImageIcon },
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
                      rows={3}
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

                  <button
                    onClick={mintNFT}
                    disabled={!walletConnected || loading || !nftData.name}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-medium hover:from-pink-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ImageIcon className="w-5 h-5" />
                    )}
                    <span>{loading ? "Minting..." : "Mint NFT"}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "transfer" && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Transfer NFT via XCM
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
                            {nft.name} (ID: {nft.id})
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
                <h2 className="text-2xl font-bold text-white mb-6">My NFTs</h2>

                {mintedNFTs.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No NFTs minted yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {mintedNFTs.map((nft) => {
                      const chain = chains.find((c) => c.id === nft.chain);
                      return (
                        <div key={nft.id} className="bg-white/5 rounded-xl p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-4xl">{nft.image || "🎨"}</div>
                            {chain && (
                              <div
                                className={`px-3 py-1 rounded-full text-xs font-medium ${chain.color} text-white`}
                              >
                                {chain.name}
                              </div>
                            )}
                          </div>
                          <h3 className="text-white font-medium mb-2">
                            {nft.name}
                          </h3>
                          <p className="text-gray-400 text-sm mb-4">
                            ID: #{nft.id}
                          </p>
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

                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((tx) => (
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
                              <ImageIcon className="w-5 h-5 text-green-400" />
                            ) : (
                              <Send className="w-5 h-5 text-blue-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {tx.type === "mint" ? "Minted" : "Transferred"}{" "}
                              {tx.nft}
                            </p>
                            {tx.to && (
                              <p className="text-gray-400 text-sm">→ {tx.to}</p>
                            )}
                          </div>
                        </div>

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
                      </div>
                    ))}
                  </div>
                )}
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
                  <span className="text-gray-300">Transfers</span>
                  <span className="text-white font-medium">
                    {transactions.filter((tx) => tx.type === "transfer").length}
                  </span>
                </div>
              </div>
            </div>

            {/* XCM Info */}
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                XCM Protocol
              </h3>
              <p className="text-gray-300 text-sm">
                Cross-Consensus Messaging enables secure NFT transfers between
                parachains.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XCMNFTApp;
