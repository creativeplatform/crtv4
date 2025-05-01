// lib/env-validation.ts

export function validateEnvVariables() {
    const requiredVariables = [
      "NEXT_PUBLIC_API_URL",
      "NEXT_PUBLIC_ACCESS_KEY_SECRET",
      // Add any other required environment variables here
    ];
  
    for (const variable of requiredVariables) {
      if (!process.env[variable]) {
        throw new Error(`Missing environment variable: ${variable}`);
      }
    }
  }