"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Sdk } from "@moonbeam-network/xcm-sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApi, getSigner } from "@/lib/substrate";
import { toast } from "@/hooks/use-toast";
import { decimalToBigInt } from "@/lib/utils";
import { useAtomValue } from "jotai";
import { addressAtom } from "@/components/sigpasskit";
import { useChainId, useAccount, useWalletClient } from "wagmi";

/** Constants */
const ASSET_KEY = "dot";
const DEST_KEY = "hydradx";
const HYDRATION_WS = "wss://hydration-polkadot.api.onfinality.io/public-ws";
const DOT_DECIMALS = 10;

/** Mapping from EVM chainId to XCM‑SDK source keys */
const CHAIN_ID_TO_SOURCE_KEY: Record<number, string> = {
  1284: "moonbeam",
  1287: "moonbase-alpha",
  420420421: "polkadot-asset-hub",
};

/** Render helper */
function formatRoute(sourceKey: string, destinationKey: string) {
  return `${sourceKey} ➜ ${destinationKey}`;
}

/**
 * Discover DOT routes and build transferData for the chosen path if possible.
 */
async function fetchRoutes(
  address: string | null,
  preferredSource?: string
): Promise<{ routes: string[]; transferData: unknown | null }> {
  const sdkInstance: any = await Sdk();
  const assetStep: any = sdkInstance.setAsset(ASSET_KEY);

  const routes: string[] = [];
  let transferData: unknown | null = null;

  for (const source of assetStep.sources ?? []) {
    const sourceKey = typeof source === "string" ? source : source.key;

    let sourceStep: any;
    try {
      sourceStep = assetStep.setSource(source);
    } catch {
      continue;
    }

    for (const dest of sourceStep.destinations ?? []) {
      const destKey = typeof dest === "string" ? dest : dest.key;
      routes.push(formatRoute(sourceKey, destKey));

      if (
        !transferData &&
        destKey === DEST_KEY &&
        (!preferredSource || preferredSource === sourceKey) &&
        address
      ) {
        transferData = sourceStep
          .setDestination(DEST_KEY)
          .setAddresses({ sourceAddress: address, destinationAddress: address });
      }
    }
  }

  return { routes, transferData };
}

export default function SwapHydration() {
  /* Wallet hooks */
  const sigpassAddress = useAtomValue(addressAtom);
  const { address: wagmiAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  /* Derived values */
  const address = useMemo(
    () => sigpassAddress ?? wagmiAddress ?? null,
    [sigpassAddress, wagmiAddress]
  );
  const preferredSource = useMemo(
    () => CHAIN_ID_TO_SOURCE_KEY[chainId] ?? "polkadot",
    [chainId]
  );

  /* UI state */
  const [amount, setAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [routes, setRoutes] = useState<string[]>([]);

  /* Fetch available routes on mount */
  useEffect(() => {
    (async () => {
      const { routes: discoveredRoutes } = await fetchRoutes(null);
      setRoutes(discoveredRoutes);
    })();
  }, []);

  /* Swap handler */
  const handleSwap = useCallback(async () => {
    if (!address) {
      toast({
        title: "No wallet connected",
        description: "Please connect a wallet before swapping.",
      });
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a positive DOT amount.",
      });
      return;
    }

    setIsSwapping(true);
    try {
      const { transferData, routes: currentRoutes } = await fetchRoutes(
        address,
        preferredSource
      );
      setRoutes(currentRoutes);

      if (!transferData) {
        toast({
          title: "Route not found",
          description: `Unable to find a ${preferredSource} ➜ Hydration route.`,
        });
        return;
      }

      /* Prepare signers dynamically */
      const signers: Record<string, unknown> = {};
      if (sigpassAddress) {
        signers.polkadotSigner = await getSigner(sigpassAddress);
      } else if (walletClient) {
        signers.evmSigner = walletClient;
      }

      // @ts-ignore – runtime‑typed by XCM SDK
      await transferData.transfer(amount, signers);

      /* Optional on‑chain swap (requires Substrate signer) */
      if (signers.polkadotSigner) {
        const hydraApi = await getApi(HYDRATION_WS);
        const dotPlanck = decimalToBigInt(amount, DOT_DECIMALS);

        // @ts-ignore – runtime pallet
        await hydraApi.tx.omnipool
          .swap({ Asset: ASSET_KEY }, { Asset: "hdx" }, dotPlanck, 0)
          .signAndSend(sigpassAddress, { signer: signers.polkadotSigner });
      }

      toast({
        title: "Swap submitted",
        description: "DOT ➜ HDX transaction sent successfully.",
      });
    } catch (err) {
      toast({
        title: "Swap failed",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred.",
      });
      console.error(err);
    } finally {
      setIsSwapping(false);
    }
  }, [address, sigpassAddress, walletClient, amount, preferredSource]);

  return (
    <div className="flex flex-col gap-6 w-[320px] md:w-[500px]">
      {routes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-border text-sm rounded-md">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Available DOT Routes</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route, idx) => (
                <tr
                  key={route}
                  className={idx % 2 === 0 ? "bg-muted/10" : undefined}
                >
                  <td className="px-4 py-2 font-mono">{idx + 1}</td>
                  <td className="px-4 py-2 font-mono">{route}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {address ? (
        <div className="text-xs text-muted-foreground break-all">
          Connected account: {address}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">
          Connect a wallet in the header to start swapping.
        </div>
      )}

      <Input
        placeholder="DOT amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <Button onClick={handleSwap} disabled={isSwapping || !amount || !address}>
        {isSwapping ? "Swapping…" : "Swap DOT → HDX"}
      </Button>
    </div>
  );
}