"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, Mic } from "lucide-react";
import clsx from "clsx";
import { getAddressFromCoordinates } from "@/services/geocoding";
import { analyze, generateTourGuidePrompt } from "@/services/api";
import {
  createSpeechRecognition,
  speak,
  stopSpeaking,
} from "@/services/speech";
import { startCamera, stopCamera, captureImage } from "@/services/camera";
import { getNearbyLandmarks } from "@/services/places";
import { initializeGoogleMaps } from "@/services/google-maps";
import type { SpeechRecognition, SpeechRecognitionEvent } from "@/types/speech";

interface Location {
  latitude: number;
  longitude: number;
}

export default function CameraComponent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [error, setError] = useState<string>("");
  const [location, setLocation] = useState<Location | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userQuestion, setUserQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [isGoogleMapsInitialized, setIsGoogleMapsInitialized] = useState(false);

  // Initialize Google Maps
  useEffect(() => {
    initializeGoogleMaps()
      .then((success) => {
        if (success) {
          setIsGoogleMapsInitialized(true);
        } else {
          setError("無法初始化 Google Maps 服務");
        }
      })
      .catch((error) => {
        console.error("初始化 Google Maps 時發生錯誤:", error);
        setError("無法初始化 Google Maps 服務");
      });
  }, []);

  // Get address from coordinates
  const getAddress = useCallback(
    async (
      latitude: number,
      longitude: number
    ): Promise<string | undefined> => {
      if (!isGoogleMapsInitialized) {
        throw new Error("Google Maps 服務尚未初始化");
      }
      return getAddressFromCoordinates(latitude, longitude);
    },
    [isGoogleMapsInitialized]
  );

  // Format landmarks for prompt
  const formatLandmarks = useCallback(
    (landmarks: Array<{ name: string; distance: number; type: string }>) => {
      if (landmarks.length === 0) {
        return "附近沒有發現明顯的地標。";
      }

      return landmarks
        .map(
          (landmark) =>
            `${landmark.name}（${landmark.type}，距離約 ${landmark.distance} 公尺）`
        )
        .join("\n");
    },
    []
  );

  // Handle user question
  const handleUserQuestion = useCallback(
    async (question: string): Promise<void> => {
      if (!videoRef.current || !location) {
        return;
      }

      if (!isGoogleMapsInitialized) {
        setDescription("Google Maps 服務尚未初始化，請稍後再試。");
        return;
      }

      try {
        setIsAnalyzing(true);
        const image = captureImage(videoRef.current);

        // Get address and landmarks
        const [address, landmarks] = await Promise.all([
          getAddress(location.latitude, location.longitude),
          getNearbyLandmarks(location.latitude, location.longitude),
        ]);

        const locationInfo = address
          ? `目前位置：${address}`
          : `目前位置：緯度 ${location.latitude}，經度 ${location.longitude}`;

        const landmarksInfo = formatLandmarks(landmarks);

        const prompt = generateTourGuidePrompt({
          question,
          locationInfo,
          landmarks: landmarksInfo,
        });

        const response = await analyze({
          image,
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
        speak(
          response.text,
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      } catch (error) {
        console.error("處理問題時發生錯誤:", error);
        setDescription("處理問題時發生錯誤，請再試一次。");
      } finally {
        setIsAnalyzing(false);
      }
    },
    [location, getAddress, formatLandmarks, isGoogleMapsInitialized]
  );

  // Initialize speech recognition
  useEffect(() => {
    const recognition = createSpeechRecognition();
    if (!recognition) {
      setError("您的瀏覽器不支援語音識別功能");
      return;
    }

    recognition.onresult = (event: SpeechRecognitionEvent): void => {
      const transcript = event.results[0][0].transcript;
      setUserQuestion(transcript);
      void handleUserQuestion(transcript);
    };

    recognition.onend = (): void => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [handleUserQuestion]);

  // Start listening
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

  // Get location and start camera
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("無法獲取位置:", error);
          setError("無法獲取位置，部分功能可能無法使用");
        }
      );
    }

    const initCamera = async (): Promise<void> => {
      try {
        const stream = await startCamera(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setError("");
      } catch (err) {
        setError(String(err));
      }
    };

    void initCamera();

    const videoElement = videoRef.current;

    return () => {
      if (videoElement?.srcObject) {
        stopCamera(videoElement.srcObject as MediaStream);
      }
      stopSpeaking();
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

      {/* Error message */}
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

      {/* Microphone button and user question */}
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
            isListening || isAnalyzing
              ? "bg-gray-500 cursor-not-allowed"
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
}
