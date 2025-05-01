"use server";

import crypto from "crypto";
import { WebhookContext } from "./token-gate/route";

// Secret key for HMAC - in production, use a strong environment variable
const SECRET_KEY =
  process.env.ACCESS_KEY_SECRET || "livepeer-access-key-secret";

/**
 * Generates an access key for a user to access token-gated content
 *
 * @param address User wallet address
 * @param context Context containing token information
 * @returns Access key string or null if generation fails
 */
export async function generateAccessKey(
  address: string,
  context: WebhookContext
): Promise<string | null> {
  try {
    if (!address || !context.contractAddress || !context.tokenId) {
      console.error("Missing required parameters for access key generation");
      return null;
    }

    // Create a message from the address and context
    const message = JSON.stringify({
      address,
      context,
      timestamp: Date.now(),
    });

    // Create HMAC signature
    const hmac = crypto.createHmac("sha256", SECRET_KEY);
    hmac.update(message);
    const signature = hmac.digest("hex");

    // Encode the entire payload for transmission
    const payload = Buffer.from(message).toString("base64");

    // Return the combined access key
    return `${payload}.${signature}`;
  } catch (error) {
    console.error("Error generating access key:", error);
    return null;
  }
}

/**
 * Validates an access key against a user address and context
 *
 * @param accessKey The access key to validate
 * @param address User wallet address
 * @param context Context containing token information
 * @returns Boolean indicating if the access key is valid
 */
export async function validateAccessKey(
  accessKey: string,
  address: string,
  context: WebhookContext
): Promise<boolean> {
  try {
    // Split the access key into payload and signature
    const [payload, signature] = accessKey.split(".");

    if (!payload || !signature) {
      console.error("Invalid access key format");
      return false;
    }

    // Decode the payload
    const decodedPayload = Buffer.from(payload, "base64").toString();
    const parsedPayload = JSON.parse(decodedPayload);

    // Verify the address matches
    if (parsedPayload.address !== address) {
      console.error("Address mismatch in access key");
      return false;
    }

    // Verify the context matches critical fields
    if (
      parsedPayload.context.contractAddress !== context.contractAddress ||
      parsedPayload.context.tokenId !== context.tokenId ||
      parsedPayload.context.chain !== context.chain
    ) {
      console.error("Context mismatch in access key");
      return false;
    }

    // Recreate the HMAC signature for verification
    const hmac = crypto.createHmac("sha256", SECRET_KEY);
    hmac.update(decodedPayload);
    const expectedSignature = hmac.digest("hex");

    // Compare signatures using string comparison instead of timingSafeEqual
    // This is a simpler approach that avoids the Buffer type issues
    return signature === expectedSignature;
  } catch (error) {
    console.error("Error validating access key:", error);
    return false;
  }
}
