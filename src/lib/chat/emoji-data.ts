export const EMOJI_CATEGORIES = {
  "Sering Dipakai": ["👍", "❤️", "😂", "🔥", "🎉", "👀", "💯", "🙏"],
  Trading: ["📈", "📉", "💰", "🚀", "💎", "⚠️", "🎯", "💡"],
  Reaksi: ["😮", "😢", "😡", "🤔", "👏", "✅", "❌", "⭐"],
  Simbol: ["📊", "📌", "🔔", "💬", "🏆", "⏰", "📎", "🔗"],
} as const;

export const QUICK_REACTIONS = ["👍", "🔥", "📈", "📉", "💡", "❤️", "😂", "🎉"];

export const ALL_EMOJIS = Object.values(EMOJI_CATEGORIES).flat();
