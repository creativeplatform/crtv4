import { LitContracts } from "@lit-protocol/contracts-sdk";
import { LIT_NETWORK } from "@lit-protocol/constants";
import { getSigner } from "@account-kit/core";
import { config } from "@/config";
import { ethers } from "ethers";
import type { LIT_NETWORKS } from "@lit-protocol/constants";
import type { AlchemyAccountsConfig } from "@account-kit/core";
import type { SignableMessage } from "viem";

let contractClientInstance: LitContracts | null = null;

interface ContractClientConfig {
  signer: ethers.Signer | any;
}

interface MinimalSigner {
  signMessage(message: SignableMessage): Promise<`0x${string}`>;
  getAddress(): Promise<string>;
}

async function initializeContractClient(customConfig?: ContractClientConfig) {
  console.log("Initializing Lit contract client...");

  if (contractClientInstance && !customConfig) return contractClientInstance;

  try {
    let signer: MinimalSigner;

    if (customConfig?.signer) {
      console.log("Using provided signer");
      if (!customConfig.signer.signMessage || !customConfig.signer.getAddress) {
        throw new Error("Invalid signer: missing required methods");
      }
      signer = customConfig.signer;
    } else {
      console.log("Getting default signer");
      const defaultSigner = await getSigner(config);
      if (!defaultSigner) throw new Error("No signer available");
      signer = defaultSigner;
    }

    // Validate signer
    try {
      await signer.getAddress();
    } catch (error) {
      throw new Error("Invalid signer: failed to get address");
    }

    console.log("Creating Lit Contracts instance");
    const client = new LitContracts({
      signer: {
        signMessage: async (msg: string | Uint8Array) => {
          console.log(
            "Signing message:",
            typeof msg === "string" ? msg : "bytes"
          );
          const signableMsg =
            typeof msg === "string" ? msg : ethers.utils.hexlify(msg);
          return signer.signMessage(signableMsg as SignableMessage);
        },
        getAddress: async () => {
          const address = await signer.getAddress();
          console.log("Signer address:", address);
          return address;
        },
      },
      network: LIT_NETWORK.Datil,
    });

    console.log("Connecting to Lit network...");
    await client.connect();
    console.log("Successfully connected to Lit network");

    if (!customConfig) {
      contractClientInstance = client;
    }
    return client;
  } catch (error) {
    console.error("Contract client initialization error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    if (!customConfig) contractClientInstance = null;
    throw error;
  }
}

export async function getContractClient(config?: ContractClientConfig) {
  return initializeContractClient(config);
}

export { initializeContractClient };
