"use client";

import { useState, useEffect } from "react";
import {
  useAuthModal,
  useUser,
  useSmartAccountClient,
} from "@account-kit/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface LoginButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function LoginButton({
  className,
  variant = "default",
  size = "default",
}: LoginButtonProps) {
  const { openAuthModal } = useAuthModal();
  const user = useUser();
  const { client: smartAccountClient } = useSmartAccountClient({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  // Check if the smart account needs deployment
  useEffect(() => {
    async function checkDeployment() {
      if (!smartAccountClient?.account) return;
      try {
        const code = await smartAccountClient.transport.request({
          method: "eth_getCode",
          params: [smartAccountClient.account.address],
        });
        setIsDeploying(code === "0x");
      } catch (error) {
        console.error("Error checking deployment:", error);
      }
    }
    checkDeployment();
  }, [smartAccountClient]);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      openAuthModal();
    } catch (error) {
      toast.error(
        `Authentication failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || isDeploying) {
    return (
      <Button className={className} variant={variant} size={size} disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {isDeploying ? "Deploying Account..." : "Connecting..."}
      </Button>
    );
  }

  if (user) {
    return (
      <Button className={className} variant={variant} size={size} disabled>
        Connected
      </Button>
    );
  }

  return (
    <Button
      onClick={handleLogin}
      className={`bg-gradient-to-r from-blue-600 to-purple-600 
        hover:from-blue-700 hover:to-purple-700 text-white 
        transition-all duration-300 hover:shadow-lg ${className}`}
      variant={variant}
      size={size}
    >
      Get Started
    </Button>
  );
}
