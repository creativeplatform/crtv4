// EIP-1271 Adapter for Snapshot.js using Account Kit Modular Account V2
import type { Hex } from "viem";

interface Eip1271Signer {
  address: string;
  signMessage: (params: { message: string | Uint8Array }) => Promise<Hex>;
}

export function createEip1271SnapshotAdapter(signer: Eip1271Signer) {
  return {
    // Snapshot.js expects a web3-like object with a getSigner()._signTypedData method
    getSigner: () => ({
      _signTypedData: async (_domain: any, _types: any, message: any) => {
        // Snapshot.js passes the message as the third argument
        // You may need to serialize the message as per your use case
        return signer.signMessage({ message: JSON.stringify(message) });
      },
      getAddress: async () => signer.address,
    }),
  };
}
