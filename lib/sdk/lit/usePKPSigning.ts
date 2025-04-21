import { useCallback } from "react";
import { arrayRegex } from "viem/utils";
import { keccak256 } from "viem";
import { getLitClient } from "./lit-client";
import { z } from "zod";

const DEFAULT_LIT_ACTION_CODE = `
const go = async () => {
  const sigShare = await Lit.Actions.signEcdsa({ toSign, publicKey, sigName })
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
  const signWithPKP = useCallback(
    async ({
      message,
      publicKey,
      sigName = "sig1",
      authSig,
      litActionCode = DEFAULT_LIT_ACTION_CODE,
      ipfsId,
    }: SignParams): Promise<SignResult> => {
      const client = await getLitClient();
      if (!client)
        return {
          success: false,
          error: "Lit client not initialized",
        };

      try {
        const params = SignParamsSchema.parse({
          message,
          publicKey,
          sigName,
          authSig,
          litActionCode,
          ipfsId,
        });

        // Convert message to 32 byte format
        const messageBytes = arrayRegex;

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

        return {
          success: true,
          signatures,
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to sign with PKP: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        };
      }
    },
    []
  );

  const signWithStoredAction = useCallback(
    async ({
      message,
      publicKey,
      sigName = "sig1",
      authSig,
    }: Omit<SignParams, "litActionCode" | "ipfsId">): Promise<SignResult> => {
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
