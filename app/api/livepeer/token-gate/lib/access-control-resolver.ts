// lib/access-control-resolver.ts
import { SmartAccountService } from "./smart-account-service";
import { createPublicClient, http, Address } from "viem";
import { base, baseSepolia, optimism, polygon } from "viem/chains";

// Define the ABI for the ERC1155 contract
// This is a simplified version, you may need to include more functions depending on your use case
// For example, you might want to include functions for minting, transferring, etc.
// You can also use a library like ethers.js to generate the ABI from the contract
// address and ABI
// For now, we will just include the balanceOf function
// This is a simplified version, you may need to include more functions depending on your use case

const erc1155ABI = [
  {
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_id", type: "uint256" },
    ],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

const chainMapping: Record<number, any> = {
  8453: base,
  10: optimism,
  137: polygon,
  84532: baseSepolia
  //filecoin: 3141
  // flare: 3141
};

// 
export interface WebhookPayload {
  accessKey: string;
  context: WebhookContext;
  timestamp: number;
}

export interface WebhookContext {
  creatorAddress: string;
  tokenId: string;
  contractAddress: string;
  chain: number;
}

export class AccessControlResolver {
  private readonly smartAccountService;

  constructor() {
    this.smartAccountService = new SmartAccountService();
  }

  async validateAccess(payload: WebhookPayload): Promise<boolean> {
    const { accessKey, context } = payload;

    // Validate the access key
    const isValidKey = await this.validateAccessKey(accessKey, context.creatorAddress as Address, context);
    if (!isValidKey) return false;

    // Check if user has required token balance
    const userAddress = this.smartAccountService.getAddress();
    if (!userAddress) {
      console.error("User address is undefined");
      return false;
    }
    const hasTokens = await this.checkUserTokenBalances(
      userAddress as Address,
      context
    );
    if (!hasTokens) return false;

    // Check if the asset is accessible
    const isAccessible = await this.checkAssetAccessibility(context);
    if (!isAccessible) return false;

    return true;
  }
// Module '"./lib/access-control-resolver"' has no exported member 'AccessKey'.Why is this? 

  // This function is not implemented yet
  // It should generate an access key for the user based on their address
  // and the context provided
  // You can use the smart account service to generate the access key
  // and return it
  // For now, we will just return a placeholder string
   async AccessKey(address: Address | undefined, context: WebhookContext): Promise<string> {
    if (address === undefined) {
      address = this.smartAccountService.getAddress() as Address;
      if (!address) {
        console.error("User address is undefined");
        throw new Error("User address is undefined");
      }
    }
    throw new Error("AccessKey is not implemented");
  }

  async validateAccessKey(accessKey: string, address: Address, context: WebhookContext): Promise<boolean> {
    // Implement access key validation logic
    // Example:
    // For now, return true as a placeholder
    return true;
  
  }

  async checkUserTokenBalances(
    address: Address,
    context: WebhookContext
  ): Promise<boolean> {
    try {
      const chain = chainMapping[context.chain];

      if (!chain) {
        console.error("Chain not supported");
        return false;
      }

      const publicClient = createPublicClient({
        chain,
        transport: http(),
      });

      const videoTokenBalance = (await publicClient.readContract({
        address: context.contractAddress as Address,
        abi: erc1155ABI,
        functionName: "balanceOf",
        args: [address, BigInt(context.tokenId)],
      })) as bigint;

      console.log({ videoTokenBalance });

      return videoTokenBalance > BigInt(0);
    } catch (error) {
      console.error("Error checking token balances...", error);
      return false;
    }
  }

  async checkAssetAccessibility(
    context: WebhookContext
  ): Promise<boolean> {
    // Implement actual asset accessibility checking logic
    // For example, check if asset is published or not restricted
    return true;
  }
}