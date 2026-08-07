export interface PostSearchParams {
  userInput: string;
  budget?: number;
}

export interface PostSearchResult {
  _id: string | null;
  reason: string;
}

export const findSmartPostMatch = async ({
  userInput,
  budget,
}: PostSearchParams): Promise<PostSearchResult> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${baseUrl}/listings/smart-search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: userInput,
        budget,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server status: ${response.status}`);
    }

    const result = await response.json();

    return {
      _id: result.data?._id || result._id || null,
      reason: result.data?.reason || result.reason || "No matching listing found.",
    };
  } catch (error) {
    console.error("Smart Match Error:", error);
    return {
      _id: null,
      reason: "An error occurred while processing your AI search request.",
    };
  }
};