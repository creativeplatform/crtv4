import { LitContracts } from "@lit-protocol/contracts-sdk";
import { LIT_NETWORK } from "@lit-protocol/constants";
import { getSigner } from "@account-kit/core";
import { config } from "@/config";

let contractClientInstance: LitContracts | null = null;

async function initializeContractClient() {
  if (contractClientInstance) return contractClientInstance;

  const signer = getSigner(config);
  if (!signer) throw new Error("No signer available");

  const client = new LitContracts({
    signer,
    network: LIT_NETWORK.Datil,
  });

  await client.connect();
  contractClientInstance = client;
  return client;
}

export async function getContractClient() {
  return initializeContractClient();
}

export { initializeContractClient };
