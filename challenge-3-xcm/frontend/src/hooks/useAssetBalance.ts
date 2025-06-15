import { useEffect, useState } from 'react';

import type { TAsset, TNodeWithRelayChains } from '@paraspell/sdk';
import {
  getBalanceNative,
  getAssetBalance,
  isForeignAsset,
  convertSs58,
} from '@paraspell/sdk';
import { ethers } from 'ethers';

export const useAssetBalance = (
  node: TNodeWithRelayChains | undefined,
  asset: TAsset | undefined,
  address: string | undefined
) => {
  const [balance, setBalance] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    let isMounted = true;
    const fetchBalance = async () => {
      if (!node || !asset || !address) return;
      setLoading(true);
      try {
        const ss58Address = convertSs58(address, node as any);
        const balBig = isForeignAsset(asset)
          ? await getAssetBalance({
              node,
              currency: asset,
              address: ss58Address,
            })
          : await getBalanceNative({ node, address: ss58Address });
        const formatted = ethers.formatUnits(balBig, asset.decimals ?? 12);
        if (isMounted) {
          setBalance(formatted);
        }
      } catch (e) {
        if (isMounted) {
          setError(e as Error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchBalance();

    return () => {
      isMounted = false;
    };
  }, [node, asset, address]);

  return { balance, loading, error };
};
