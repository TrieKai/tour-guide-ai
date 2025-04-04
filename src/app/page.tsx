"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-900 via-red-800 to-yellow-500 text-white">
      <h1 className="text-4xl md:text-5xl font-bold mb-8">AI 智慧導遊</h1>
      <p className="text-lg md:text-xl mb-12 text-center">
        您的專屬旅遊夥伴
        <br />
        隨時為您介紹周遭景點
      </p>
      <button
        onClick={() => router.push("/guide")}
        className="px-8 py-4 text-lg bg-white/20 border-2 border-white rounded-full text-white cursor-pointer transition-all duration-300 hover:bg-white/30 hover:scale-105 active:scale-95 focus:outline-none"
      >
        開始導覽
      </button>
    </div>
  );
}
