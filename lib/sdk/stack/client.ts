import { StackClient } from '@stackso/js-core';
import crypto from '@app/lib/utils/crypto';

// Initialize the client with custom event ID generation
export const stack = new StackClient({
  apiKey: process.env.NEXT_PUBLIC_STACK_API_KEY ?? '',
  pointSystemId: 2777,
});

// Helper function to ensure proper token format
export const ensureValidToken = (token: string | object): string => {
  if (!token) return '';

  if (typeof token === 'object') {
    // If it's a Thirdweb auth object, extract the address
    if ('address' in token) {
      return token.address as string;
    }
    // Otherwise stringify the object and encode it
    return Buffer.from(JSON.stringify(token)).toString('base64url');
  }

  // If it's already a string, return it as is
  return token;
};

// Helper function to format address for Stack
export const formatAddress = (
  address: string | object | null | undefined,
): string => {
  if (!address) return '';

  if (typeof address === 'object') {
    // If it's a Thirdweb account object, extract the address
    if ('address' in address) {
      return address.address as string;
    }
    return '';
  }

  return address;
};
