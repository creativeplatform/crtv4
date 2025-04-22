import {
  AlchemyAccountsUIConfig,
  cookieStorage,
  createConfig,
} from "@account-kit/react";
import {
  alchemy,
  baseSepolia,
  base,
  optimism,
  polygon,
  mainnet,
} from "@account-kit/infra";
import { QueryClient } from "@tanstack/react-query";
import { modularAccountFactoryAddresses } from "./lib/modularAccount";
import { SITE_TOPIC_LOGO } from "./lib/utils/context";
import Image from "next/image";
import React from "react";

// Define the chains we want to support
const chains = [baseSepolia, base, optimism, polygon, mainnet];

// Default chain for initial connection
const defaultChain = baseSepolia;

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

// Create a factory address mapping for all supported chains
const accountFactoryAddresses = chains.reduce((acc, chain) => {
  if (modularAccountFactoryAddresses[chain.id]) {
    acc[chain.id] = modularAccountFactoryAddresses[chain.id];
  }
  return acc;
}, {} as Record<number, string>);

// Create the query client
export const queryClient = new QueryClient();

// Create the transport with ENS configuration
const transport = alchemy({
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY as string,
});

// Create the Account Kit config
export const config = createConfig(
  {
    transport,
    chain: baseSepolia,
    chains: [
      {
        chain: baseSepolia,
        transport,
      },
      {
        chain: base,
        transport,
      },
      {
        chain: optimism,
        transport,
      },
    ],
    ssr: true,
    storage: cookieStorage,
    enablePopupOauth: true,
  },
  uiConfig
);
