export const MOTIVATION_QUOTES = [
  "Progress, not perfection. Every healthy choice today moves you forward.",
  "Your body can do it. It's your mind you need to convince.",
  "Small daily improvements are the key to long-term results.",
  "You didn't come this far to only come this far.",
  "Discipline is choosing between what you want now and what you want most.",
  "The only bad workout is the one that didn't happen.",
  "Consistency beats intensity. Show up today.",
  "Every meal is a chance to nourish the body you're building.",
  "Strong is the new goal. Keep going.",
  "You are one decision away from a totally different life.",
  "Fat loss is a marathon, not a sprint — trust the process.",
  "Your future self is thanking you for not giving up today.",
  "It never gets easier, you just get stronger.",
  "Focus on how far you've come, not how far you have to go.",
  "Great things take time. Be patient with your progress.",
];

export function quoteForDate(dateKey: string): string {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return MOTIVATION_QUOTES[hash % MOTIVATION_QUOTES.length];
}
