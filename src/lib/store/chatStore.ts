"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage } from "@/types";

interface ChatState {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, "id" | "createdAt">) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      addMessage: (message) =>
        set({
          messages: [
            ...get().messages,
            { ...message, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
          ],
        }),
      clearMessages: () => set({ messages: [] }),
    }),
    { name: "fitfusion-chat" }
  )
);
