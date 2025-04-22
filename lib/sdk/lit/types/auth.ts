import { LitPKPResource } from "@lit-protocol/auth-helpers";
import type { LitNodeClient } from "@lit-protocol/lit-node-client";
import type { SignerLike } from "@lit-protocol/types";
import type {
  AuthCallbackParams,
  AuthSig as LitAuthSig,
  LitResourceAbilityRequest,
} from "@lit-protocol/types";

// Re-export AuthSig type from Lit Protocol
export type { LitAuthSig as AuthSig };

// Extend AuthCallbackParams to include pkpPublicKey
export interface AuthNeededParams extends AuthCallbackParams {
  pkpPublicKey: string;
}

export function isValidECDSASignature(sig: string): boolean {
  if (!sig) {
    console.warn("Signature validation failed: Empty signature");
    return false;
  }

  const isValid =
    typeof sig === "string" && sig.startsWith("0x") && sig.length === 132; // 0x + 130 chars for r, s, v

  if (!isValid) {
    console.warn("Invalid ECDSA signature format:", {
      length: sig.length,
      starts0x: sig.startsWith("0x"),
      type: typeof sig,
    });
  }

  return isValid;
}

export async function validateSigner(signer: SignerLike): Promise<void> {
  if (!signer) {
    throw new Error("Signer is undefined");
  }

  if (!signer.signMessage || !signer.getAddress) {
    console.error("Invalid signer:", {
      hasSignMessage: !!signer.signMessage,
      hasGetAddress: !!signer.getAddress,
    });
    throw new Error("Invalid signer: missing required methods");
  }

  try {
    const address = await signer.getAddress();
    if (!address) throw new Error("Failed to get signer address");
    console.log("Signer validated successfully:", { address });
  } catch (error) {
    console.error("Signer validation failed:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error("Invalid signer: failed to get address");
  }
}

export function validateAuthParams(params: AuthNeededParams): void {
  const errors: string[] = [];

  if (!params) {
    throw new Error("Auth params are undefined");
  }

  if (!params.uri) errors.push("Missing uri");
  if (!params.expiration) errors.push("Missing expiration");
  if (!params.resourceAbilityRequests?.length)
    errors.push("Missing resource ability requests");
  if (!params.pkpPublicKey) errors.push("Missing PKP public key");

  if (errors.length > 0) {
    console.error("Auth params validation failed:", {
      errors,
      params: {
        hasUri: !!params.uri,
        hasExpiration: !!params.expiration,
        resourceCount: params.resourceAbilityRequests?.length,
        hasPkpPublicKey: !!params.pkpPublicKey,
      },
    });
    throw new Error(`Invalid auth params: ${errors.join(", ")}`);
  }

  console.log("Auth params validated successfully:", {
    uri: params.uri,
    expiration: params.expiration,
    resourceCount: params.resourceAbilityRequests?.length,
    pkpPublicKey: `${params.pkpPublicKey.slice(0, 10)}...`,
  });
}

export function validateAuthSig(authSig: LitAuthSig): void {
  const errors: string[] = [];

  if (!authSig) {
    throw new Error("Auth signature is undefined");
  }

  if (!authSig.sig) errors.push("Missing signature");
  if (!authSig.derivedVia) errors.push("Missing derivedVia");
  if (!authSig.signedMessage) errors.push("Missing signedMessage");
  if (!authSig.address) errors.push("Missing address");

  if (errors.length > 0) {
    console.error("Auth signature validation failed:", {
      errors,
      authSig: {
        hasSignature: !!authSig.sig,
        hasDerivedVia: !!authSig.derivedVia,
        hasSignedMessage: !!authSig.signedMessage,
        hasAddress: !!authSig.address,
      },
    });
    throw new Error(`Invalid auth signature: ${errors.join(", ")}`);
  }

  // Validate signature format
  if (!isValidECDSASignature(authSig.sig)) {
    throw new Error(`Invalid signature format: ${authSig.sig.slice(0, 10)}...`);
  }

  console.log("Auth signature validated successfully:", {
    address: authSig.address,
    signatureStart: `${authSig.sig.slice(0, 10)}...`,
    derivedVia: authSig.derivedVia,
  });
}
