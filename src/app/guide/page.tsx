"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { LucideArrowLeft } from "lucide-react";

const CameraComponent = dynamic(() => import("@/components/CameraComponent"), {
  ssr: false,
});

export default function TourGuidePage() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // check camera permission
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => {
        setHasPermission(true);
      })
      .catch(() => {
        alert("需要相機權限才能使用導遊功能");
        router.push("/");
      });
  }, [router]);

  if (!hasPermission) {
    return null;
  }

  return (
    <div className="h-screen relative">
      <CameraComponent />
      <button
        onClick={() => router.push("/")}
        className="absolute top-5 left-5 px-2.5 py-2.5 bg-black/50 text-white border-none rounded-full cursor-pointer z-50 transition-all duration-300 hover:bg-black/70 active:scale-95"
      >
        <LucideArrowLeft />
      </button>
    </div>
  );
}
