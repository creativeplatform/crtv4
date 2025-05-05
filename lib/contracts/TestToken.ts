import { erc20Abi } from "viem";

export const TEST_TOKEN_ADDRESS = "0x3bE123Ff0ec7c0717D6C05C8957EA7880e2FfDcb";
export const TEST_TOKEN_SYMBOL = "TT";
export const TEST_TOKEN_DECIMALS = 18;

export const testTokenContract = {
  address: TEST_TOKEN_ADDRESS,
  abi: erc20Abi,
  symbol: TEST_TOKEN_SYMBOL,
  decimals: TEST_TOKEN_DECIMALS,
} as const;
