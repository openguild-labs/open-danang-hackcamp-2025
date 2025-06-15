import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3FromAddress } from "@polkadot/extension-dapp";

const apiCache: Record<string, ApiPromise> = {};

export async function getApi(endpoint: string): Promise<ApiPromise> {
  if (apiCache[endpoint]) return apiCache[endpoint];
  const provider = new WsProvider(endpoint);
  const api = await ApiPromise.create({ provider });
  apiCache[endpoint] = api;
  return api;
}

export async function getSigner(address: string) {
  const injector = await web3FromAddress(address);
  return injector.signer;
}