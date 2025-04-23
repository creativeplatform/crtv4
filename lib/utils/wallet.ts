import type { SignerLike } from "@lit-protocol/types";
import { createPublicClient, http, getAddress } from "viem";
import { baseSepolia } from "viem/chains";

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

/**
 * Checks if a signer is an EOA (Externally Owned Account) or SCA (Smart Contract Account)
 * @param signer - The signer to check
 * @returns Promise<boolean> - True if EOA, false if SCA
 */
export async function isEOA(signer: any): Promise<boolean> {
  try {
    const address = await Promise.resolve(
      signer.account?.address || signer.getAddress()
    );
    const checksummedAddress = getAddress(address);
    const code = await publicClient.getCode({ address: checksummedAddress });
    return !code || code === "0x";
  } catch (error) {
    console.error("Error checking if wallet is EOA:", error);
    return false;
  }
}
