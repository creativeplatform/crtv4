import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const proposalId = searchParams.get("proposalId");
  if (!proposalId)
    return NextResponse.json({ error: "Missing proposalId" }, { status: 400 });
  if (!/^[0-9]+$/.test(proposalId))
    return NextResponse.json({ error: "Invalid proposalId" }, { status: 400 });

  const accessToken = process.env.POAP_ACCESS_TOKEN;

  if (!accessToken)
    return NextResponse.json(
      { error: "No access token returned from Auth0" },
      { status: 500 }
    );

  const url = `https://api.poap.tech/snapshot/proposal/${proposalId}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-API-Key": process.env.POAP_API_KEY ?? "",
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch POAP data" },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  // Example: get data from request body if needed
  // const { address, eventId } = await req.json()

  const accessToken = process.env.POAP_ACCESS_TOKEN; // or pass it in securely

  const res = await fetch("https://api.poap.tech/actions/claim-qr", {
    method: "GET", // or "POST" if required by the endpoint
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "X-API-Key": process.env.POAP_API_KEY ?? "",
    },
    // body: JSON.stringify({ ... }) // if POST and body required
  });

  if (!res.ok)
    return NextResponse.json(
      { error: "Failed to claim POAP QR" },
      { status: res.status }
    );

  const data = await res.json();
  return NextResponse.json(data);
}
