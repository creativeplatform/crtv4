// Defensive cleanup for development/hot reload: remove duplicate iframe if present
if (typeof window !== "undefined") {
  const container = document.getElementById("alchemy-signer-iframe-container");
  if (container) container.innerHTML = "";
  const oldIframe = document.getElementById("turnkey-iframe");
  if (oldIframe) oldIframe.remove();
}

import { AlchemyWebSigner } from "@account-kit/signer";

export const signer = new AlchemyWebSigner({
  client: {
    connection: {
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY as string,
    },
    iframeConfig: {
      iframeContainerId: "alchemy-signer-iframe-container",
    },
  },
});
