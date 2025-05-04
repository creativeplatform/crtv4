import { NextRequest, NextResponse } from "next/server";

// CORS middleware for API routes
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only handle CORS for /api routes
  if (pathname.startsWith("/api")) {
    const origin = req.headers.get("origin");
    const allowedOrigins =
      process.env.NODE_ENV === "production"
        ? ["https://tv.creativeplatform.xyz"]
        : ["http://localhost:3000"];

    if (origin && !allowedOrigins.includes(origin)) {
      return new NextResponse(null, {
        status: 400,
        statusText: "Bad Request",
        headers: { "Content-Type": "text/plain" },
      });
    }

    const res = NextResponse.next();
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Origin", origin || "*");
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET,DELETE,PATCH,POST,PUT"
    );
    res.headers.set(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
    );

    // Handle preflight
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { headers: res.headers });
    }
    return res;
  }

  // For all other routes, just continue
  return NextResponse.next();
}

// Apply to all API routes
export const config = {
  matcher: ["/api/:path*"],
};
