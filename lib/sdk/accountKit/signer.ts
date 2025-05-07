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
