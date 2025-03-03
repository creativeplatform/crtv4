'use server';

import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: string; // The subject (typically the wallet address)
  aud: string; // Audience
  exp: number; // Expiration time
  iat: number; // Issued at time
  [key: string]: any; // Other custom claims
}

/**
 * Gets the JWT context from the user's session
 * @returns Object containing the user's address and other JWT claims
 */
export async function getJwtContext() {
  try {
    // Get the JWT from cookies
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    
    if (!authToken) {
      console.error('No auth token found in cookies');
      return { address: null };
    }
    
    // Decode the JWT to get the payload
    const decoded = jwtDecode<JwtPayload>(authToken);
    
    // Check if the token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      console.error('Auth token is expired');
      return { address: null };
    }
    
    // Return the address (subject) and any other claims
    return {
      address: decoded.sub,
      ...decoded
    };
  } catch (error) {
    console.error('Error getting JWT context:', error);
    return { address: null };
  }
}

/**
 * Validates that a user is authenticated
 * @returns Boolean indicating if the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { address } = await getJwtContext();
  return !!address;
}
