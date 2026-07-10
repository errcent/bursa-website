import { courses, mentors, getMentorBySlug } from "@/lib/mock-data";
import type { Course, Mentor } from "@/lib/types";

export type SearchResultType = "course" | "mentor" | "topic";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
  score: number;
  matchedField?: string;
  imageUrl?: string;
  initials?: string;
  meta?: string;
}

export interface SearchSuggestion {
  label: string;
  query: string;
  category: "trending" | "instrument" | "level" | "topic";
}

/** Kata kunci SEO — disusun untuk intent pencarian edukasi trading Indonesia */
export const TRENDING_SEARCHES: SearchSuggestion[] = [
  { label: "Fundamental saham pemula", query: "fundamental saham", category: "trending" },
  { label: "Swing trading teknikal", query: "swing trading", category: "trending" },
  { label: "Belajar crypto dari nol", query: "crypto pemula", category: "trending" },
  { label: "Analisis laporan keuangan", query: "laporan keuangan", category: "trending" },
  { label: "Forex & analisis makro", query: "forex trading", category: "trending" },
  { label: "On-chain analysis crypto", query: "on-chain", category: "trending" },
  { label: "Value investing Indonesia", query: "value investing", category: "trending" },
  { label: "Manajemen risiko trading", query: "manajemen risiko", category: "topic" },
];

const INSTRUMENT_KEYWORDS: Record<string, string> = {
  saham: "Saham",
  stock: "Saham",
  crypto: "Crypto",
  kripto: "Crypto",
  bitcoin: "Crypto",
  btc: "Crypto",
  forex: "Forex",
  valas: "Forex",
};

const LEVEL_KEYWORDS: Record<string, string> = {
  pemula: "Pemula",
  beginner: "Pemula",
  menengah: "Menengah",
  intermediate: "Menengah",
  mahir: "Mahir",
  advanced: "Mahir",
  lanjutan: "Menengah",
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function tokenize(query: string): string[] {
  return normalize(query)
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function scoreText(text: string, tokens: string[], weight: number): number {
  const normalized = normalize(text);
  let score = 0;

  for (const token of tokens) {
    if (normalized === token) score += weight * 3;
    else if (normalized.startsWith(token)) score += weight * 2.2;
    else if (new RegExp(`\\b${escapeRegex(token)}`).test(normalized)) score += weight * 1.8;
    else if (normalized.includes(token)) score += weight;
  }

  return score;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scoreCourse(course: Course, tokens: string[]): { score: number; matchedField: string } {
  const mentor = getMentorBySlug(course.mentorSlug);
  let score = 0;
  let matchedField = "judul";

  const titleScore = scoreText(course.title, tokens, 10);
  const descScore = scoreText(course.shortDescription, tokens, 5);
  const mentorScore = mentor ? scoreText(mentor.name, tokens, 7) : 0;
  const mentorTitleScore = mentor ? scoreText(mentor.title, tokens, 4) : 0;
  const instrumentScore = scoreText(course.instrument, tokens, 3);
  const levelScore = scoreText(course.level, tokens, 3);
  const outcomeScore = course.outcomes.reduce(
    (acc, o) => acc + scoreText(o, tokens, 2),
    0
  );

  score = titleScore + descScore + mentorScore + mentorTitleScore + instrumentScore + levelScore + outcomeScore;

  if (titleScore >= descScore && titleScore >= mentorScore) matchedField = "judul";
  else if (mentorScore > 0) matchedField = "mentor";
  else if (descScore > 0) matchedField = "deskripsi";

  score += course.studentsCount / 5000;
  score += course.rating * 0.3;

  return { score, matchedField };
}

function scoreMentor(mentor: Mentor, tokens: string[]): { score: number; matchedField: string } {
  let score = 0;
  let matchedField = "nama";

  const nameScore = scoreText(mentor.name, tokens, 10);
  const titleScore = scoreText(mentor.title, tokens, 7);
  const bioScore = scoreText(mentor.bio, tokens, 3);
  const instrumentScore = mentor.instruments.reduce(
    (acc, i) => acc + scoreText(i, tokens, 4),
    0
  );

  score = nameScore + titleScore + bioScore + instrumentScore;

  if (nameScore >= titleScore) matchedField = "nama";
  else matchedField = "spesialisasi";

  score += mentor.studentsCount / 4000;
  score += mentor.rating * 0.3;
  if (mentor.verified) score += 0.5;

  return { score, matchedField };
}

function matchTopicSuggestions(tokens: string[]): SearchResult[] {
  if (tokens.length === 0) return [];

  return TRENDING_SEARCHES.filter((s) => {
    const label = normalize(s.label);
    const query = normalize(s.query);
    return tokens.every((t) => label.includes(t) || query.includes(t));
  })
    .slice(0, 3)
    .map((s) => ({
      id: `topic-${s.query}`,
      type: "topic" as const,
      title: s.label,
      subtitle: `Cari "${s.query}" di katalog`,
      href: `/katalog?q=${encodeURIComponent(s.query)}`,
      badge: "Topik",
      score: 5,
      matchedField: "topik populer",
    }));
}

export function searchAll(query: string, limit = 8): SearchResult[] {
  const trimmed = query.trim();
  const tokens = tokenize(trimmed);

  if (tokens.length === 0) return [];

  const results: SearchResult[] = [];

  for (const course of courses) {
    const { score, matchedField } = scoreCourse(course, tokens);
    if (score < 2) continue;

    const mentor = getMentorBySlug(course.mentorSlug);
    results.push({
      id: `course-${course.slug}`,
      type: "course",
      title: course.title,
      subtitle: mentor ? `${mentor.name} · ${course.instrument} · ${course.level}` : course.instrument,
      href: `/kelas/${course.slug}`,
      badge: course.level,
      score,
      matchedField,
      meta: `${course.rating}★ · ${course.studentsCount.toLocaleString("id-ID")} siswa`,
    });
  }

  for (const mentor of mentors) {
    const { score, matchedField } = scoreMentor(mentor, tokens);
    if (score < 2) continue;

    results.push({
      id: `mentor-${mentor.slug}`,
      type: "mentor",
      title: mentor.name,
      subtitle: mentor.title,
      href: `/instruktur/${mentor.slug}`,
      badge: mentor.instruments.join(", "),
      score,
      matchedField,
      imageUrl: mentor.avatarUrl,
      initials: mentor.initials,
      meta: `${mentor.rating}★ · ${mentor.studentsCount.toLocaleString("id-ID")} siswa`,
    });
  }

  results.push(...matchTopicSuggestions(tokens));

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getPopularCourses(limit = 4): SearchResult[] {
  return [...courses]
    .sort((a, b) => b.studentsCount - a.studentsCount)
    .slice(0, limit)
    .map((course) => {
      const mentor = getMentorBySlug(course.mentorSlug);
      return {
        id: `popular-course-${course.slug}`,
        type: "course" as const,
        title: course.title,
        subtitle: mentor?.name ?? "",
        href: `/kelas/${course.slug}`,
        badge: course.instrument,
        score: course.studentsCount,
        meta: `${course.rating}★`,
      };
    });
}

export function getPopularMentors(limit = 3): SearchResult[] {
  return [...mentors]
    .sort((a, b) => b.studentsCount - a.studentsCount)
    .slice(0, limit)
    .map((mentor) => ({
      id: `popular-mentor-${mentor.slug}`,
      type: "mentor" as const,
      title: mentor.name,
      subtitle: mentor.title,
      href: `/instruktur/${mentor.slug}`,
      badge: mentor.instruments[0],
      score: mentor.studentsCount,
      imageUrl: mentor.avatarUrl,
      initials: mentor.initials,
      meta: `${mentor.rating}★`,
    }));
}

export function getTrendingSuggestions(limit = 6): SearchSuggestion[] {
  return TRENDING_SEARCHES.slice(0, limit);
}

export function detectSearchIntent(query: string): {
  instrument?: string;
  level?: string;
} {
  const n = normalize(query);
  const intent: { instrument?: string; level?: string } = {};

  for (const [kw, val] of Object.entries(INSTRUMENT_KEYWORDS)) {
    if (n.includes(kw)) {
      intent.instrument = val;
      break;
    }
  }

  for (const [kw, val] of Object.entries(LEVEL_KEYWORDS)) {
    if (n.includes(kw)) {
      intent.level = val;
      break;
    }
  }

  return intent;
}

export function highlightMatch(text: string, query: string): { before: string; match: string; after: string }[] {
  const trimmed = query.trim();
  if (!trimmed) return [{ before: text, match: "", after: "" }];

  const tokens = tokenize(trimmed).sort((a, b) => b.length - a.length);
  if (tokens.length === 0) return [{ before: text, match: "", after: "" }];

  const pattern = new RegExp(`(${tokens.map(escapeRegex).join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part) => {
    const isMatch = tokens.some((t) => normalize(part) === t || normalize(part).includes(t));
    if (isMatch && part.length > 0) {
      return { before: "", match: part, after: "" };
    }
    return { before: part, match: "", after: "" };
  });
}

const RECENT_KEY = "bursa-recent-searches";
const MAX_RECENT = 5;

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string): void {
  if (typeof window === "undefined" || !query.trim()) return;
  try {
    const trimmed = query.trim();
    const recent = getRecentSearches().filter((q) => q !== trimmed);
    recent.unshift(trimmed);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    /* ignore */
  }
}

export function removeRecentSearch(query: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = query.trim();
    const recent = getRecentSearches().filter((q) => q !== trimmed);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {
    /* ignore */
  }
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    /* ignore */
  }
}

export function buildCatalogSearchUrl(query: string, view?: "kelas" | "instruktur"): string {
  const params = new URLSearchParams();
  const trimmed = query.trim();
  if (trimmed) params.set("q", trimmed);
  if (view) params.set("view", view);
  const qs = params.toString();
  return qs ? `/katalog?${qs}` : "/katalog";
}
