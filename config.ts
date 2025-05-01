import {
  createConfig,
  cookieStorage,
  type AlchemyAccountsUIConfig,
  type CreateConfigProps,
} from "@account-kit/react";
import { alchemy, baseSepolia, base, optimism } from "@account-kit/infra";
import { QueryClient } from "@tanstack/react-query";
import { modularAccountFactoryAddresses } from "./lib/utils/modularAccount";
import { SITE_TOPIC_LOGO } from "./context/context";
import Image from "next/image";
import React from "react";

// Define the chains we want to support
const chains = [baseSepolia, base, optimism];

// Default chain for initial connection
const defaultChain = baseSepolia;

// Create transport
const transport = alchemy({
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY as string,
});

// Create query client
export const queryClient = new QueryClient();

const uiConfig: AlchemyAccountsUIConfig = {
  illustrationStyle: "linear",
  auth: {
    sections: [
      [{ type: "email", emailMode: "otp" }],
      [
        { type: "passkey" },
        { type: "social", authProviderId: "google", mode: "popup" },
        { type: "social", authProviderId: "facebook", mode: "popup" },
      ],
      [
        {
          type: "external_wallets",
          walletConnect: {
            projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID as string,
          },
        },
      ],
    ],
    addPasskeyOnSignup: true,
    header: React.createElement(Image, {
      src: SITE_TOPIC_LOGO,
      alt: "Site Logo",
      width: 80,
      height: 80,
    }),
  },
  supportUrl: "https://t.me/CreativeMuse_bot",
};

// Create the Account Kit config
export const config = createConfig(
  {
    transport,
    chain: defaultChain,
    chains: chains.map((chain) => ({
      chain,
      transport,
    })),
    ssr: true,
    storage: cookieStorage,
    enablePopupOauth: true,
    accountConfig: {
      type: "ModularAccountV2",
      accountParams: {
        mode: "default",
        factoryAddresses: modularAccountFactoryAddresses,
      },
      gasManagerConfig: {
        policyId: process.env.NEXT_PUBLIC_GAS_POLICY_ID,
        sponsorUserOperations: true,
      },
    },
  } as CreateConfigProps,
  uiConfig
);
