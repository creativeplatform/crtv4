import { useCallback } from "react";
import { keccak256, toBytes } from "viem";
import { getLitClient } from "../../sdk/lit/lit-client";
import { z } from "zod";
import { useUser } from "@account-kit/react";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";
import type { SessionSigs } from "@lit-protocol/types";

const DEFAULT_LIT_ACTION_CODE = `
const go = async () => {
  // Ensure toSign is properly formatted
  const messageToSign = typeof toSign === 'string' ? 
    ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(toSign))) :
    toSign;
    
  const sigShare = await Lit.Actions.signEcdsa({ 
    toSign: messageToSign,
    publicKey, 
    sigName,
    shouldHashMessage: true,
    sigType: "ethereum",
  });
  return sigShare;
}
go()
`;

const SignParamsSchema = z
  .object({
    message: z.string(),
    publicKey: z.string(),
    sigName: z.string().default("sig1"),
    authSig: z.any(), // Type will come from your auth context
    litActionCode: z.string().optional(),
    ipfsId: z.string().optional(),
  })
  .refine(
    (params) => !!(params.litActionCode || params.ipfsId),
    "Either litActionCode or ipfsId must be provided"
  );

export type SignParams = z.infer<typeof SignParamsSchema>;

export interface SignResult {
  success: boolean;
  signatures?: any; // Will be properly typed once we have the full signature format
  error?: string;
}

export interface TransactionSignParams extends SignParams {
  transaction: {
    to: string;
    value: bigint;
    data: string;
    nonce?: number;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    gasLimit?: bigint;
  };
}

export function usePKPSigning() {
  const user = useUser();

  const initializeLitClient = useCallback(async (): Promise<LitNodeClient> => {
    const client = new LitNodeClient({
      litNetwork: LIT_NETWORK.Datil,
      debug: false,
    });
    await client.connect();
    return client;
  }, []);

  const signWithPKP = useCallback(
    async ({
      message,
      publicKey,
      sigName = "sig1",
      authSig,
      litActionCode = DEFAULT_LIT_ACTION_CODE,
      ipfsId,
    }: SignParams): Promise<SignResult> => {
      if (!user?.type || user.type !== "sca") {
        return {
          success: false,
          error: "Smart Contract Account required for Lit Protocol signing",
        };
      }

      console.log("Initializing PKP signing with:", {
        messageLength: message.length,
        publicKey,
        sigName,
        hasAuthSig: !!authSig,
        hasIpfsId: !!ipfsId,
      });

      try {
        const client = await initializeLitClient();

        const params = SignParamsSchema.parse({
          message,
          publicKey,
          sigName,
          authSig,
          litActionCode,
          ipfsId,
        });

        // Properly format the message for signing
        const messageBytes = toBytes(keccak256(toBytes(message)));

        console.log(
          "Executing Lit Action for signing with formatted message:",
          {
            messageBytes: messageBytes.slice(0, 10).toString() + "...",
            publicKey: publicKey.slice(0, 10) + "...",
            sigName,
          }
        );

        const signatures = await client.executeJs({
          code: params.litActionCode,
          ipfsId: params.ipfsId,
          sessionSigs: params.authSig,
          jsParams: {
            toSign: messageBytes,
            publicKey: params.publicKey,
            sigName: params.sigName,
          },
        });

        // Validate signature format
        if (!signatures || typeof signatures !== "object") {
          throw new Error("Invalid signature format returned from Lit Action");
        }

        return {
          success: true,
          signatures,
        };
      } catch (error) {
        console.error("PKP signing failed:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "PKP signing failed",
        };
      }
    },
    [user?.type, initializeLitClient]
  );

  const signTransaction = useCallback(
    async ({
      transaction,
      publicKey,
      authSig,
    }: TransactionSignParams): Promise<SignResult> => {
      try {
        // Serialize transaction data
        const serializedTx = {
          to: transaction.to,
          value: transaction.value.toString(),
          data: transaction.data,
          nonce: transaction.nonce,
          maxFeePerGas: transaction.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: transaction.maxPriorityFeePerGas?.toString(),
          gasLimit: transaction.gasLimit?.toString(),
        };

        // Create transaction signing code
        const txSigningCode = `
const go = async () => {
  // Serialize and sign the transaction
  const tx = ${JSON.stringify(serializedTx)};
  
  const sigShare = await Lit.Actions.signEcdsa({
    toSign: tx,
    publicKey,
    sigName: "txSig",
    shouldHashMessage: true,
    sigType: "ethereum",
  });
  
  return sigShare;
}
go();
`;

        // Sign the transaction using PKP
        return signWithPKP({
          message: JSON.stringify(serializedTx),
          publicKey,
          sigName: "txSig",
          authSig,
          litActionCode: txSigningCode,
        });
      } catch (error) {
        console.error("Transaction signing failed:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Transaction signing failed",
        };
      }
    },
    [signWithPKP]
  );

  return {
    signWithPKP,
    signTransaction,
  };
}
