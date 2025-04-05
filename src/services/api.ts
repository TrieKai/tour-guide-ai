import axios from "axios";
import { AnalysisRequest, AnalysisResponse } from "@/types/analysis";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  // 添加錯誤處理
  validateStatus: (status) => status < 500,
});

// 生成導遊提示詞
export const generateTourGuidePrompt = ({
  question,
  locationInfo,
}: {
  question: string;
  locationInfo: string;
}) => {
  return `你是一個專業的 AI 導遊，擅長解說景點和回答旅遊相關問題。

  當前地理資訊：
  ${locationInfo}

  使用者問題：
  ${question}

  請根據照片內容和位置資訊，回答這個問題。

  回答要求：
  1. 如果照片中有相關景點或建築，優先介紹它們
  2. 提供有趣的歷史背景或文化資訊（如果適用）
  3. 如果問題與照片內容無關，請友善地告知使用者
  4. 回答要簡潔有力，避免過於冗長
  5. 使用導遊式的親切語氣`;
};

// 分析圖片和回答問題
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
