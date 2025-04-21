import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { LIT_NETWORK, LIT_ERROR_KIND } from "@lit-protocol/constants";

// Create a singleton instance of the Lit client
let litClientInstance: LitJsSdk.LitNodeClient | null = null;
let isConnecting = false;
let connectionPromise: Promise<LitJsSdk.LitNodeClient> | null = null;

interface LitClientError extends Error {
  code?: string;
  message: string;
  kind?: typeof LIT_ERROR_KIND;
}

async function initializeLitClient() {
  // If already initialized, return the instance
  if (litClientInstance) return litClientInstance;

  // If already connecting, return the existing promise
  if (isConnecting && connectionPromise) return connectionPromise;

  try {
    isConnecting = true;
    connectionPromise = (async () => {
      const client = new LitJsSdk.LitNodeClient({
        litNetwork: LIT_NETWORK.Datil,
        debug: process.env.NODE_ENV === "development",
        minNodeCount: 2, // Minimum number of node signatures required
        connectTimeout: 20000, // 20 seconds
      });

      await client.connect();

      litClientInstance = client;
      return litClientInstance;
    })();

    const client = await connectionPromise;
    return client;
  } catch (error) {
    const litError = error as LitClientError;
    console.error("Failed to initialize Lit client:", {
      code: litError.code,
      message: litError.message,
      kind: litError.kind,
      stack: litError.stack,
    });
    litClientInstance = null;
    connectionPromise = null;
    throw new Error(`Failed to initialize Lit client: ${litError.message}`);
  } finally {
    isConnecting = false;
  }
}

async function reconnect() {
  try {
    litClientInstance = null;
    connectionPromise = null;
    return await initializeLitClient();
  } catch (error) {
    const litError = error as LitClientError;
    console.error("Failed to reconnect to Lit client:", {
      code: litError.code,
      message: litError.message,
      kind: litError.kind,
      stack: litError.stack,
    });
    throw new Error(`Failed to reconnect to Lit client: ${litError.message}`);
  }
}

// Create a lazy-loaded client getter that ensures we have an initialized client
async function getLitClient() {
  try {
    if (!litClientInstance && !connectionPromise) {
      await initializeLitClient();
    } else if (connectionPromise) {
      await connectionPromise;
    }

    if (!litClientInstance) {
      throw new Error("Lit client initialization failed");
    }

    return litClientInstance;
  } catch (error) {
    const litError = error as LitClientError;
    console.error("Failed to get Lit client:", {
      code: litError.code,
      message: litError.message,
      kind: litError.kind,
      stack: litError.stack,
    });
    throw new Error(`Failed to get Lit client: ${litError.message}`);
  }
}

export { initializeLitClient, reconnect, getLitClient };
