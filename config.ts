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

// Format chains for the config
const formattedChains = chains.map((chain) => ({
  chain,
}));

export const config = createConfig(
  {
    transport: alchemy({
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY as string,
    }),
    chains: formattedChains,
    chain: defaultChain,
    ssr: true, // more about ssr: https://accountkit.alchemy.com/react/ssr
    storage: cookieStorage, // more about persisting state with cookies: https://accountkit.alchemy.com/react/ssr#persisting-the-account-state
    enablePopupOauth: true, // must be set to "true" if you plan on using popup rather than redirect in the social login flow
  },
  uiConfig
);

export const queryClient = new QueryClient();
