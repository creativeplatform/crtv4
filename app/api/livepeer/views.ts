'use server';

export const fetchAllViews = async (
  playbackId: string,
): Promise<{
  playbackId: string;
  viewCount: number;
  playtimeMins: number;
  legacyViewCount: number;
} | null> => {
  const myHeaders = new Headers();
  myHeaders.append(
    'Authorization',
    `Bearer ${process.env.LIVEPEER_FULL_API_KEY}`,
  );

  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow' as const,
  };

  try {
    const response = await fetch(
      `https://livepeer.studio/api/data/views/query/total/${playbackId}`,
      requestOptions,
    );

    if (!response.ok) {
      throw new Error(`Error fetching views: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      playbackId: data.playbackId,
      viewCount: data.viewCount,
      playtimeMins: data.playtimeMins,
      legacyViewCount: data.legacyViewCount,
    };
  } catch (error) {
    console.error('Failed to fetch view metrics:', error);
    return null;
  }
};
