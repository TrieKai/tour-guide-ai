import type { SpeechRecognition } from "@/types/speech";

export const createSpeechRecognition = (): SpeechRecognition | null => {
  const SpeechRecognitionImpl =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognitionImpl) {
    return null;
  }

  const recognition = new SpeechRecognitionImpl();
  recognition.continuous = false;
  recognition.lang = "zh-TW";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  return recognition;
};

export const speak = (
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): void => {
  if (!("speechSynthesis" in window)) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-TW";

  if (onStart) {
    utterance.onstart = onStart;
  }
  if (onEnd) {
    utterance.onend = onEnd;
  }

  speechSynthesis.cancel(); // Cancel any ongoing speech
  speechSynthesis.speak(utterance);
};

export const stopSpeaking = (): void => {
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }
};
