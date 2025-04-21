'use server';
import { fullLivepeer } from '../../../lib/sdk/livepeer/fullClient';
import { TextToImageParams } from 'livepeer/models/components';

export const getLivepeerAiGeneratedImages = async (
  params: TextToImageParams,
) => {
  const result = await fullLivepeer.generate.textToImage(params);

  console.log('txt to image', result);

  return result.imageResponse;
};
