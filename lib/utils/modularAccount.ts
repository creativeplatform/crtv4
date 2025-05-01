import { baseSepolia, base, optimism } from "@account-kit/infra";

// Define factory addresses for each chain
export const modularAccountFactoryAddresses: Record<number, string> = {
  // Base Sepolia
  [baseSepolia.id]: "0x00000000000017c61b5bEe81050EC8eFc9c6fecd",
  // Base
  [base.id]: "0x00000000000017c61b5bEe81050EC8eFc9c6fecd",
  // Optimism
  [optimism.id]: "0x00000000000017c61b5bEe81050EC8eFc9c6fecd",
};
