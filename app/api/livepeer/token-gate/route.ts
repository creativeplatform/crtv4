// app/api/livepeer/token-gate/route.ts

"use server";

import { NextRequest, NextResponse } from "next/server";
import { AccessControlResolver, WebhookPayload } from "./lib/access-control-resolver";
import { validateEnvVariables } from "./lib/env-validation";

const resolver = new AccessControlResolver();

export async function POST(request: NextRequest) {
  try {
    validateEnvVariables();

    const payload: WebhookPayload = await request.json();
    console.log({ payload });

    if (
      !payload.accessKey||
      !payload.context.creatorAddress ||
      !payload.context.tokenId ||
      !payload.context.contractAddress ||
      !payload.context.chain ||
      !payload.timestamp
    ) {
      return NextResponse.json(
        { allowed: false, message: "Bad request, missing required fields" },
        { status: 400 }
      );
    }

    const MAX_TIMESTAMP_AGE = 5 * 60 * 1000;
    const now = Date.now();

    if (Math.abs(now - payload.timestamp) > MAX_TIMESTAMP_AGE) {
      return NextResponse.json(
        {
          allowed: false,
          message: "Request timestamp too old or from future",
        },
        { status: 400 }
      );
    }

    const isAccessAllowed = await resolver.validateAccess(payload);

    console.log({ isAccessAllowed });

    if (isAccessAllowed) {
      return NextResponse.json(
        { allowed: true, message: "Access granted" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { allowed: false, message: "Access denied" },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Access control error:", error);
    return NextResponse.json(
      { allowed: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    validateEnvVariables();

    const address = request.nextUrl.searchParams.get("address") as string;
    const creatorAddress = request.nextUrl.searchParams.get(
      "creatorAddress"
    ) as string;
    const tokenId = request.nextUrl.searchParams.get("tokenId") as string;
    const contractAddress = request.nextUrl.searchParams.get(
      "contractAddress"
    ) as string;
    const chain = parseInt(request.nextUrl.searchParams.get("chain") as string);

    console.log({
      address,
      creatorAddress,
      tokenId,
      contractAddress,
      chain,
    });

    if (!address /* || !context */) {
      return NextResponse.json(
        { allowed: false, message: "Bad request, missing required fields" },
        { status: 400 }
      );
    }

    // Replace this with the correct way to generate or fetch an access key.
    // For now, just return a dummy access key for demonstration.
    const accessKey = `${address}:${creatorAddress}:${tokenId}:${contractAddress}:${chain}`;

    console.log({ accessKey });

    if (accessKey) {
      return NextResponse.json(
        { allowed: true, accessKey: accessKey },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { allowed: false, message: "Failed to generate access key." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Generate access key error:", error);
    return NextResponse.json(
      { allowed: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}