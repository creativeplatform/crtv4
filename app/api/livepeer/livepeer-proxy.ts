import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const livepeerRes = await fetch("https://livepeer.studio/api/stream", {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LIVEPEER_FULL_API_KEY}`,
    },
    body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
  });

  const data = await livepeerRes.json();
  res.status(livepeerRes.status).json(data);
}
