/**
 * Helper functions for the application
 */

export const claimConditionsOptions = {
  currency: {
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    MATIC: '0x0000000000000000000000000000000000001010',
  },
} as const;

/**
 * Converts a timestamp to a date string
 */
export function timestampToDateString(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleString();
}

/**
 * Converts a timestamp to an input date string format
 */
export function timestampToInputDateString(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toISOString().slice(0, 16);
}

/**
 * Formats a price in human readable format
 */
export function priceInHumanReadable(price: bigint, decimals: number): string {
  return (Number(price) / 10 ** decimals).toString();
}

/**
 * Gets ERC20 metadata
 */
export async function getERC20Metadata(address: string) {
  try {
    // Implementation would go here - for now returning null as placeholder
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Parses a timestamp to date
 */
export function parseTimestampToDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Converts a string to title case
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Parses an IPFS URI and returns the HTTP gateway URL
 * @param uri - The IPFS URI to parse
 * @returns The HTTP gateway URL
 */
export function parseIpfsUri(uri: string): string {
  if (!uri) return '';

  // Handle ipfs:// protocol
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }

  // Handle ipfs hash format
  if (uri.startsWith('Qm') || uri.startsWith('bafy')) {
    return `https://ipfs.io/ipfs/${uri}`;
  }

  return uri;
}

/**
 * Formats a wallet address to a shortened display format
 * @param address - The wallet address to format
 * @returns The formatted address (e.g., 0x1234...5678)
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Formats a number to a human-readable string with specified decimal places
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns The formatted number string
 */
export function formatNumber(value: number, decimals = 2): string {
  if (typeof value !== 'number') return '0';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
