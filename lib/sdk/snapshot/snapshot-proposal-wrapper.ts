import { stringToHex } from "viem";

/**
 * Submits a proposal to Snapshot using a custom signer (e.g., Account Kit signer).
 * @param signer - Adapter with getAddress and signMessage
 * @param proposal - Proposal data (space, type, title, body, etc.)
 * @param hubUrl - Snapshot hub URL (default: https://hub.snapshot.org)
 * @returns Proposal receipt or error
 */
export async function submitSnapshotProposal({
  signer,
  proposal,
  hubUrl = "https://hub.snapshot.org",
}: {
  signer: {
    getAddress: () => Promise<string>;
    signMessage: (message: string | Uint8Array) => Promise<`0x${string}`>;
  };
  proposal: Record<string, unknown>;
  hubUrl?: string;
}): Promise<{ id: string } | { error: string }> {
  const address = await signer.getAddress();
  const payload = {
    address,
    ...proposal,
  };
  // Snapshot expects the payload to be signed as a stringified JSON
  const message = JSON.stringify(payload);
  const sig = await signer.signMessage(stringToHex(message));

  const body = {
    address,
    sig,
    data: payload,
  };

  const res = await fetch(`${hubUrl}/api/msg`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      address,
      sig,
      data: payload,
      type: "proposal",
    }),
  });

  if (!res.ok) {
    return { error: `Snapshot proposal failed: ${res.statusText}` };
  }
  const json = await res.json();
  if (json.id) return { id: json.id };
  return { error: json.error || "Unknown error" };
}
