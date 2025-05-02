import { NextRequest } from "next/server";
import { unlockService } from "@/lib/sdk/unlock/services";

// POST /api/membership
export async function POST(req: NextRequest) {
  const { address } = await req.json();
  if (!address) {
    return new Response(JSON.stringify({ error: "Missing address" }), {
      status: 400,
    });
  }

  try {
    // This runs server-side, so no CORS issues!
    const memberships = await unlockService.getAllMemberships(address);
    return new Response(JSON.stringify({ memberships }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
    });
  }
}
