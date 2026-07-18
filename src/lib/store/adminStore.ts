"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FoodItem, Recipe } from "@/types";

export interface BlogPost {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface AdminState {
  customRecipes: Recipe[];
  customFoods: FoodItem[];
  blogPosts: BlogPost[];
  faqs: FAQItem[];
  addCustomRecipe: (recipe: Recipe) => void;
  removeCustomRecipe: (id: string) => void;
  addCustomFood: (food: FoodItem) => void;
  removeCustomFood: (id: string) => void;
  addBlogPost: (post: Omit<BlogPost, "id" | "createdAt">) => void;
  removeBlogPost: (id: string) => void;
  addFaq: (faq: Omit<FAQItem, "id">) => void;
  removeFaq: (id: string) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      customRecipes: [],
      customFoods: [],
      blogPosts: [],
      faqs: [],
      addCustomRecipe: (recipe) => set({ customRecipes: [...get().customRecipes, recipe] }),
      removeCustomRecipe: (id) => set({ customRecipes: get().customRecipes.filter((r) => r.id !== id) }),
      addCustomFood: (food) => set({ customFoods: [...get().customFoods, food] }),
      removeCustomFood: (id) => set({ customFoods: get().customFoods.filter((f) => f.id !== id) }),
      addBlogPost: (post) =>
        set({ blogPosts: [...get().blogPosts, { ...post, id: crypto.randomUUID(), createdAt: new Date().toISOString() }] }),
      removeBlogPost: (id) => set({ blogPosts: get().blogPosts.filter((p) => p.id !== id) }),
      addFaq: (faq) => set({ faqs: [...get().faqs, { ...faq, id: crypto.randomUUID() }] }),
      removeFaq: (id) => set({ faqs: get().faqs.filter((f) => f.id !== id) }),
    }),
    { name: "fitfusion-admin" }
  )
);
