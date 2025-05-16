import { createPublicClient, getAddress } from "viem";
import { alchemy, base } from "@account-kit/infra";

const publicClient = createPublicClient({
  chain: base,
  transport: alchemy({
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY as string,
  }),
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

/**
 * Checks if a wallet is connected based on user and client availability
 * @param user - The user object from useUser() hook
 * @param client - The smart account client from useModularAccount() hook
 * @returns boolean - True if wallet is connected and initialized, false otherwise
 */
export function isWalletConnected(user: any, client: any): boolean {
  // Check if user exists (wallet is connected)
  if (!user) {
    return false;
  }

  // Optionally check if smart account client is initialized
  if (client === undefined) {
    // Only checking user, not client
    return true;
  }

  // Check both user and client
  return !!client;
}
