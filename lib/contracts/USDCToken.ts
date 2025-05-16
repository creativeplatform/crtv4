import { erc20Abi } from "viem";

export const USDC_TOKEN_ADDRESSES = {
  base: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  optimism: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
  // Add more chains as needed
} as const;

export const USDC_TOKEN_SYMBOL = "USDC";
export const USDC_TOKEN_DECIMALS = 6;

export function getUsdcTokenContract(chain: keyof typeof USDC_TOKEN_ADDRESSES) {
  return {
    address: USDC_TOKEN_ADDRESSES[chain],
    abi: erc20Abi,
    symbol: USDC_TOKEN_SYMBOL,
    decimals: USDC_TOKEN_DECIMALS,
  } as const;
}
