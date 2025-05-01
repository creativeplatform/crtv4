import { createPublicClient } from "viem";
import { alchemy, baseSepolia } from "@account-kit/infra";

// Create a public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: alchemy({
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY as string,
  }),
});
