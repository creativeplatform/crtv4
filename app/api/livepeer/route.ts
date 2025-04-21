'use server';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const livepeerUrl = `${process.env.LIVEPEER_FULL_API_URL}/api/asset`;

  const options = {
    headers: {
      Authorization: `Bearer ${process.env.LIVEPEER_FULL_API_KEY}`,
    },
  };

  const response = await fetch(livepeerUrl, options);

  // if (!response.ok) {
  //   return NextResponse.json({ error: 'Internal Server Error', data: await response.json() }, { status: 500 });
  // }

  const json = await response.json();

  return NextResponse.json(json);
}

export async function POST(request: NextRequest) {
  const livepeerUpload = `${process.env.LIVEPEER_FULL_API_URL}/api/asset/request-upload`;

  const options = {
    headers: {
      Authorization: `Bearer ${process.env.LIVEPEER_FULL_API_KEY}`,
      ContentType: 'application/json',
    },
  };

  const response = await fetch(livepeerUpload, options);

  // if (!response.ok) {
  //   return NextResponse.json({ error: 'Internal Server Error', data: await response.json() }, { status: 500 });
  // }

  const json = await response.json();

  return NextResponse.json(json);
}
