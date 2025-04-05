"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, Mic } from "lucide-react";
import { getAddressFromCoordinates } from "@/services/geocoding";
import { analyze, generateTourGuidePrompt } from "@/services/api";
import clsx from "clsx";

// define Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

const CameraComponent = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [description, setDescription] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [userQuestion, setUserQuestion] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // speak
  const speak = useCallback((text: string): void => {
    if ("speechSynthesis" in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-TW";
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  }, []);

  // get address
  const getAddress = useCallback(
    async (latitude: number, longitude: number) => {
      return getAddressFromCoordinates(latitude, longitude);
    },
    []
  );

  // handle user question
  const handleUserQuestion = useCallback(
    async (question: string): Promise<void> => {
      if (!videoRef.current || !location) return;

      try {
        setIsAnalyzing(true);

        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) throw new Error("無法創建 canvas context");

        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg");

        // get address
        const address = await getAddress(location.latitude, location.longitude);
        const locationInfo = address
          ? `目前位置：${address}`
          : `目前位置：緯度 ${location.latitude}，經度 ${location.longitude}`;

        const prompt = generateTourGuidePrompt({
          question,
          locationInfo,
        });

        const response = await analyze({
          image: imageData.split(",")[1],
          prompt,
          location: {
            address,
            coordinates: location,
          },
        });

        if (response.error) {
          throw new Error(response.error);
        }

        setDescription(response.text);
        speak(response.text);
      } catch (error) {
        console.error("處理問題時發生錯誤:", error);
        setDescription("處理問題時發生錯誤，請再試一次。");
      } finally {
        setIsAnalyzing(false);
      }
    },
    [speak, location, getAddress]
  );

  // initialize speech recognition
  useEffect(() => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "zh-TW";

      const handleSpeechResult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setUserQuestion(transcript);
        handleUserQuestion(transcript);
      };

      recognitionRef.current.onresult = handleSpeechResult;
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setError("您的瀏覽器不支援語音識別功能");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
      }
    };
  }, [handleUserQuestion]);

  // start listening
  const startListening = useCallback((): void => {
    if (recognitionRef.current && !isListening && !isAnalyzing) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("語音識別啟動失敗:", error);
        setIsListening(false);
        setError("語音識別啟動失敗，請重試");
      }
    }
  }, [isListening, isAnalyzing]);

  // get location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
        },
        (error) => {
          console.error("無法獲取位置:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        // try to use the back camera first
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: "environment" } },
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          return;
        } catch {
          console.log("無法使用後置相機，嘗試其他相機選項");
        }

        // if cannot use the back camera, try to use any available camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setError(""); // clear error message
      } catch (err) {
        console.error("無法存取任何相機:", err);
        setError("無法存取相機，請確認相機權限已開啟");
      }
    };

    void startCamera();

    const video = videoRef.current;

    return () => {
      if (video?.srcObject) {
        const tracks = (video.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
      // clear speech synthesis
      if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover absolute top-0 left-0 z-10"
      />

      {/* error message */}
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-500/80 text-white rounded-lg z-50">
          {error}
        </div>
      )}

      {/* AI response */}
      {description && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl p-4 bg-black/70 text-white rounded-xl z-50 animate-fadeIn">
          {isSpeaking && (
            <div className="text-green-400 mb-2">🔊 正在為您解說...</div>
          )}
          <div className="leading-relaxed">{description}</div>
        </div>
      )}

      {/* microphone button and user question */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-50">
        {userQuestion && (
          <div className="px-4 py-2 bg-white/90 rounded-full text-sm text-black max-w-[80vw] text-center">
            {userQuestion}
          </div>
        )}
        <button
          onClick={startListening}
          disabled={isListening || isAnalyzing}
          className={clsx(
            "w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all duration-300",
            isListening
              ? "bg-red-500 cursor-not-allowed"
              : "bg-green-500 hover:scale-105 active:scale-95"
          )}
        >
          {isListening ? <AudioLines /> : <Mic />}
        </button>
        {isAnalyzing && (
          <div className="text-white bg-black/50 px-4 py-2 rounded-full text-sm">
            分析中...
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraComponent;
