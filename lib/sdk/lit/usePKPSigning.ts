import { useCallback } from "react";
import { keccak256, toBytes } from "viem";
import { getLitClient } from "./lit-client";
import { z } from "zod";
import { useUser } from "@account-kit/react";

const DEFAULT_LIT_ACTION_CODE = `
const go = async () => {
  // Ensure toSign is properly formatted
  const messageToSign = typeof toSign === 'string' ? 
    ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(toSign))) :
    toSign;
    
  const sigShare = await Lit.Actions.signEcdsa({ 
    toSign: messageToSign,
    publicKey, 
    sigName 
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
  signatures?: any; // Type from Lit Protocol
  error?: string;
}

export function usePKPSigning() {
  const user = useUser();

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
        const client = await getLitClient();
        if (!client) {
          throw new Error("Lit client not initialized");
        }

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

        console.log("PKP signing successful:", {
          hasSignatures: !!signatures,
          signatureFormat: JSON.stringify(signatures).slice(0, 50) + "...",
        });

        return {
          success: true,
          signatures,
        };
      } catch (error) {
        console.error("PKP signing failed:", {
          error,
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        });
        return {
          success: false,
          error: `Failed to sign with PKP: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        };
      }
    },
    [user?.type]
  );

  const signWithStoredAction = useCallback(
    async ({
      message,
      publicKey,
      sigName = "sig1",
      authSig,
    }: Omit<SignParams, "litActionCode" | "ipfsId">): Promise<SignResult> => {
      console.log("Using stored Lit Action for signing");
      return signWithPKP({
        message,
        publicKey,
        sigName,
        authSig,
        ipfsId: "QmRwN9GKHvCn4Vk7biqtr6adjXMs7PzzYPCzNCRjPFiDjm",
      });
    },
    [signWithPKP]
  );

  return {
    signWithPKP,
    signWithStoredAction,
  };
}
