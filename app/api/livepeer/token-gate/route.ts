'use server';

import { NextRequest, NextResponse } from 'next/server';
import {
  createPublicClient,
  http,
  Address,
  getContract,
  PublicClient,
  parseAbiItem,
} from 'viem';
import {
  base,
  baseSepolia,
  optimism,
  polygon,
  Chain,
} from 'viem/chains';

import { generateAccessKey, validateAccessKey } from '../../../../lib/access-key';
import { getJwtContext } from '../../auth/thirdweb/authentication';

// Import ERC1155 ABI
const erc1155ABI = [
  {
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_id', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// Define chain mapping
const chainMapping: Record<number, Chain> = {
  8453: base,
  10: optimism,
  137: polygon,
  84532: baseSepolia,
};

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

export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json();

    console.log({ payload });

    if (
      !payload.accessKey ||
      !payload.context.creatorAddress ||
      !payload.context.tokenId ||
      !payload.context.contractAddress ||
      !payload.context.chain ||
      !payload.timestamp
    ) {
      return NextResponse.json(
        {
          allowed: false,
          message: 'Bad request, missing required fields',
        },
        { status: 400 }
      );
    }

    // Validate timestamp age < 5 minutes
    const MAX_TIMESTAMP_AGE = 5 * 60 * 1000;
    const now = Date.now();

    if (Math.abs(now - payload.timestamp) > MAX_TIMESTAMP_AGE) {
      return NextResponse.json(
        {
          allowed: false,
          message: 'Request timestamp too old or from future',
        },
        { status: 400 }
      );
    }

    // Implement custom access control logic here
    const isAccessAllowed = await validateAccess(payload);

    console.log({ isAccessAllowed });

    if (isAccessAllowed) {
      return NextResponse.json(
        {
          allowed: true,
          message: 'Access granted',
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          allowed: false,
          message: 'Access denied',
        },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('Access control error:', error);
    return NextResponse.json(
      {
        allowed: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get('address') as string;
    const creatorAddress = request.nextUrl.searchParams.get(
      'creatorAddress'
    ) as string;
    const tokenId = request.nextUrl.searchParams.get('tokenId') as string;
    const contractAddress = request.nextUrl.searchParams.get(
      'contractAddress'
    ) as string;
    const chain = parseInt(request.nextUrl.searchParams.get('chain') as string);

    console.log({
      address,
      creatorAddress,
      tokenId,
      contractAddress,
      chain,
    });

    if (!address /* || !context */) {
      return NextResponse.json(
        {
          allowed: false,
          message: 'Bad request, missing required fields',
        },
        { status: 400 }
      );
    }

    const accessKey = generateAccessKey(address, {
      creatorAddress,
      tokenId,
      contractAddress,
      chain,
    });

    console.log({ accessKey });

    if (accessKey) {
      return NextResponse.json(
        {
          allowed: true,
          accessKey: accessKey,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          allowed: false,
          message: 'Failed to generate access key.',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Generate access key error:', error);
    return NextResponse.json(
      {
        allowed: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

async function validateAccess(payload: WebhookPayload): Promise<boolean> {
  const { accessKey, context, timestamp } = payload;

  const { address } = await getJwtContext();

  console.log({ address });

  // 1. Validate WebhookContext
  if (
    !address ||
    !context.creatorAddress ||
    !context.tokenId ||
    !context.contractAddress ||
    !context.chain
  ) {
    console.error({ address, context });
    return false;
  }

  // 2. Validate access key
  const isAccessKeyValid = validateAccessKey(accessKey, address, context);
  console.log({ isAccessKeyValid });
  if (!isAccessKeyValid) {
    return false;
  }

  // 3. Check user-specific conditions
  const userHasToken = await checkUserTokenBalances(address, context);
  console.log({ userHasToken });
  if (!userHasToken) {
    return false;
  }

  // 4. Asset or stream-specific checks
  // const isAssetAccessible = await checkAssetAccessibility(context);
  // console.log({ isAssetAccessible });
  // if (!isAssetAccessible) {
  //   return false;
  // }

  return true;
}

async function checkUserTokenBalances(
  address: string,
  context: WebhookContext
): Promise<boolean> {
  try {
    // Get the chain we are using
    const chain = chainMapping[context.chain];

    // If the chain is not supported, return false
    if (!chain) {
      console.error('Chain not supported');
      return false;
    }

    // Get a public client for the chain
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    // Check the user token balance
    const videoTokenBalance = await publicClient.readContract({
      address: context.contractAddress as Address,
      abi: erc1155ABI,
      functionName: 'balanceOf',
      args: [address as Address, BigInt(context.tokenId)],
    }) as bigint;

    console.log({ videoTokenBalance });

    return videoTokenBalance > BigInt(0);
  } catch (error) {
    console.error('Error checking token balances...', error);
    return false;
  }
}

async function checkAssetAccessibility(
  context: WebhookContext
): Promise<boolean> {
  // Implement actual asset accessibility checking logic
  // For example, check if asset is published or not restricted
  return true;
}
