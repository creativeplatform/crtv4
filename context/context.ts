// context/context.ts
export const SITE_LOGO = "/creative.svg"; // Using the SVG logo
export const SITE_TOPIC_LOGO =
  "https://bafybeiesvinhgaqvr62rj77jbwkazg3w6bhcrsfyg6zyozasaud53nucnm.ipfs.w3s.link/Creative%20TV%20Logo.png";
export const SITE_NAME = "Creative TV";
export const SITE_ORG = "CREATIVE";
export const SITE_PRODUCT = "TV";

// Hero section constants
export const HERO_NAME = {
  top: "Record Once,",
  bottom: "Use Everywhere!",
};

export const HERO_DESCRIPTION =
  `${SITE_NAME} is a decentralized live-streaming platform that puts you in control of your content and earnings. ` +
  `Get paid 100% of streaming revenue, have access to your own social token, and monetize your content into NFTs.`;

export const HERO_BUTTONS = {
  primary: {
    text: "Get Started",
    href: "/",
  },
  secondary: {
    text: "Watch Demo",
    href: "/",
  },
};

export const STEPPER_FORM_KEYS = {
  1: ["title", "description", "location", "category"],
  2: ["video"],
  3: ["thumbnail"],
  4: ["sell"],
} as const;

export const HERO_VIDEO_TITLE = "Creative TV Demo";

// FEATURED VIDEO
export const FEATURED_VIDEO_TITLE = "The Creative Podcast Episode 03";
export const LIVEPEER_FEATURED_PLAYBACK_ID = "5c2bzf537qbq0r7o";

// Livepeer constants
export const LIVEPEER_HERO_PLAYBACK_ID = "cbd1dw72qst9xmps"; // Default playback ID for hero section video
