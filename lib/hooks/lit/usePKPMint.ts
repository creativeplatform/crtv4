/**
 * @file usePKPMint.ts
 * @description React hook for minting PKPs (Programmable Key Pairs) using Lit Protocol.
 *
 * This hook enables users to:
 * - Mint new Lit Protocol Programmable Key Pairs (PKPs)
 * - Associate authentication methods with the newly minted PKP
 * - Set permission scopes for the authentication methods
 * - Store PKP information in the application context
 *
 * The PKP minting process:
 * 1. Verifies the Smart Account client is initialized
 * 2. Validates the user has a Smart Contract Account (SCA)
 * 3. Obtains an EOA signature for Lit Protocol authentication
 * 4. Gets session signatures to authenticate with Lit Network
 * 5. Creates an EthWallet auth method with the session signatures
 * 6. Defines auth method scopes (sign anything, personal sign)
 * 7. Initializes the Lit Protocol contract client
 * 8. Calls mintWithAuth on the contract client
 * 9. Stores the minted PKP information in the application context
 *
 * @requires useModularAccount for accessing the Smart Account client
 * @requires getContractClient from lit-contracts for Lit Protocol contract interaction
 * @requires useUser from @account-kit/react for account type validation
 * @requires useLitContext for storing PKP information
 * @requires AUTH_METHOD_SCOPE and AUTH_METHOD_TYPE from @lit-protocol/constants
 * @requires useSessionSigs for obtaining Lit Protocol session signatures
 * @requires useEoaSigner for EOA signature generation
 *
 * @returns {Object} An object containing:
 *   - pkp: Current PKP information from context (if any)
 *   - mintPKP: Function to mint a new PKP
 *   - isReady: Boolean indicating if the hook is ready to mint PKPs
 *
 * @example
 * const { mintPKP, pkp, isReady } = usePKPMint();
 *
 * // Mint a new PKP
 * const handleMint = async () => {
 *   if (isReady) {
 *     const result = await mintPKP();
 *     if (result.success) {
 *       console.log("PKP minted successfully:", result.pkp);
 *     } else {
 *       console.error("Failed to mint PKP:", result.error);
 *     }
 *   }
 * };
 *
 * @dev Notes:
 * - Uses Lit Protocol's mintWithAuth to associate auth methods during minting
 * - Requires a Smart Contract Account (SCA) user type
 * - Requires an EOA signer for authentication
 * - PKP minting is a contract transaction on the Lit Protocol network
 * - Default scopes are SignAnything and PersonalSign
 * - Stores the PKP in LitContext for app-wide access after minting
 * - The minting process creates a 2048-bit RSA key pair on the Lit Network
 */

import { useCallback, useState } from "react";
import useModularAccount from "@/lib/hooks/accountkit/useModularAccount";
import { getContractClient } from "../../sdk/lit/lit-contracts";
import { useUser } from "@account-kit/react";
import { useLitContext } from "../../../context/LitContext";
import { AUTH_METHOD_SCOPE, AUTH_METHOD_TYPE } from "@lit-protocol/constants";
import { useSessionSigs } from "../../sdk/lit/sessionSigs";
import { useEoaSigner } from "./useEoaSigner";
import { SessionSigs } from "../../sdk/lit/types/auth";
import { SignerLike } from "@lit-protocol/types";
import { generateAuthSig } from "@lit-protocol/auth-helpers";

export interface PKPMintInfo {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
}

interface PKPMintResult {
  success: boolean;
  pkp: PKPMintInfo | null;
  error?: string;
}

export function usePKPMint() {
  const { smartAccountClient: client } = useModularAccount();
  const { pkp, setPKP } = useLitContext();
  const user = useUser();
  const { signer: eoaSigner, address: eoaAddress } = useEoaSigner();
  const { getSessionSigs, initLitClient, isConnected } = useSessionSigs();
  const [mintStatus, setMintStatus] = useState<{
    isProcessing: boolean;
    diagnosticInfo?: Record<string, any>;
  }>({
    isProcessing: false,
  });

  const mintPKP = useCallback(async (): Promise<PKPMintResult> => {
    // Set processing state
    setMintStatus({ isProcessing: true });

    try {
      console.log("Starting PKP minting process...", {
        hasClient: !!client,
        userType: user?.type,
        hasEoaSigner: !!eoaSigner,
        eoaAddress,
        hasExistingPkp: !!pkp,
        isLitConnected: isConnected,
      });

      // 1. Verify Smart Account client
      if (!client) {
        setMintStatus({
          isProcessing: false,
          diagnosticInfo: { error: "Smart account client not initialized" },
        });
        return {
          success: false,
          pkp: null,
          error: "Smart account client not initialized",
        };
      }

      // 2. Verify User has SCA account
      if (!user?.type || user.type !== "sca") {
        setMintStatus({
          isProcessing: false,
          diagnosticInfo: {
            error: "Smart Contract Account required",
            userType: user?.type,
          },
        });
        return {
          success: false,
          pkp: null,
          error: "Smart Contract Account required for PKP minting",
        };
      }

      // 3. Verify EOA signer is available
      if (!eoaSigner || !eoaAddress) {
        setMintStatus({
          isProcessing: false,
          diagnosticInfo: {
            error: "EOA signer missing",
            hasEoaSigner: !!eoaSigner,
          },
        });
        return {
          success: false,
          pkp: null,
          error: "EOA signer required for Lit authentication",
        };
      }

      // 4. Ensure Lit client is initialized
      if (!isConnected) {
        console.log("Lit client not connected, initializing...");
        try {
          await initLitClient();
          console.log("Lit client initialized successfully");
        } catch (error) {
          console.error("Failed to initialize Lit client:", error);
          setMintStatus({
            isProcessing: false,
            diagnosticInfo: {
              error: "Failed to initialize Lit client",
              details: error,
            },
          });
          return {
            success: false,
            pkp: null,
            error:
              "Failed to initialize Lit client: " +
              (error instanceof Error ? error.message : "Unknown error"),
          };
        }
      }

      // 5. For minting a new PKP, we directly generate an auth signature
      // without using session signatures since we don't have a PKP public key yet
      console.log("Generating auth signature for minting...");
      let authSig;

      try {
        // Generate a standard auth signature for the EOA wallet
        const toSign = `I am creating a Lit Protocol key at ${new Date().toISOString()}`;

        // Create a SignerLike adapter for the eoaSigner
        authSig = await generateAuthSig({
          signer: {
            signMessage: async (message: string): Promise<`0x${string}`> => {
              // If it's a viem-style wallet (has account property)
              if (eoaSigner.account) {
                return await eoaSigner.signMessage({
                  message,
                  account: eoaSigner.account,
                });
              }
              // Try ethers.js style if there's no account property but there is a signMessage method
              else if (typeof eoaSigner.signMessage === "function") {
                try {
                  // Try direct string approach (ethers.js style)
                  return await eoaSigner.signMessage({
                    message: message as `0x${string}`,
                    account: eoaAddress as `0x${string}`,
                  });
                } catch (err) {
                  // If that fails, try with the hex address
                  if (eoaAddress && eoaAddress.startsWith("0x")) {
                    return await eoaSigner.signMessage({
                      message,
                      account: eoaAddress as `0x${string}`,
                    });
                  }
                  throw err;
                }
              }

              throw new Error(
                "Signer doesn't support required signMessage method"
              );
            },
            getAddress: async (): Promise<string> => eoaAddress,
          } as unknown as SignerLike,
          toSign, // Use toSign instead of statement
          address: eoaAddress,
        });

        console.log("Auth signature generated successfully");
      } catch (error) {
        console.error("Failed to generate auth signature:", error);
        setMintStatus({
          isProcessing: false,
          diagnosticInfo: {
            error: "Auth signature generation failure",
            details: error,
          },
        });
        return {
          success: false,
          pkp: null,
          error:
            "Failed to generate auth signature: " +
            (error instanceof Error ? error.message : "Unknown error"),
        };
      }

      if (!authSig) {
        setMintStatus({
          isProcessing: false,
          diagnosticInfo: {
            error: "Missing authSig after generation",
          },
        });
        return {
          success: false,
          pkp: null,
          error: "Failed to generate auth signature for minting",
        };
      }

      console.log("Successfully generated auth signature");

      // Construct authMethod for mintWithAuth
      const authMethod = {
        authMethodType: AUTH_METHOD_TYPE.EthWallet,
        accessToken: JSON.stringify(authSig),
      };

      // Define scopes for the PKP
      const scopes = [
        AUTH_METHOD_SCOPE.SignAnything,
        AUTH_METHOD_SCOPE.PersonalSign,
      ];

      // Initialize contract client
      console.log("Initializing contract client...");
      const contractClient = await getContractClient();
      if (!contractClient) {
        setMintStatus({
          isProcessing: false,
          diagnosticInfo: { error: "Contract client initialization failed" },
        });
        return {
          success: false,
          pkp: null,
          error: "Failed to initialize contract client",
        };
      }

      // Mint PKP with auth method and scopes
      console.log("Calling mintWithAuth...", {
        authMethodType: authMethod.authMethodType,
        hasAccessToken: !!authMethod.accessToken,
        scopes,
      });

      const mintInfo = await contractClient.mintWithAuth({
        authMethod,
        scopes,
      });

      if (!mintInfo?.pkp) {
        setMintStatus({
          isProcessing: false,
          diagnosticInfo: { error: "Mint operation failed", mintInfo },
        });
        return { success: false, pkp: null, error: "Failed to mint PKP" };
      }

      console.log("PKP minted successfully:", mintInfo.pkp);
      setPKP(mintInfo.pkp);
      setMintStatus({ isProcessing: false });
      return { success: true, pkp: mintInfo.pkp };
    } catch (error) {
      console.error("Failed to mint PKP:", error);
      setMintStatus({
        isProcessing: false,
        diagnosticInfo: { error: "Unhandled exception", details: error },
      });
      return {
        success: false,
        pkp: null,
        error: error instanceof Error ? error.message : "Failed to mint PKP",
      };
    }
  }, [
    client,
    user?.type,
    eoaSigner,
    eoaAddress,
    setPKP,
    pkp,
    initLitClient,
    isConnected,
  ]);

  return {
    pkp,
    mintPKP,
    isReady: !!client && !!eoaSigner,
    mintStatus,
  };
}
