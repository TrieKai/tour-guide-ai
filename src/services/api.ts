import axios from "axios";
import type { AnalysisRequest, AnalysisResponse } from "@/types/analysis";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  // Add error handling
  validateStatus: (status) => status < 500,
});

// Generate tour guide prompt
export const generateTourGuidePrompt = ({
  question,
  locationInfo,
  landmarks,
}: {
  question: string;
  locationInfo: string;
  landmarks: string;
}) => {
  return `你是一個專業的 AI 導遊，擅長解說景點和回答旅遊相關問題。

  當前地理資訊：
  ${locationInfo}

  附近的地標：
  ${landmarks}

  使用者問題：
  ${question}

  請根據照片內容、位置資訊和附近地標，回答這個問題。

  回答要求：
  1. 根據照片與地點判斷他目前拍攝的是哪個地點？
  2. 推薦他接下來可以去哪裡？為什麼？
  3. 提供有趣的歷史背景或文化資訊（如果適用）
  4. 如果問題與照片內容無關，請友善地告知使用者
  5. 回答要簡潔有力，避免過於冗長
  6. 使用導遊式的親切語氣`;
};

// Analyze image and answer question
export const analyze = async ({
  image,
  prompt,
  location,
}: AnalysisRequest): Promise<AnalysisResponse> => {
  try {
    const { data } = await api.post<AnalysisResponse>("/analyze", {
      image,
      prompt,
      location,
    });
    return data;
  } catch (error) {
    console.error("API 請求失敗:", error);
    return {
      text: "抱歉，系統暫時無法處理您的請求，請稍後再試。",
      error: "API request failed",
    };
  }
};
