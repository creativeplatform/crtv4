// components/Navbar.tsx
"use client";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"; // Corrected import: relative to current file
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  SITE_LOGO,
  SITE_NAME,
  SITE_ORG,
  SITE_PRODUCT,
} from "@/lib/utils/context"; // Correct import path
import { Button } from "@/components/ui/button"; // Corrected import
import {
  Dialog,
  useAuthModal,
  useLogout,
  useUser,
  useChain,
} from "@account-kit/react";
import { base, baseSepolia, optimism, polygon } from "viem/chains";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import ThemeToggleComponent from "./ThemeToggle/toggleComponent";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { CheckIcon } from "@radix-ui/react-icons";
import { CopyIcon } from "lucide-react";
import type { User } from "@account-kit/signer";
import useModularAccount from "@/lib/hooks/useModularAccount";
type UseUserResult = (User & { type: "eoa" | "sca" }) | null;

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

// Define reusable className for mobile menu links
const mobileNavLinkClass = `
  flex w-full items-center rounded-md p-2 text-sm font-medium
  hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
`;

// Helper function to truncate Ethereum addresses
const truncateAddress = (address: string) => {
  if (!address) return "";
  if (address.endsWith(".eth")) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default function Navbar() {
  const { openAuthModal } = useAuthModal();
  const user = useUser();
  const { logout } = useLogout();
  const { chain: currentChain, setChain, isSettingChain } = useChain();
  const { account: modularAccount } = useModularAccount();

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

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  // Get the user's address from user object
  const userAddress = user?.address || "thecreative.eth";
  const displayAddress = userAddress.endsWith(".eth")
    ? userAddress
    : truncateAddress(userAddress);

  const handleActionClick = (action: "buy" | "send" | "swap") => {
    setDialogAction(action);
    setIsDialogOpen(true);
  };

  const copyToClipboard = async () => {
    if (userAddress) {
      try {
        await navigator.clipboard.writeText(userAddress);
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
    137: "Polygon",
    84532: "Base Sepolia",
  };

  // Chain icons mapping
  const chainIcons: Record<number, string> = {
    8453: "/images/base.svg", // Replace with actual path to Base icon
    10: "/images/optimism.svg", // Replace with actual path to Optimism icon
    137: "/images/polygon.svg", // Replace with actual path to Polygon icon
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
                >
                  <path d="M7 10v12" />
                  <path d="M15 10v12" />
                  <path d="M11 14v8" />
                  <path d="M11 2v8" />
                  <path d="m3 6 4-4 4 4" />
                  <path d="m17 6 4-4 4 4" />
                </svg>
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
              <Link href="/" className={navLinkClass}>
                Home
              </Link>
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
          <button
            className={
              "md:hidden inline-flex items-center justify-center rounded-md p-2 " +
              "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 " +
              "dark:hover:bg-gray-800 dark:hover:text-gray-50 transition-colors"
            }
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
            }}
            aria-expanded={isMenuOpen}
          >
            <span className="sr-only">Open main menu</span>
            <MenuIcon className="h-6 w-6" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <ThemeToggleComponent />
            </div>
            <div>
              {user ? (
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex gap-2 items-center transition-all hover:bg-gray-100 
                          dark:hover:bg-gray-800 hover:border-blue-500"
                      >
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                        <span>
                          {chainNames[currentChain.id] || currentChain.name}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="animate-in fade-in-80 slide-in-from-top-5"
                    >
                      <DropdownMenuLabel className="font-semibold text-sm text-gray-500 dark:text-gray-400">
                        Switch Network
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setChain({ chain: base })}
                        disabled={isSettingChain}
                        className="flex items-center cursor-pointer hover:bg-gray-100 
                          dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="w-4 h-4 mr-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
                        Base
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setChain({ chain: optimism })}
                        disabled={isSettingChain}
                        className="flex items-center cursor-pointer hover:bg-gray-100 
                          dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="w-4 h-4 mr-2 rounded-full bg-gradient-to-r from-red-400 to-red-600"></div>
                        Optimism
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setChain({ chain: baseSepolia })}
                        disabled={isSettingChain}
                        className="flex items-center cursor-pointer hover:bg-gray-100 
                          dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="w-4 h-4 mr-2 rounded-full bg-gradient-to-r from-blue-300 to-purple-400"></div>
                        Base Sepolia
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center transition-all hover:bg-gray-100 
                          dark:hover:bg-gray-800 hover:border-blue-500"
                      >
                        <div
                          className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 
                          mr-2 flex items-center justify-center text-white"
                        >
                          <UserIcon className="h-4 w-4" />
                        </div>
                        <span className="max-w-[100px] truncate">
                          {displayAddress}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 animate-in fade-in-80 slide-in-from-top-5"
                    >
                      <DropdownMenuLabel
                        className="flex items-center cursor-pointer hover:bg-gray-100 
                          dark:hover:bg-gray-800 rounded px-2 py-1 transition-colors"
                        onClick={copyToClipboard}
                      >
                        <span className="flex-1 font-mono text-sm">
                          {displayAddress}
                        </span>
                        {copySuccess ? (
                          <CheckIcon className="ml-2 h-4 w-4 text-green-500" />
                        ) : (
                          <CopyIcon className="ml-2 h-4 w-4" />
                        )}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleActionClick("buy")}
                        className="flex items-center cursor-pointer hover:bg-gray-100 
                          dark:hover:bg-gray-800 transition-colors"
                      >
                        <PlusIcon className="mr-2 h-4 w-4 text-green-500" /> Buy
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleActionClick("send")}
                        className="flex items-center cursor-pointer hover:bg-gray-100 
                          dark:hover:bg-gray-800 transition-colors"
                      >
                        <ArrowUpRightIcon className="mr-2 h-4 w-4 text-blue-500" />{" "}
                        Send
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleActionClick("swap")}
                        className="flex items-center cursor-pointer hover:bg-gray-100 
                          dark:hover:bg-gray-800 transition-colors"
                      >
                        <ArrowsUpDownIcon className="mr-2 h-4 w-4 text-purple-500" />{" "}
                        Swap
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => logout()}
                        className="flex items-center cursor-pointer hover:bg-gray-100 
                          dark:hover:bg-gray-800 transition-colors"
                      >
                        <LogOutIcon className="mr-2 h-4 w-4 text-red-500" />{" "}
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 
                    hover:from-blue-700 hover:to-purple-700 text-white 
                    transition-all duration-300 hover:shadow-lg"
                  onClick={() => openAuthModal()}
                >
                  Login
                </Button>
              )}
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div
              className={
                "fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row " +
                "auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in " +
                "slide-in-from-top-5 md:hidden"
              }
            >
              <div
                className={
                  "relative z-20 grid gap-6 rounded-md bg-white dark:bg-gray-900 " +
                  "p-4 text-popover-foreground shadow-md border border-gray-200 " +
                  "dark:border-gray-800"
                }
              >
                <Link
                  href="/"
                  className="flex items-center space-x-2 transition-transform duration-200 hover:scale-105"
                  onClick={handleLinkClick}
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
                  <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {chainNames[currentChain.id] || currentChain.name}
                  </span>
                </Link>
                <nav className="grid grid-flow-row gap-2 auto-rows-max text-sm">
                  <Link
                    href="/"
                    className={mobileNavLinkClass}
                    onClick={handleLinkClick}
                  >
                    Home
                  </Link>
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
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}

function UserIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  );
}

function PlusIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function ArrowUpRightIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17V7h10" />
      <path d="M7 7l10 10" />
    </svg>
  );
}

function ArrowsUpDownIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21 16-4 4-4-4" />
      <path d="M17 20V4" />
      <path d="m3 8 4-4 4 4" />
      <path d="M7 4v16" />
    </svg>
  );
}

function LogOutIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
