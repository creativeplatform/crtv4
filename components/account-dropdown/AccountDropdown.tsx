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

import { useState, useEffect, useRef } from "react";
import {
  useAuthModal,
  useLogout,
  useUser,
  useChain,
  useSmartAccountClient,
} from "@account-kit/react";
import { base, baseSepolia, optimism, polygon } from "@account-kit/infra";
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
  Key,
  Plus,
  ArrowUpRight,
  ArrowUpDown,
  ArrowBigDown,
  ArrowBigUp,
} from "lucide-react";
import { TokenBalance } from "@/components/wallet/balance/TokenBalance";
import { LitProtocolStatus } from "@/components/LitProtocolStatus";
import SessionSigManager, {
  SessionSig,
} from "@/components/lit/GetSessionSigsButton";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import Image from "next/image";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { useUnifiedSessionSigner } from "@/lib/hooks/lit/useUnifiedSessionSigner";
import type { SessionSigs } from "@lit-protocol/types";
import { LitSmartAccount } from "../LitSmartAccount";
import { useEoaSigner } from "@/lib/hooks/lit/useEoaSigner";

const chainIconMap: Record<number, string> = {
  [base.id]: "/images/chains/base.svg",
  [optimism.id]: "/images/chains/optimism.svg",
  [baseSepolia.id]: "/images/chains/base-sepolia.svg",
  [polygon.id]: "/images/chains/polygon.svg",
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
  const { chain: currentChain, setChain, isSettingChain } = useChain();
  const { client: smartAccountClient } = useSmartAccountClient({});
  const [displayAddress, setDisplayAddress] = useState<string>("");
  const [isNetworkConnected, setIsNetworkConnected] = useState(true);
  const [isSessionSigsModalOpen, setIsSessionSigsModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isArrowUp, setIsArrowUp] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"buy" | "send" | "swap">(
    "buy"
  );

  // --- EOA Signer integration for Lit Protocol ---
  const {
    signer: eoaSigner,
    address: eoaAddress,
    error: eoaError,
    initializeSigner: initializeEoaSigner,
  } = useEoaSigner();

  // Ensure EOA signer is initialized on mount or when user logs in
  useEffect(() => {
    if (!eoaSigner || !eoaAddress) initializeEoaSigner();
  }, [eoaSigner, eoaAddress, initializeEoaSigner]);

  const isEoaReady = !!eoaSigner && !!eoaAddress && !eoaError;

  // --- Unified session signer integration ---
  const pkpPublicKey = "";
  const {
    signer: sessionSigner,
    isAuthenticated: isSessionAuthenticated,
    error: sessionSignerError,
    sessionSigs,
    initializeSigner: initializeSessionSigner,
    authenticate: authenticateSessionSigner,
  } = useUnifiedSessionSigner({ pkpPublicKey: "", chain: baseSepolia });

  // Local state to store the latest session sigs after authentication
  const [latestSessionSigs, setLatestSessionSigs] = useState<
    SessionSigs | undefined
  >(undefined);

  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(
      `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
    ),
  });

  useEffect(() => {
    async function updateDisplayAddress() {
      if (user?.address) {
        const ensName = await publicClient.getEnsName({
          address: user.address as `0x${string}`,
          universalResolverAddress:
            "0x74E20Bd2A1fE0cdbe45b9A1d89cb7e0a45b36376",
        });
        setDisplayAddress(
          ensName || `${user.address.slice(0, 6)}...${user.address.slice(-4)}`
        );
      }
    }
    updateDisplayAddress();
  }, [user?.address, publicClient]);

  useEffect(() => {
    const checkNetworkStatus = async () => {
      try {
        if (user?.type === "eoa") {
          setIsNetworkConnected(true);
          return;
        }
        await smartAccountClient?.transport.request({
          method: "eth_blockNumber",
        });
        setIsNetworkConnected(true);
      } catch {
        setIsNetworkConnected(false);
      }
    };
    const interval = setInterval(checkNetworkStatus, 10000);
    checkNetworkStatus();
    return () => clearInterval(interval);
  }, [smartAccountClient, user?.type]);

  const copyToClipboard = async () => {
    if (user?.address) {
      try {
        const ensName = await publicClient.getEnsName({
          address: user.address as `0x${string}`,
          universalResolverAddress:
            "0x74E20Bd2A1fE0cdbe45b9A1d89cb7e0a45b36376",
        });
        const textToCopy = ensName || user.address;
        await navigator.clipboard.writeText(textToCopy);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch {}
    }
  };

  const handleActionClick = (action: "buy" | "send" | "swap") => {
    setDialogAction(action);
    setIsDialogOpen(true);
  };

  const handleChainSwitch = async (newChain: any, chainName: string) => {
    if (isSettingChain) return;
    if (currentChain.id === newChain.id) return;
    await setChain({ chain: newChain });
  };

  const getDialogContent = () => {
    switch (dialogAction) {
      case "buy":
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">Buy Crypto</h2>
            <p className="mb-4">Purchase crypto directly to your wallet.</p>
            {/* WertButton logic here if needed */}
            <div className="flex justify-end">
              <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
            </div>
          </div>
        );
      case "send":
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">Send Crypto</h2>
            <p className="mb-4">Send crypto to another address.</p>
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
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button>Send</Button>
              </div>
            </div>
          </div>
        );
      case "swap":
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">Swap Crypto</h2>
            <p className="mb-4">Swap between different cryptocurrencies.</p>
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
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button>Swap</Button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Utility: Map Lit SessionSigs object to SessionSig[] for UI
  function mapLitSessionSigsToArray(
    sessionSigs: SessionSigs | undefined
  ): SessionSig[] {
    if (!sessionSigs) return [];
    const expiration =
      typeof sessionSigs.expiration === "string" ? sessionSigs.expiration : "";
    return Object.entries(sessionSigs)
      .filter(([key]) => key !== "expiration" && key !== "pkpPublicKey")
      .map(([id, sigObj]: [string, any]) => ({
        id,
        timestamp: sigObj?.createdAt || new Date().toISOString(),
        expiresAt: expiration,
        signature: sigObj?.sig || "",
      }));
  }

  // Provide a function to get session signatures (async for UI button)
  async function getSessionSigs(): Promise<SessionSig[]> {
    if (!isEoaReady)
      throw new Error("EOA signer not ready. Cannot get session signatures.");
    await authenticateSessionSigner();
    const sigs = sessionSigs || latestSessionSigs;
    if (sessionSigs) setLatestSessionSigs(sessionSigs);
    return mapLitSessionSigsToArray(sigs);
  }

  if (!user)
    return (
      <Button
        className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 
        hover:to-purple-700 text-white transition-all duration-300 hover:shadow-lg`}
        onClick={openAuthModal}
      >
        Login
      </Button>
    );

  // Show error if EOA signer is not ready
  if (eoaError) {
    return (
      <div className="text-red-500 p-4">
        EOA signer error: {eoaError.message || "Unknown error"}.<br />
        Please check your environment variables and reload the page.
      </div>
    );
  }

  // Optionally, show a loading state if EOA is not ready
  if (!isEoaReady) {
    return (
      <div className="p-4 text-gray-500">
        Initializing EOA signer for Lit Protocol...
      </div>
    );
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
                      src={getChainIcon(currentChain)}
                      alt={currentChain.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div className="absolute -bottom-1 -right-1">
                      <NetworkStatus isConnected={isNetworkConnected} />
                    </div>
                  </div>
                  <span>{currentChain.name}</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <pre className="text-xs">{currentChain.name}</pre>
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
            {[base, optimism, baseSepolia, polygon].map((chain) => (
              <Tooltip key={chain.id}>
                <TooltipTrigger asChild>
                  <DropdownMenuItem
                    onClick={() => handleChainSwitch(chain, chain.name)}
                    disabled={isSettingChain || currentChain.id === chain.id}
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
          <DropdownMenuLabel
            className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1 transition-colors"
            onClick={copyToClipboard}
          >
            <span className="flex-1 font-mono text-sm">{displayAddress}</span>
            {copySuccess ? (
              <CheckIcon className="ml-2 h-4 w-4 text-green-500" />
            ) : (
              <Copy className="ml-2 h-4 w-4" />
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <TokenBalance />
          <DropdownMenuSeparator />
          <LitSmartAccount />
          <DropdownMenuSeparator />
          <div className="px-2 py-1 text-xs text-muted-foreground font-semibold uppercase tracking-wide">
            Advanced
          </div>
          <DropdownMenuItem
            onClick={() => setIsSessionSigsModalOpen(true)}
            className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Key className="mr-2 h-4 w-4 text-orange-500" />
            Session Signatures
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
      {isSessionSigsModalOpen && (
        <Dialog
          open={isSessionSigsModalOpen}
          onOpenChange={setIsSessionSigsModalOpen}
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="relative w-full max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  Active Session Signatures
                </h2>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" aria-label="Close">
                    ×
                  </Button>
                </DialogClose>
              </div>
              <SessionSigManager
                sessionSigs={mapLitSessionSigsToArray(
                  sessionSigs || latestSessionSigs
                )}
                onGetSessionSigs={getSessionSigs}
                isAuthenticated={isSessionAuthenticated}
                error={sessionSignerError}
              />
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
