import { Address } from 'viem';

/**
 * Shortens an Ethereum address to a more readable format
 * @param address The Ethereum address to shorten
 * @param chars The number of characters to show at the beginning and end
 * @returns The shortened address
 */
export function shortenAddress(address: string | Address, chars = 4): string {
  if (!address) return '';
  
  const addressStr = typeof address === 'string' ? address : address.toString();
  
  if (addressStr.length <= chars * 2) return addressStr;
  
  return `${addressStr.substring(0, chars + 2)}...${addressStr.substring(
    addressStr.length - chars
  )}`;
}

/**
 * Formats a number to a more readable format (K for thousands, M for millions)
 * @param num The number to format
 * @returns The formatted number as a string
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  } else {
    return num.toString();
  }
}
