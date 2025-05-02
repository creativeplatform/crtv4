import { type Address } from 'viem';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface ContractConfig {
  address: Address;
  abi: any[];
  chainId: number;
}

export interface NFTContract {
  config: ContractConfig;
  properties: {
    name: string;
    symbol: string;
    totalSupply: bigint;
  };
}

type Properties = {
  properties: {
    price: bigint;
    amount: bigint;
    createdAt: number;
  };
};
export type NFT = {
  metadata: NFTMetadata & Properties;
  owner: string | null;
  id: bigint;
  tokenURI: string;
  type: 'ERC1155';
  supply: bigint;
};

export type ResolvedReturnType<T> = T extends Promise<infer U> ? U : T;

export type TVideoContract = Readonly<ContractConfig> | undefined;
