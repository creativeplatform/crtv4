import crypto from "crypto";

export interface WebhookContext {
  type: "token-gate";
  rules: {
    [key: string]: any;
  };
}

// Generate an access key for the given address and asset ID
export function generateAccessKey(
  address: string | undefined,
  context: WebhookContext
): string {
  const secret = process.env.ACCESS_KEY_SECRET as string;

  if (!secret) {
    throw new Error("No secret provided");
  }

  if (!address) {
    throw new Error("No address provided");
  }

  const payload = JSON.stringify({
    address,
    context,
  });

  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

// Validate the generated access key
export function validateAccessKey(
  accessKey: string,
  address: string,
  context: WebhookContext
): boolean {
  const regeneratedKey = generateAccessKey(address, context);

  return crypto.timingSafeEqual(
    new Uint8Array(Buffer.from(accessKey)),
    new Uint8Array(Buffer.from(regeneratedKey))
  );
}
