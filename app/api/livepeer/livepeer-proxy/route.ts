import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const livepeerRes = await fetch("https://livepeer.studio/api/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LIVEPEER_FULL_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await livepeerRes.json();
  return NextResponse.json(data, { status: livepeerRes.status });
}
