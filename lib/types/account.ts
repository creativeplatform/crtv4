import type { User as BaseUser } from "@account-kit/signer";
import { type Account as ViemAccount } from "viem";

type User = BaseUser & { type: "eoa" | "sca" };

export interface Account {
  address: string;
  type: "eoa" | "sca";
}

export function userToAccount(user: User | null): Account | null {
  if (!user) return null;

  return {
    address: user.address,
    type: user.type,
  };
}

export function viemToAccount(account: ViemAccount): Account {
  return {
    address: account.address,
    type: "eoa",
  };
}
