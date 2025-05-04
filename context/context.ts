/**
 * Creative TV - Application Constants
 * ==================================
 *
 * This file contains centralized configuration constants used throughout the Creative TV application.
 * Constants are organized by feature area for improved maintainability and documentation.
 *
 * USAGE GUIDELINES:
 * - Import specific constants where needed rather than importing the entire file
 * - Keep related constants grouped together with clear comments
 * - Add JSDoc comments for non-obvious values or those requiring context
 * - When adding new constants, follow the established pattern and document their purpose
 *
 * IMPORTANT: This file should only contain configuration values, not application state.
 * For stateful contexts, see VideoContext.tsx and OrbisContext.tsx
 */

// Site branding constants
export const SITE_LOGO = "/creative.svg"; // Using the SVG logo
export const SITE_TOPIC_LOGO =
  "https://bafybeiesvinhgaqvr62rj77jbwkazg3w6bhcrsfyg6zyozasaud53nucnm.ipfs.w3s.link/Creative%20TV%20Logo.png";
export const SITE_NAME = "Creative TV";
export const SITE_ORG = "CREATIVE";
export const SITE_PRODUCT = "TV";

// Hero section constants - used on landing page
export const HERO_NAME = {
  top: "Record Once,",
  bottom: "Use Everywhere!",
};

/**
 * Primary description of the platform displayed in the hero section
 * References SITE_NAME to maintain consistency if branding changes
 */
export const HERO_DESCRIPTION =
  `${SITE_NAME} is a decentralized live-streaming platform that puts you in control of your content and earnings. ` +
  `Get paid 100% of streaming revenue, have access to your own social token, and monetize your content into NFTs.`;

/**
 * Primary call to action buttons on the hero section
 * TODO: Update href values with appropriate destinations once routes are finalized
 */
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

/**
 * Form field configuration for the multi-step upload process
 * Keys represent step numbers, values are arrays of field names required at each step
 * Used to validate form completion and manage progressive disclosure
 */
export const STEPPER_FORM_KEYS = {
  1: ["title", "description", "location", "category"],
  2: ["video"],
  3: ["thumbnail"],
} as const;

export const HERO_VIDEO_TITLE = "Creative TV Demo";

// Featured content configuration
export const FEATURED_VIDEO_TITLE = "The Creative Podcast Episode 03";
export const LIVEPEER_FEATURED_PLAYBACK_ID = "5c2bzf537qbq0r7o";

/**
 * Livepeer integration constants
 * These IDs connect to specific assets hosted on Livepeer's platform
 * CAUTION: Changing these values will affect what media is displayed to users
 */
export const LIVEPEER_HERO_PLAYBACK_ID = "cbd1dw72qst9xmps"; // Default playback ID for hero section video
