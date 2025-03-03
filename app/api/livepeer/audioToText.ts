'use server';

type AudioToTextParams = {
  formData: FormData;
  modelId?: string;
  returnTimestamps?: string;
};

export const getLivepeerAudioToText = async (params: AudioToTextParams) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const file = params.formData.get('audio') as File;

    if (!file) throw new Error('No file uploaded');

    if (!(file.type.startsWith('audio/') || file.type.startsWith('video/'))) {
      throw new Error('File must be an audio or video file');
    }

    // if (params.modelId) params.formData.append('model_id', params.modelId as string);

    const options = {
      method: 'POST',
      body: params.formData,
      headers: {
        Authorization: `Bearer ${process.env.LIVEPEER_FULL_API_KEY}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    };

    const result = await fetch(
      `https://livepeer.studio/api/beta/generate/audio-to-text`,
      options,
    );

    clearTimeout(timeout);

    if (!result.ok) {
      console.error('Livepeer API Error:', {
        status: result.status,
        statusText: result.statusText,
      });
      throw new Error(
        `API request failed: ${result.status} ${result.statusText}`,
      );
    }

    const contentType = result.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await result.text();
      console.error('Unexpected response type:', contentType, text);
      throw new Error('API returned non-JSON response');
    }

    const data = await result.json();

    console.log({ audioToTextResponse: data });

    return data;
  } catch (error: any) {
    clearTimeout(timeout);
    console.error('Error generating text from audio:', error);
    throw new Error(error.message || 'Failed to generate text from audio');
  }
};
