import { erc20Abi } from "viem";

export const USDC_TOKEN_ADDRESS = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
export const USDC_TOKEN_SYMBOL = "USDC";
export const USDC_TOKEN_DECIMALS = 6;

export const usdcTokenContract = {
  address: USDC_TOKEN_ADDRESS,
  abi: erc20Abi,
  symbol: USDC_TOKEN_SYMBOL,
  decimals: USDC_TOKEN_DECIMALS,
} as const;
