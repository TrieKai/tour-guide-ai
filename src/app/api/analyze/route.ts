import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { image, prompt } = await request.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: image,
        },
      },
    ]);

    const { response } = result;
    return NextResponse.json({ text: response.text() });
  } catch (error) {
    console.error("Error in analyze API:", error);
    return NextResponse.json({ error: "處理請求時發生錯誤" }, { status: 500 });
  }
}
