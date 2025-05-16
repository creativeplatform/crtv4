import { signer } from "./signer";
import { createWalletClient, http } from "viem";
import { base } from "viem/chains";

export const walletClient = createWalletClient({
  transport: http(
    `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
  ),
  chain: base,
  account: signer.toViemAccount(),
});
