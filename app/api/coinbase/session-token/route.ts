// app/api/coinbase/session-token/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { address, assets } = await req.json();

  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  // Prepare the request body for Coinbase
  const body = {
    addresses: [
      {
        address,
        blockchains: ["base"], // or more if needed
      },
    ],
    assets: assets || ["USDC"],
  };

  // Call Coinbase Session Token API
  const coinbaseRes = await fetch(
    "https://api.developer.coinbase.com/onramp/v1/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CDP-API-KEY": process.env.COINBASE_CDP_API_KEY as string,
      },
      body: JSON.stringify(body),
    }
  );

  if (!coinbaseRes.ok) {
    const error = await coinbaseRes.text();
    return NextResponse.json({ error }, { status: 500 });
  }

  const data = await coinbaseRes.json();
  return NextResponse.json({ sessionToken: data.sessionToken });
}
