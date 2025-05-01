import { useCallback, useState } from "react";
import { useSmartAccountClient, useChain } from "@account-kit/react";
import { generatePrivateKey } from "viem/accounts";
import { LocalAccountSigner } from "@aa-sdk/core";
import { createModularAccountV2Client } from "@account-kit/smart-contracts";
import { type SmartAccountSigner } from "@aa-sdk/core";
import { alchemy } from "@account-kit/infra";

interface UseSessionKeyOptions {
  permissions?: {
    isGlobal?: boolean;
    allowedFunctions?: string[];
    timeLimit?: number; // in seconds
    spendingLimit?: bigint;
  };
}

export function useSessionKey(options: UseSessionKeyOptions = {}) {
  const { chain } = useChain();
  const { client: smartAccountClient } = useSmartAccountClient({
    type: "ModularAccountV2",
    accountParams: {
      mode: "default",
    },
  });
  const [isInstalling, setIsInstalling] = useState(false);

  const createSessionKey = useCallback(async () => {
    if (!smartAccountClient?.account || !chain) {
      throw new Error("Smart account not initialized or chain not selected");
    }

    setIsInstalling(true);

    try {
      // Generate session key
      const sessionKeyPrivate = generatePrivateKey();
      const sessionKeySigner: SmartAccountSigner =
        LocalAccountSigner.privateKeyToAccountSigner(sessionKeyPrivate);

      // Get API key from existing transport
      const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

      if (!apiKey) {
        throw new Error("Alchemy API key not found");
      }

      // Create session key client
      const sessionKeyClient = await createModularAccountV2Client({
        chain,
        transport: alchemy({ apiKey }),
        signer: sessionKeySigner,
        accountAddress: smartAccountClient.getAddress(),
        signerEntity: {
          entityId: 1, // Start from 1, as 0 is for owner
          isGlobalValidation: options.permissions?.isGlobal ?? true,
        },
      });

      return {
        sessionKeyPrivate,
        sessionKeyClient,
        sessionKeyAddress: await sessionKeySigner.getAddress(),
      };
    } finally {
      setIsInstalling(false);
    }
  }, [smartAccountClient, chain, options.permissions?.isGlobal]);

  return {
    createSessionKey,
    isInstalling,
  };
}
