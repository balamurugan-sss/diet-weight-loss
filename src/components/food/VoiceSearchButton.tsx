"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpeechRecognitionResultLike {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

type RecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const emptySubscribe = () => () => {};

function getRecognitionCtor(): (new () => RecognitionInstance) | null {
  const w = window as typeof window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => RecognitionInstance) | null;
}

function useSupportsSpeechRecognition(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => getRecognitionCtor() !== null,
    () => false
  );
}

export function VoiceSearchButton({ onResult }: { onResult: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const supported = useSupportsSpeechRecognition();
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  useEffect(() => {
    const RecognitionCtor = getRecognitionCtor();
    if (!RecognitionCtor) return;

    const recognition = new RecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => {
        if (listening) {
          recognitionRef.current?.stop();
          setListening(false);
        } else {
          recognitionRef.current?.start();
          setListening(true);
        }
      }}
      className={cn("chip h-11 w-11 !p-0 justify-center", listening && "chip-active")}
      aria-label="Voice search"
    >
      {listening ? <MicOff size={16} /> : <Mic size={16} />}
    </button>
  );
}
