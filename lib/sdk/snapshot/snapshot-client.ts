import snapshot from "@snapshot-labs/snapshot.js";

const hub = "https://hub.snapshot.org"; // or https://testnet.hub.snapshot.org for testnet
export const client = new snapshot.Client712(hub);
