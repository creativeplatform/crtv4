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

  // Log signer type and capabilities
  console.log("Validating signer:", {
    type: signer.constructor.name,
    hasSignMessage: typeof signer.signMessage === "function",
    hasGetAddress: typeof signer.getAddress === "function",
    hasProvider: !!(signer as any).provider,
    providerType: (signer as any).provider?.constructor?.name || "Unknown",
  });

  if (!signer.signMessage || !signer.getAddress) {
    throw new Error(
      "Invalid signer: missing required methods signMessage or getAddress"
    );
  }

  try {
    const address = await signer.getAddress();
    if (!address || !address.startsWith("0x")) {
      throw new Error("Invalid address format from signer");
    }

    console.log("Signer address validated:", address);

    // Test signing capability with a known message
    const testMessage = "Lit Protocol Signer Validation Test";
    console.log("Testing signer with message:", testMessage);

    const signature = await signer.signMessage(testMessage);

    // Validate signature format
    if (!signature) {
      throw new Error("Signer returned null or undefined signature");
    }

    if (!signature.startsWith("0x")) {
      console.warn("Signature missing 0x prefix, will be added automatically");
    }

    const formattedSig = signature.startsWith("0x")
      ? signature
      : `0x${signature}`;

    // Check signature length (65 bytes = 130 hex chars + 0x prefix = 132 total)
    if (formattedSig.length !== 132) {
      throw new Error(
        `Invalid signature length: ${formattedSig.length} chars (expected 132)`
      );
    }

    // Check signature format (must be hex)
    if (!/^0x[0-9a-fA-F]{130}$/.test(formattedSig)) {
      throw new Error(
        "Invalid signature format: must be 0x-prefixed hex string"
      );
    }

    // Check for invalid signatures (all zeros, etc)
    if (formattedSig.replace("0x", "").match(/^0+$/)) {
      throw new Error("Invalid signature: contains all zeros");
    }

    console.log("Signer validation successful:", {
      address,
      signaturePreview: `${formattedSig.slice(0, 10)}...${formattedSig.slice(
        -8
      )}`,
      signatureLength: formattedSig.length,
    });
  } catch (error) {
    console.error("Signer validation failed:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(
      `Signer validation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
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
