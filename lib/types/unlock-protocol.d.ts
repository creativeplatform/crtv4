declare module "@unlock-protocol/contracts" {
  interface ContractABI {
    abi: any[];
  }

  export const PublicLockV14: ContractABI;
  export const PublicLockV15: ContractABI;
  export const UnlockV14: ContractABI;
}

declare module "@unlock-protocol/contracts/dist/abis/PublicLock/PublicLockV14.json" {
  interface PublicLockV14Functions {
    getHasValidKey(owner: `0x${string}`): Promise<boolean>;
    balanceOf(owner: `0x${string}`): Promise<bigint>;
    tokenURI(tokenId: bigint): Promise<string>;
  }

  interface PublicLockV14Contract {
    read: PublicLockV14Functions;
  }

  const value: {
    abi: any[];
    bytecode: string;
    deployedBytecode: string;
    contract: PublicLockV14Contract;
  };
  export default value;
}
