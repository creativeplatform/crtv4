import { Livepeer } from 'livepeer';

export const fullLivepeer = new Livepeer({
  apiKey: process.env.LIVEPEER_FULL_API_KEY,
});
