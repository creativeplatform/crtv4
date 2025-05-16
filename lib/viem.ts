import { createPublicClient } from "viem";
import { alchemy, base, baseSepolia } from "@account-kit/infra";

// Create a public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: base,
  transport: alchemy({
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY as string,
  }),
});
