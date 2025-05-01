"use client";

/**
 * AccountDropdown Component
 *
 * This component serves as the primary user account interface for the application,
 * handling wallet connections, network switching, and Lit Protocol integrations.
 *
 * KEY ARCHITECTURE NOTES:
 * 1. INTEGRATION POINTS:
 *    - Account Kit: For wallet connection and chain management
 *    - Lit Protocol: For programmable key pairs (PKPs) and session signatures
 *
 * 2. STATE MANAGEMENT:
 *    - EOA Signer: Required for Lit Protocol authentication (ECDSA signatures)
 *    - Unified Session Signer: Manages session authentication with Lit Protocol
 *    - Chain state: Handles network switching between supported chains
 *
 * 3. IMPORTANT WORKFLOWS:
 *    - Authentication: EOA signer must be initialized before Lit Protocol auth
 *    - Session Signatures: Required for Lit Protocol operations
 *    - Chain Switching: Changes the network for both Account Kit and Lit integrations
 */

import { useState, useEffect } from "react";
import {
  useAuthModal,
  useLogout,
  useUser,
  useChain,
  useSmartAccountClient,
} from "@account-kit/react";
import { base, baseSepolia, optimism } from "@account-kit/infra";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckIcon } from "@radix-ui/react-icons";
import {
  Copy,
  User,
  LogOut,
  Wallet,
  Send,
  ArrowUpDown,
  ArrowBigDown,
  ArrowBigUp,
} from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import WertButton from "@/components/wallet/buy/fund-button";
import { LoginButton } from "@/components/auth/LoginButton";
import useModularAccount from "@/lib/hooks/accountkit/useModularAccount";
import { TokenBalance } from "@/components/wallet/balance/TokenBalance";

const chainIconMap: Record<number, string> = {
  [base.id]: "/images/chains/base.svg",
  [optimism.id]: "/images/chains/optimism.svg",
  [baseSepolia.id]: "/images/chains/base-sepolia.svg",
};

function getChainIcon(chain: { id: number }) {
  return chainIconMap[chain.id] || "/images/chains/default.svg";
}

function NetworkStatus({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="flex items-center">
      {isConnected ? (
        <svg
          className="h-3 w-3 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg
          className="h-3 w-3 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="currentColor"
          />
        </svg>
      )}
    </div>
  );
}

export function AccountDropdown() {
  const { openAuthModal } = useAuthModal();
  const user = useUser();
  const { logout } = useLogout();
  const { chain, setChain, isSettingChain } = useChain();
  const [displayAddress, setDisplayAddress] = useState<string>("");
  const [isNetworkConnected, setIsNetworkConnected] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isArrowUp, setIsArrowUp] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [dialogAction, setDialogAction] = useState<"buy" | "send" | "swap">(
    "buy"
  );

  const { account } = useModularAccount();

  useEffect(() => {
    console.log({
      "EOA Address (user.address)": user?.address,
      "Smart Contract Account Address": account?.address,
    });
  }, [account, user]);

  useEffect(() => {
    async function updateDisplayAddress() {
      if (user?.type === "eoa") {
        if (user?.address) {
          setDisplayAddress(
            `${user.address.slice(0, 6)}...${user.address.slice(-4)}`
          );
        }
      } else if (account?.address) {
        setDisplayAddress(
          `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
        );
      }
    }
    updateDisplayAddress();
  }, [user, account]);

  useEffect(() => {
    const checkNetworkStatus = async () => {
      try {
        if (user?.type === "eoa") {
          setIsNetworkConnected(true);
          return;
        }
        setIsNetworkConnected(true);
      } catch {
        setIsNetworkConnected(false);
      }
    };
    const interval = setInterval(checkNetworkStatus, 10000);
    checkNetworkStatus();
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    setIsDialogOpen(false);
  }, [user]);

  const copyToClipboard = async () => {
    const addressToCopy =
      user?.type === "eoa" ? user?.address : account?.address;
    if (addressToCopy) {
      try {
        await navigator.clipboard.writeText(addressToCopy);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch {}
    }
  };

  const handleActionClick = (action: "buy" | "send" | "swap") => {
    setDialogAction(action);
    setIsDialogOpen(true);
  };

  const handleChainSwitch = async (newChain: any) => {
    if (isSettingChain) return;
    if (chain.id === newChain.id) return;
    setChain({ chain: newChain });
  };

  const getDialogContent = () => {
    switch (dialogAction) {
      case "buy":
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Purchase crypto directly to your wallet.
            </p>
            <div className="flex flex-col gap-4">
              <WertButton />
            </div>
          </div>
        );
      case "send":
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Send crypto to another address.
            </p>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Recipient Address"
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="number"
                placeholder="Amount"
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <Button className="w-full">Send</Button>
            </div>
          </div>
        );
      case "swap":
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Swap between different cryptocurrencies.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <select className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                  <option>ETH</option>
                  <option>USDC</option>
                  <option>DAI</option>
                </select>
                <input
                  type="number"
                  placeholder="Amount"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => setIsArrowUp(!isArrowUp)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {isArrowUp ? (
                    <ArrowBigUp className="h-6 w-6" />
                  ) : (
                    <ArrowBigDown className="h-6 w-6" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <select className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                  <option>USDC</option>
                  <option>ETH</option>
                  <option>DAI</option>
                </select>
                <input
                  type="number"
                  placeholder="Amount"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <Button className="w-full">Swap</Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!user) {
    return <LoginButton />;
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex gap-2 items-center transition-all hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-blue-500"
                >
                  <div className="relative">
                    <Image
                      src={getChainIcon(chain)}
                      alt={chain.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div className="absolute -bottom-1 -right-1">
                      <NetworkStatus isConnected={isNetworkConnected} />
                    </div>
                  </div>
                  <span>{chain.name}</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <pre className="text-xs">{chain.name}</pre>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            align="end"
            className="animate-in fade-in-80 slide-in-from-top-5"
          >
            <DropdownMenuLabel className="font-semibold text-sm text-gray-500 dark:text-gray-400">
              Switch Network
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {[base, optimism, baseSepolia].map((chain) => (
              <Tooltip key={chain.id}>
                <TooltipTrigger asChild>
                  <DropdownMenuItem
                    onClick={() => handleChainSwitch(chain)}
                    disabled={isSettingChain || chain.id === chain.id}
                    className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Image
                      src={getChainIcon(chain)}
                      alt={chain.name}
                      width={32}
                      height={32}
                      className="mr-2 rounded-full"
                    />
                    {chain.name}
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent>
                  <pre className="text-xs">{chain.name}</pre>
                </TooltipContent>
              </Tooltip>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center transition-all hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-blue-500"
          >
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-white bg-gradient-to-r from-blue-500 to-purple-500">
              <User className="h-4 w-4" />
            </div>
            <span className="max-w-[100px] truncate">
              {displayAddress || "Loading..."}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 animate-in fade-in-80 slide-in-from-top-5"
        >
          <DropdownMenuLabel className="flex flex-col gap-2">
            <div
              className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1 transition-colors"
              onClick={copyToClipboard}
            >
              <div className="flex-1">
                {user?.type === "eoa" ? (
                  <div className="font-mono text-sm">
                    {user?.address
                      ? `${user.address.slice(0, 6)}...${user.address.slice(
                          -4
                        )}`
                      : "..."}
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Smart Account
                    </div>
                    <div className="font-mono text-sm">{displayAddress}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Controller:{" "}
                      {user?.address
                        ? `${user.address.slice(0, 6)}...${user.address.slice(
                            -4
                          )}`
                        : "..."}
                    </div>
                  </>
                )}
              </div>
              {copySuccess ? (
                <CheckIcon className="ml-2 h-4 w-4 text-green-500" />
              ) : (
                <Copy className="ml-2 h-4 w-4" />
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <TokenBalance />
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleActionClick("buy")}
            className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Wallet className="mr-2 h-4 w-4 text-green-500" /> Buy
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleActionClick("send")}
            className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Send className="mr-2 h-4 w-4 text-blue-500" /> Send
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleActionClick("swap")}
            className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowUpDown className="mr-2 h-4 w-4 text-purple-500" /> Swap
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => logout()}
            className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <LogOut className="mr-2 h-4 w-4 text-red-500" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setDialogAction("buy");
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {dialogAction.charAt(0).toUpperCase() + dialogAction.slice(1)}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === "buy" &&
                "Purchase cryptocurrency directly to your wallet using your preferred payment method."}
              {dialogAction === "send" &&
                "Transfer cryptocurrency to another wallet address securely."}
              {dialogAction === "swap" &&
                "Exchange one cryptocurrency for another at the best available rates."}
            </DialogDescription>
            <DialogClose asChild className="absolute right-4 top-4" />
          </DialogHeader>
          <div className="grid gap-4 py-4">{getDialogContent()}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
