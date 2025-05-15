import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { playbackId } = req.query;
  if (!playbackId || typeof playbackId !== "string") {
    res.status(400).json({ error: "Missing or invalid playbackId" });
    return;
  }

  const livepeerRes = await fetch(
    `https://livepeer.studio/api/playback/${playbackId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.LIVEPEER_FULL_API_KEY}`,
      },
    }
  );

  if (!livepeerRes.ok) {
    const errorText = await livepeerRes.text();
    res.status(livepeerRes.status).json({ error: errorText });
    return;
  }

  const data = await livepeerRes.json();
  res.status(200).json(data);
}
