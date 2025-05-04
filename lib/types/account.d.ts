import type { User as BaseUser } from "@account-kit/signer";
import { type Account as ViemAccount } from "viem";

type User = BaseUser & { type: "eoa" | "sca" };

export interface Account {
  address: string;
  type: "eoa" | "sca";
}

export declare function userToAccount(user: User | null): Account | null;

export declare function viemToAccount(account: ViemAccount): Account;
