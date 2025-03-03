'use server';
import { TextToImageParams } from 'livepeer/models/components';

export const getLivepeerAiGeneratedImages = async ({
  prompt,
  modelId,
  safetyCheck,
  numImagesPerPrompt,
}: TextToImageParams) => {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  myHeaders.append(
    'Authorization',
    `Bearer ${process.env.LIVEPEER_FULL_API_KEY}`,
  );

  const raw = JSON.stringify({
    prompt,
    model_id: modelId,
    num_images_per_prompt: numImagesPerPrompt,
    safety_check: safetyCheck,
  });

  const requestOptions: RequestInit = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow',
  };

  console.log({ requestOptions });

  const response = await fetch(
    'https://livepeer.studio/api/beta/generate/text-to-image',
    requestOptions,
  );

  console.log({ response });

  if (response.ok) {
    return {
      success: true,
      result: await response.json(),
    };
  } else {
    return {
      success: false,
      result: await response.json(),
    };
  }
};
