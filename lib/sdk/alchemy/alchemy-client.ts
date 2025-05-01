import { Alchemy, Utils } from "alchemy-sdk";

const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const settings = {
  apiKey,
};

export const alchemyClient = new Alchemy(settings);
