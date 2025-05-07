import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import {
  client,
  client as snapshotClient,
} from "@/lib/sdk/snapshot/snapshot-client";
import type { ActionResponse } from "@/lib/types/actions";
import { createModularAccountClient } from "@/lib/sdk/accountKit/modularAccountClient";
import { base } from "@account-kit/infra"; // or your target chain
import { signer } from "@/lib/sdk/accountKit/signer";
import { stringToHex } from "viem";
import { submitSnapshotProposal } from "@/lib/sdk/snapshot/snapshot-proposal-wrapper";

const actionClient = createSafeActionClient();

const createProposalSchema = z.object({
  title: z.string().min(3, "Title is required"),
  content: z.string().min(3, "Content is required"),
  choices: z.array(z.string().min(1)).min(2, "At least two choices required"),
  start: z.number().int().positive(),
  end: z.number().int().positive(),
  address: z.string().min(1, "Wallet address required"),
  chainId: z.number().int().positive(),
});

// Adapter for Snapshot.js that mimics an ethers.js Wallet using Account Kit signer
function createSnapshotEoaAdapter() {
  return {
    getAddress: async () => signer.getAddress(),
    signMessage: async (message: string | Uint8Array) =>
      signer.signMessage({
        raw: typeof message === "string" ? stringToHex(message) : message,
      }),
  };
}

export const createProposal = actionClient
  .schema(createProposalSchema)
  .action(async ({ parsedInput }) => {
    const { title, content, choices, start, end, address, chainId } =
      parsedInput;

    if (!address)
      return {
        success: false,
        error: "Wallet address required",
      } as ActionResponse;

    if (end <= start)
      return {
        success: false,
        error: "End time must be after start time",
      } as ActionResponse;

    try {
      // 1. Get the modular account client
      const modularAccountClient = await createModularAccountClient({
        chain: base, // or your chain object
        apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY as string,
      });

      // 2. Get the current block number (using viem or account kit client)
      const block = await modularAccountClient.getBlockNumber();

      // 4. Create the proposal using the Account Kit signer as EOA
      const space = "thecreative.eth";
      const snapshotSigner = createSnapshotEoaAdapter();
      const proposalData = {
        space,
        type: "weighted",
        title,
        body: content,
        choices,
        start,
        end,
        snapshot: block,
        discussion: "",
        plugins: JSON.stringify({
          poap: {
            address: "0x0000000000000000000000000000000000000000",
            tokenId: "1",
          },
        }),
      };
      const result = await submitSnapshotProposal({
        signer: snapshotSigner,
        proposal: proposalData,
      });
      if ("error" in result) {
        return { success: false, error: result.error } as ActionResponse;
      }
      return { success: true, data: { id: result.id } } as ActionResponse<{
        id: string;
      }>;
    } catch (error) {
      console.error("Error creating proposal:", error);
      return {
        success: false,
        error: (error as Error).message || "Failed to create proposal",
      } as ActionResponse;
    }
  });
