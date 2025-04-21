import { z } from "zod";

const configSchema = z.object({
  alchemyApiKey: z.string().min(1, "Alchemy API key is required"),
  // ... any other config values
});

export type Config = z.infer<typeof configSchema>;

// Load config from environment variables
export const config: Config = {
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "",
  // ... any other config values
};

// Validate config
configSchema.parse(config);
