"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle,
  AlertCircle,
  Key,
  RefreshCw,
  Copy,
  Shield,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils/utils";

// Types
export interface SessionSig {
  id: string;
  timestamp: string;
  expiresAt: string;
  signature: string;
}

export interface SessionSigManagerProps {
  className?: string;
  sessionSigs?: SessionSig[];
  onGetSessionSigs?: () => Promise<SessionSig[] | undefined>;
  isAuthenticated?: boolean;
  error?: Error | null;
}

// Component for the spinner
interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        "relative inline-block",
        size === "sm" && "h-3 w-3",
        size === "md" && "h-4 w-4",
        size === "lg" && "h-6 w-6",
        className
      )}
      {...props}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="spinner-blade" />
      ))}
    </div>
  );
}

// Button to get session signatures
interface GetSessionSigsButtonProps {
  onGetSessionSigs: () => Promise<SessionSig[] | undefined>;
  onSuccess: (sigs: SessionSig[]) => void;
  onError: (error: string) => void;
}

function GetSessionSigsButton({
  onGetSessionSigs,
  onSuccess,
  onError,
}: GetSessionSigsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGetSessionSigs = async () => {
    setIsLoading(true);
    try {
      const sigs = await onGetSessionSigs();
      if (sigs && sigs.length > 0) onSuccess(sigs);
      else onError("No session signatures found.");
    } catch (error) {
      onError("Failed to get session signatures. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGetSessionSigs}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Getting Signatures...</span>
        </>
      ) : (
        <>
          <Key className="h-4 w-4" />
          <span>Get Session Signatures</span>
        </>
      )}
    </Button>
  );
}

// Session signature item component
interface SessionSigItemProps {
  sig: SessionSig;
  onCopy: (signature: string) => void;
}

function SessionSigItem({ sig, onCopy }: SessionSigItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateSignature = (signature: string) => {
    return `${signature.substring(0, 10)}...${signature.substring(
      signature.length - 8
    )}`;
  };

  return (
    <div className="flex flex-col space-y-2 rounded-md border border-border p-4 bg-background/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Session Signature</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onCopy(sig.signature)}
        >
          <Copy className="h-4 w-4" />
          <span className="sr-only">Copy signature</span>
        </Button>
      </div>
      <div className="grid gap-1">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">ID:</span> {sig.id}
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Created:</span>{" "}
          {formatDate(sig.timestamp)}
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Expires:</span>{" "}
          {formatDate(sig.expiresAt)}
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Signature:</span>{" "}
          {truncateSignature(sig.signature)}
        </div>
      </div>
    </div>
  );
}

// Main component
function SessionSigManager({
  className,
  sessionSigs,
  onGetSessionSigs,
  isAuthenticated,
  error,
}: SessionSigManagerProps) {
  const [localSessionSigs, setLocalSessionSigs] = useState<SessionSig[]>([]);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  // Use controlled sessionSigs if provided, else local state
  const sigs = sessionSigs ?? localSessionSigs;

  const handleSuccess = (sigs: SessionSig[]) => {
    setLocalSessionSigs(sigs);
    setStatus("success");
    setTimeout(() => {
      setStatus("idle");
    }, 3000);
  };

  const handleError = (error: string) => {
    setErrorMessage(error);
    setStatus("error");
    setTimeout(() => {
      setStatus("idle");
    }, 3000);
  };

  const handleCopy = (signature: string) => {
    navigator.clipboard.writeText(signature);
    setShowCopyAlert(true);
    setTimeout(() => {
      setShowCopyAlert(false);
    }, 2000);
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          PKP Session Signatures
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manage">
          <TabsList className="mb-4">
            <TabsTrigger value="manage">Manage</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="manage">
            <div className="grid gap-4">
              <div>
                <h3 className="font-medium">Session Signature Management</h3>
                <p className="text-muted-foreground text-sm">
                  Generate and manage your PKP session signatures for secure
                  authentication.
                </p>
              </div>

              {/* Status alerts */}
              {status === "success" && (
                <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <AlertTitle className="text-emerald-600 dark:text-emerald-400">
                    Success
                  </AlertTitle>
                  <AlertDescription className="text-emerald-600/90 dark:text-emerald-400/90">
                    Session signatures retrieved successfully.
                  </AlertDescription>
                </Alert>
              )}

              {status === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              {showCopyAlert && (
                <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertTitle className="text-blue-600 dark:text-blue-400">
                    Copied
                  </AlertTitle>
                  <AlertDescription className="text-blue-600/90 dark:text-blue-400/90">
                    Signature copied to clipboard.
                  </AlertDescription>
                </Alert>
              )}

              {/* Get signatures button */}
              <div className="flex justify-start">
                {onGetSessionSigs && (
                  <GetSessionSigsButton
                    onGetSessionSigs={onGetSessionSigs}
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                )}
              </div>

              {/* Session signatures list */}
              {sigs.length > 0 && (
                <div className="mt-4 space-y-4">
                  <h4 className="text-sm font-medium">
                    Active Session Signatures
                  </h4>
                  <div className="grid gap-3">
                    {sigs.map((sig) => (
                      <SessionSigItem
                        key={sig.id}
                        sig={sig}
                        onCopy={handleCopy}
                      />
                    ))}
                  </div>
                </div>
              )}

              {sigs.length === 0 && (
                <div className="rounded-md border border-border p-4 bg-muted/30 text-center">
                  <p className="text-sm text-muted-foreground">
                    No session signatures found. Generate a new signature to get
                    started.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="about">
            <div className="grid gap-4">
              <div>
                <h3 className="font-medium">About Session Signatures</h3>
                <p className="text-muted-foreground text-sm">
                  Session signatures allow secure authentication without
                  requiring repeated wallet connections.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">How it works</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Generate a session signature using your PKP</li>
                  <li>Use the signature to authenticate API requests</li>
                  <li>Signatures expire after a set period for security</li>
                  <li>Manage multiple sessions across different devices</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Security</h4>
                <p className="text-sm text-muted-foreground">
                  Session signatures are cryptographically secure and can be
                  revoked at any time. For maximum security, use short-lived
                  sessions and refresh them as needed.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default SessionSigManager;
