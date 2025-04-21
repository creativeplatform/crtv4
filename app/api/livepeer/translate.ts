'use server';

type TranslateParams = {
    text: string;
    source: string;
    target: string;
    modelId?: string;
    maxTokens?: string;
};

export const getLivepeerTranslation = async (
  params: TranslateParams,
) => {
    try {
        if (!params.text) throw new Error('No text provided');
        if (!params.source) throw new Error('No source language provided');
        if (!params.target) throw new Error('No target language provided');

        const livepeerApiUrl = process.env.LIVEPEER_API_URL || 'https://dream-gateway.livepeer.cloud';

        const formData = new FormData();

        formData.append('prompt', 
            `Translate '${params.text}' from ${params.source} to ${params.target}. ` +
            `Do not include any other words than the exact, grammatically correct translation.`);

        params.modelId 
            ? formData.append('model_id', params.modelId)
            : formData.append('model_id', 'meta-llama/Meta-Llama-3.1-8B-Instruct');
            
        params.maxTokens 
            ? formData.append('max_tokens', params.maxTokens)
            : formData.append('max_tokens', '256');

        const options = {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${process.env.LIVEPEER_FULL_API_KEY}`
            }
        };

        const result = await fetch(
            `https://livepeer.studio/api/beta/generate/llm`,
            options
        );

        if (!result.ok) {
            throw new Error(`Livepeer API error ${result?.status}: ${result?.statusText}`);
        }

        const data = await result.json();

        return data;
    } catch (error: any) {
        console.error('Translation error ', error);
        if (error instanceof Error) throw error;
        throw new Error('Failed to translate text');
    }
};
