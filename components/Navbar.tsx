// components/Navbar.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  SITE_LOGO,
  SITE_NAME,
  SITE_ORG,
  SITE_PRODUCT,
} from "@/context/context"; // Correct import path
import { Button } from "@/components/ui/button"; // Corrected import
import {
  Dialog,
  useAuthModal,
  useLogout,
  useUser,
  useChain,
  useSmartAccountClient,
} from "@account-kit/react";
import ThemeToggleComponent from "./ThemeToggle/toggleComponent";
import { toast } from "sonner";
import { CheckIcon } from "@radix-ui/react-icons";
import {
  Copy,
  User,
  Plus,
  ArrowUpRight,
  ArrowUpDown,
  LogOut,
  Wifi,
  WifiOff,
  Key,
  CloudUpload,
  RadioTower,
  Bot,
  ShieldUser,
} from "lucide-react";
import type { User as AccountUser } from "@account-kit/signer";
import useModularAccount from "@/lib/hooks/accountkit/useModularAccount";
import { createPublicClient, http } from "viem";
import { alchemy, mainnet, base, optimism } from "@account-kit/infra";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import CdpFundButton from "./wallet/buy/cdp-fund-button";
import { TokenBalance } from "./wallet/balance/TokenBalance";
import type { Chain as ViemChain } from "viem/chains";
import { AccountDropdown } from "@/components/account-dropdown/AccountDropdown";
import { useMembershipVerification } from "@/lib/hooks/unlock/useMembershipVerification";
import { MembershipSection } from "./account-dropdown/MembershipSection";
import { ChainSelect } from "@/components/ui/select";

type UseUserResult = (AccountUser & { type: "eoa" | "sca" }) | null;

// Define reusable className for nav links
const navLinkClass = `
  group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 
  text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 
  focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none 
  disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 
  dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 
  dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50
`
  .replace(/\s+/g, " ")
  .trim();

// Define reusable className for member-only nav links
const memberNavLinkClass = `
  group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 
  text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 
  focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none 
  disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 
  dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 
  dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50
  text-[#EC407A]
`
  .replace(/\s+/g, " ")
  .trim();

// Define reusable className for mobile menu links
const mobileNavLinkClass = `
  flex w-full items-center rounded-md p-2 text-sm font-medium
  hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
`;

// Define reusable className for mobile menu member-only links
const mobileMemberNavLinkClass = `
  flex w-full items-center rounded-md p-2 text-sm font-medium
  hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
  text-[#EC406A]
`;

// Update the truncateAddress helper function
const truncateAddress = async (address: string, publicClient: any) => {
  if (!address) return "";
  try {
    // Try to get ENS name first
    const ensName = await publicClient.getEnsName({
      address: address as `0x${string}`,
      universalResolverAddress: "0x74E20Bd2A1fE0cdbe45b9A1d89cb7e0a45b36376",
    });
    if (ensName) return ensName;
    // If no ENS name, truncate the address
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  } catch (error) {
    console.error("Error resolving ENS name:", error);
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
};

// Add this near the top with other utility functions
const getChainGradient = (chain: ViemChain) => {
  switch (chain.id) {
    case base.id:
      return "from-[#0052FF] to-[#0052FF]";
    case optimism.id:
      return "from-[#FF0420] to-[#FF0420]";
    default:
      return "from-gray-400 to-gray-600";
  }
};

const getChainName = (chain: ViemChain) => {
  switch (chain.id) {
    case base.id:
      return "Base";
    case optimism.id:
      return "Optimism";
    default:
      return chain.name;
  }
};

// Add this near the top with other utility functions
const getChainLogo = (chain: ViemChain) => {
  switch (chain.id) {
    case base.id:
      return "/images/chains/base.svg";
    case optimism.id:
      return "/images/chains/optimism.svg";
    default:
      return "/images/chains/default-chain.svg";
  }
};

const getChainTooltip = (chain: ViemChain) => {
  return `Network: ${chain.name}
Chain ID: ${chain.id}
Native Currency: ${chain.nativeCurrency?.symbol || "ETH"}`;
};

// Add this component for the network status indicator
function NetworkStatus({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="flex items-center">
      {isConnected ? (
        <Wifi className="h-3 w-3 text-green-500" />
      ) : (
        <WifiOff className="h-3 w-3 text-red-500" />
      )}
    </div>
  );
}

export default function Navbar() {
  const { openAuthModal } = useAuthModal();
  const user = useUser();
  const { logout } = useLogout();
  const { chain: currentChain, setChain, isSettingChain } = useChain();
  const { account: modularAccount } = useModularAccount();
  const [displayAddress, setDisplayAddress] = useState<string>("");
  const [isArrowUp, setIsArrowUp] = useState(true);
  const { client: smartAccountClient } = useSmartAccountClient({});
  const [isNetworkConnected, setIsNetworkConnected] = useState(true);
  const [isSessionSigsModalOpen, setIsSessionSigsModalOpen] = useState(false);
  const { isVerified, hasMembership } = useMembershipVerification();

  // Initialize Viem public client for ENS resolution
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: alchemy({
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY as string,
    }),
  });

  // Update display address when user changes
  useEffect(() => {
    async function updateDisplayAddress() {
      if (user?.address) {
        const resolved = await truncateAddress(user.address, publicClient);
        setDisplayAddress(resolved);
      }
    }
    updateDisplayAddress();
  }, [user?.address, publicClient]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"buy" | "send" | "swap">(
    "buy"
  );
  const addressRef = useRef<HTMLDivElement | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentChainName, setCurrentChainName] = useState(currentChain.name);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    console.log("Current Chain:", currentChain);
    console.log("Current Chain Name:", currentChain.name);
    console.log("Current Chain ID:", currentChain.id);
    setCurrentChainName(currentChain?.name || "Unknown Chain");
  }, [currentChain]);

  // Add scroll effect for sticky navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Add network status check
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
      } catch (error) {
        setIsNetworkConnected(false);
      }
    };

    const interval = setInterval(checkNetworkStatus, 10000);
    checkNetworkStatus();

    return () => clearInterval(interval);
  }, [smartAccountClient, user?.type]);

  useEffect(() => {
    setCurrentChainName(getChainName(currentChain) || "Unknown Chain");
  }, [currentChain]);

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  const handleActionClick = (action: "buy" | "send" | "swap") => {
    setDialogAction(action);
    setIsDialogOpen(true);
  };

  const copyToClipboard = async () => {
    if (user?.address) {
      try {
        // Try to get ENS name first
        const ensName = await publicClient.getEnsName({
          address: user.address as `0x${string}`,
          universalResolverAddress:
            "0x74E20Bd2A1fE0cdbe45b9A1d89cb7e0a45b36376",
        });

        // Copy ENS name if available, otherwise copy address
        const textToCopy = ensName || user.address;
        await navigator.clipboard.writeText(textToCopy);

        setCopySuccess(true);
        toast.success("Address copied to clipboard!");
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error("Failed to copy address: ", err);
        toast.error("Failed to copy address");
      }
    }
  };

  // Chain information
  const chainNames: Record<number, string> = {
    8453: "Base",
    10: "Optimism",
    84532: "Base Sepolia",
  };

  // Chain icons mapping
  const chainIcons: Record<number, string> = {
    8453: "/images/base.svg", // Replace with actual path to Base icon
    10: "/images/optimism.svg", // Replace with actual path to Optimism icon
    84532: "/images/base-sepolia.svg", // Replace with actual path to Base Sepolia icon
  };

  // Create header className to avoid line length issues
  const headerClassName = `sticky top-0 z-50 w-full transition-all duration-300 ${
    isScrolled
      ? "shadow-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm"
      : "bg-white dark:bg-gray-900"
  }`;

  // Dialog content based on the selected action
  const getDialogContent = () => {
    switch (dialogAction) {
      case "buy":
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">Buy Crypto</h2>
            <p className="mb-4">Purchase crypto directly to your wallet.</p>
            <CdpFundButton />
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

  return (
    <header className={headerClassName}>
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-2 transition-transform duration-200 hover:scale-105"
            >
              <Image
                src={SITE_LOGO}
                alt={SITE_NAME}
                width={30}
                height={30}
                priority
                style={{ width: "30px", height: "30px" }}
                className="rounded-md"
              />
              <span className="mx-auto my-auto">
                <h1
                  className="text-lg"
                  style={{ fontFamily: "ConthraxSb-Regular , sans-serif" }}
                >
                  {SITE_ORG}
                  <span
                    className="ml-1 text-xl font-bold text-red-500"
                    style={{ fontFamily: "sans-serif" }}
                  >
                    {SITE_PRODUCT}
                  </span>
                </h1>
              </span>
            </Link>

            <nav className="hidden md:flex items-center ml-8 space-x-1">
              <Link href="/discover" className={navLinkClass}>
                Discover
              </Link>
              <Link href="/leaderboard" className={navLinkClass}>
                Leaderboard
              </Link>
              <Link href="/vote" prefetch={false} className={navLinkClass}>
                Vote
              </Link>
            </nav>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <ThemeToggleComponent />
            <button
              className={
                "ml-2 inline-flex items-center justify-center rounded-md p-2 " +
                "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 " +
                "dark:hover:bg-gray-800 dark:hover:text-gray-50 transition-colors"
              }
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              <MenuIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Desktop wallet display */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center">
              <ThemeToggleComponent />
            </div>
            <div>
              <AccountDropdown />
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div
              className={
                "fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row " +
                "auto-rows-max overflow-auto p-4 pb-32 shadow-md animate-in " +
                "slide-in-from-top-5 md:hidden bg-white dark:bg-gray-900"
              }
            >
              <div
                className={
                  "relative z-20 grid gap-4 rounded-md " +
                  "text-popover-foreground"
                }
              >
                {/* User Account Section for Mobile */}
                {user ? (
                  <div className="space-y-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`
                            h-8 w-8 rounded-full flex items-center justify-center text-white
                            bg-gradient-to-r from-blue-500 to-purple-500
                          `}
                        >
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {displayAddress}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {getChainName(currentChain)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyToClipboard}
                        className="h-8 w-8 p-0"
                      >
                        {copySuccess ? (
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Add TokenBalance here */}
                    <div className="mt-4">
                      <TokenBalance />
                    </div>

                    {/* Add Membership Section here */}
                    <div className="mt-4">
                      <MembershipSection />
                    </div>

                    {/* Add Chain Selector here */}
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Network</p>
                      <ChainSelect className="w-full" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleActionClick("buy");
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center justify-center"
                      >
                        <Plus className="mr-2 h-4 w-4 text-green-500" />
                        Buy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleActionClick("send");
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center justify-center"
                      >
                        <ArrowUpRight className="mr-2 h-4 w-4 text-blue-500" />
                        Send
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleActionClick("swap");
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center justify-center"
                      >
                        <ArrowUpDown className="mr-2 h-4 w-4 text-purple-500" />
                        Swap
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          logout();
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center justify-center text-red-500"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 
                      hover:from-blue-700 hover:to-purple-700 text-white 
                      transition-all duration-300 hover:shadow-lg"
                    onClick={() => {
                      openAuthModal();
                      setIsMenuOpen(false);
                    }}
                  >
                    Login
                  </Button>
                )}

                {/* Navigation Links */}
                <nav className="grid grid-flow-row gap-2 auto-rows-max text-sm">
                  <Link
                    href="/discover"
                    className={mobileNavLinkClass}
                    onClick={handleLinkClick}
                  >
                    Discover
                  </Link>
                  <Link
                    href="/leaderboard"
                    className={mobileNavLinkClass}
                    onClick={handleLinkClick}
                  >
                    Leaderboard
                  </Link>
                  <Link
                    href="/vote"
                    className={mobileNavLinkClass}
                    onClick={handleLinkClick}
                  >
                    Vote
                  </Link>
                  {/* Member Access Links (mobile) */}
                  {isVerified && hasMembership && (
                    <>
                      <div className="mt-4 mb-1 text-xs text-muted-foreground font-semibold">
                        Member Access
                      </div>
                      <Link
                        href="/upload"
                        className={mobileMemberNavLinkClass}
                        onClick={handleLinkClick}
                      >
                        <CloudUpload className="mr-2 h-4 w-4" /> Upload
                      </Link>
                      <Link
                        href="/live"
                        className={mobileMemberNavLinkClass}
                        onClick={handleLinkClick}
                      >
                        <RadioTower className="mr-2 h-4 w-4" /> Live
                      </Link>
                      <Link
                        href="/clips"
                        className={mobileMemberNavLinkClass}
                        onClick={handleLinkClick}
                      >
                        <Bot className="mr-2 h-4 w-4" /> Daydream
                        <span className="ml-2 px-2 py-0.5 rounded bg-muted-foreground/10 text-xs text-muted-foreground">
                          Beta
                        </span>
                      </Link>
                      <Link
                        href="/profile"
                        className={mobileMemberNavLinkClass}
                        onClick={handleLinkClick}
                      >
                        <ShieldUser className="mr-2 h-4 w-4" /> Profile
                      </Link>
                      <Link
                        href="/vote/create"
                        className={
                          mobileMemberNavLinkClass +
                          " text-green-600 font-semibold border-t border-gray-200 dark:border-gray-700 mt-2"
                        }
                        onClick={handleLinkClick}
                      >
                        <Plus className="mr-2 h-4 w-4 text-green-500" /> Create
                        Proposal
                      </Link>
                    </>
                  )}
                </nav>
              </div>
            </div>
          )}

          {/* Account Kit Dialog for actions */}
          <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
            <div className="max-w-md mx-auto">{getDialogContent()}</div>
          </Dialog>
        </div>
      </div>
    </header>
  );
}

function MenuIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      {...props}
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}
