import { LIT_NETWORK, LIT_ABILITY } from "@lit-protocol/constants";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import {
  LitAccessControlConditionResource,
  createSiweMessage,
  generateAuthSig,
  LitActionResource,
  createSiweMessageWithRecaps,
} from "@lit-protocol/auth-helpers";
import { useSmartAccountClient } from "@account-kit/react";
import useModularAccount from "@/lib/hooks/useModularAccount";
import { useCallback } from "react";

export function useSessionSigs() {
  const { smartAccountClient: client } = useModularAccount();

  const getSessionSigs = useCallback(async () => {
    if (!client) throw new Error("Smart account client not initialized");

    const litNodeClient = new LitNodeClient({
      litNetwork: LIT_NETWORK.Datil,
    });

    try {
      await litNodeClient.connect();
    } catch (error) {
      throw new Error(
        `Failed to connect to Lit Network: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    try {
      return await litNodeClient.getSessionSigs({
        chain: "ethereum",
        expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
        resourceAbilityRequests: [
          {
            resource: new LitActionResource("*"),
            ability: LIT_ABILITY.LitActionExecution,
          },
        ],
        authNeededCallback: async ({
          resourceAbilityRequests,
          expiration,
          uri,
        }) => {
          if (!resourceAbilityRequests || !expiration || !uri) {
            throw new Error("Missing required parameters for SIWE message");
          }

          const toSign = await createSiweMessageWithRecaps({
            uri,
            expiration,
            resources: resourceAbilityRequests,
            walletAddress: client.account.address,
            nonce: await litNodeClient.getLatestBlockhash(),
            litNodeClient,
          });

          const signature = await client.account.signMessage({
            message: toSign,
          });

          return {
            sig: signature,
            derivedVia: "web3.eth.personal.sign",
            signedMessage: toSign,
            address: client.account.address,
          };
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to get session signatures: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [client]);

  return {
    getSessionSigs,
    isReady: !!client,
  };
}
