// lib/smart-account-service.ts

import { getSmartAccountClient } from "@account-kit/core";
import { config } from "@/config";

export class SmartAccountService {
  private client;

  constructor() {
    this.client = getSmartAccountClient(
      {
        type: "ModularAccountV2",
        accountParams: {
          mode: "default",
        },
      },
      config
    );
  }

  getAddress(): string | undefined {
    return this.client.address;
  }
}