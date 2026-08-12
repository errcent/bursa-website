/**
 * MasterClass-style instructor portraits for selected courses.
 *
 * Style DNA (26 refs in `_assets/masterclass-thumbnail-example`):
 * - Medium waist-up, direct eye contact, calm confident approachable expression
 * - Lighting: soft Rembrandt / beauty key, subtle rim separation, luminous skin (not flat desaturated)
 * - Backgrounds: navy/charcoal seamless, premium office, library, modern interior - real spaces, not sci-fi props
 * - Wardrobe: smart casual (turtleneck, long-sleeve knit/tee, sweater) - no stiff blazer default
 * - Shallow DOF, 85mm commercial portrait look, negative space for title overlay
 *
 * Portrait thumbnails are generated with FLUX.2 Max only - never Pollinations.
 */
export const MASTERCLASS_PORTRAIT_COURSE_SLUGS = new Set([
  "fundamental-saham-untuk-pemula",
  "psikologi-trading-anti-fomo",
  "crypto-on-chain-dasar",
  "swing-trading-teknikal-dasar",
  "membaca-laporan-keuangan-lanjutan",
  "forex-makro-dasar",
  "scalping-saham-intraday-jam-perdagangan",
  "defi-dan-tokenomics-pemula",
  "siklus-bitcoin-halving-dan-makro-kripto",
  "blueprint-manajemen-risiko-trader",
  "scalping-forex-sesi-london-ny",
  "price-action-forex-tanpa-indikator",
  "riset-narrative-kripto-menengah",
  "screening-saham-dividen-konsisten",
  "price-action-swing-saham-menengah",
  "eksekusi-scalping-order-book-idx",
]);

export const MASTERCLASS_PORTRAIT_NEGATIVE =
  "text, typography, logo, watermark, ui, chart, candlestick, trading screen, stock ticker, celebrity likeness, caricature, illustration, neon colors, overcrowded background, anime, cartoon, glass cubes, sci-fi props, holographic effects";

const MASTERCLASS_STYLE_SUFFIX =
  "cinematic instructor portrait photography, natural luminous skin texture, 85mm prime lens at f2.8, shallow depth of field with creamy bokeh, clean high-key beauty lighting, radiant luminous healthy skin, bright catchlights in both eyes, polished professional grooming, crisp wardrobe, razor-sharp focus on face, premium commercial color grading, MasterClass documentary key art quality, medium waist-up framing, centered symmetrical composition, subject facing camera directly, warm genuine happy smile with relaxed easy confidence, prosperous effortless luxury aura, natural unforced body language, not stiff robotic corporate pose, no suit jacket no blazer, clean image without text logos watermarks charts or trading screens";

/** Varied scenes - each course maps to a distinct MasterClass reference archetype. */
const SCENE = {
  /** Ref: navy seamless + cashmere turtleneck, relaxed prosperous mentor */
  fundamental:
    "Premium cinematic portrait of a generic Indonesian male finance educator in his early 40s, warm genuine happy smile, direct eye contact, quietly wealthy approachable mentor vibe, wearing a charcoal cashmere turtleneck with no blazer and no suit jacket, centered waist-up with slightly relaxed shoulders, hands loosely clasped casually in front, seated against a rich deep navy seamless studio backdrop with subtle fabric texture, bright softbox beauty lighting evenly illuminating the face",
  /** Ref: centered charcoal seamless (Phil Jackson) */
  psikologi:
    "Premium cinematic portrait of a generic Indonesian male trading psychology coach in his early 40s, calm grounded expression, direct eye contact, reassuring subtle smile, wearing a charcoal wool sweater over a crisp white collared shirt, centered seated against a solid charcoal gray seamless studio backdrop, bright softbox beauty lighting evenly illuminating the face",
  /** Ref: centered navy seamless (Amy Poehler) */
  cryptoOnChain:
    "Premium cinematic portrait of a generic Indonesian female crypto analyst in her early 30s, confident intelligent expression, direct eye contact, approachable smile, wearing a structured black blazer over a white blouse, centered seated against a solid deep navy seamless studio backdrop, clean high-key beauty lighting with soft fill on the face",
  /** Ref: centered charcoal seamless, relaxed pose */
  swingTeknikal:
    "Premium cinematic portrait of a generic Indonesian female swing trading educator in her mid 30s, calm confident expression, direct eye contact, warm professional smile, wearing a navy V-neck sweater over a soft blush pink collared shirt, centered seated against a matte charcoal gray seamless studio backdrop, hands relaxed at sides, bright softbox beauty lighting",
  /** Ref: executive office warm lamp + window (Bob Iger) */
  valuasiLanjutan:
    "Premium cinematic portrait of a generic Indonesian male equity valuation analyst in his early 40s, thoughtful authoritative expression, direct eye contact, slight confident smile, wearing a charcoal tailored blazer over a soft peach collared shirt, centered waist-up seated facing camera in a premium executive office with warm desk lamp glow and soft daylight from a window blurred behind him, bright soft fill balancing warm lamp light evenly illuminating the face, polished dark wood desk edge in foreground, MasterClass business leadership key art not dim moody study",
  /** Ref: long-sleeve tee + compass prop, relaxed lean */
  forexMakro:
    "Premium cinematic portrait of a generic Indonesian male macro forex strategist in his early 40s, open warm happy smile, direct eye contact, relaxed prosperous ease, wearing a premium soft heather navy long-sleeve cotton tee with no blazer and no dress shirt, centered seated at a polished desk leaning casually toward the camera with one forearm resting naturally on the desk beside an antique brass compass as a soft prop, solid charcoal gray studio backdrop, bright soft beauty fill illuminating the face luminously",
  /** Ref: soft turtleneck + chronograph prop, casual lean */
  scalpingIdx:
    "Premium cinematic portrait of a generic Indonesian female IDX scalping educator in her early 30s, genuine happy smile, easy direct eye contact, prosperous calm energy, wearing a soft cream fine-knit turtleneck with no blazer and no suit jacket, centered waist-up with a relaxed three-quarter lean toward the camera, casual seated posture, precision chronograph watch resting softly on a desk edge out of focus, matte charcoal studio background, clean high-key beauty lighting evenly illuminating the face",
  /** Ref: modern wood-slat interior (Melinda Gates) */
  defiPemula:
    "Premium cinematic portrait of a generic Indonesian female DeFi researcher in her late 20s, bright intelligent expression, direct eye contact, warm smile, wearing a structured black blazer over a white blouse, centered standing portrait facing camera against vertical pale wood slat wall in a refined modern interior, soft natural daylight plus soft beauty fill on the face, background softly blurred",
  /** Ref: private library richness (Amy Tan) */
  siklusBitcoin:
    "Premium cinematic portrait of a generic Indonesian female crypto macro analyst in her early 30s, calm insightful expression, direct eye contact, confident smile, wearing a black tailored blazer over a deep burgundy top, centered seated facing camera in a luxurious private library with floor-to-ceiling dark wood bookshelves filled with books softly blurred behind her, warm ambient library light with even soft beauty fill on the face illuminating skin luminously",
  /** Risk portfolio - soft navy long-sleeve, charcoal seamless */
  risikoPortofolio:
    "Premium cinematic portrait of a generic Indonesian male risk management coach in his early 40s, warm genuine happy smile, direct eye contact, quietly prosperous mentor vibe, wearing a soft navy long-sleeve cotton tee with no blazer and no suit jacket, centered waist-up seated with relaxed shoulders and one hand resting casually on his other forearm, solid charcoal gray seamless studio backdrop, bright softbox beauty lighting evenly illuminating the face",
  /** Forex scalping London/NY - olive long-sleeve, lean */
  scalpingForex:
    "Premium cinematic portrait of a generic Indonesian male forex scalping educator in his mid 30s, open warm happy smile, direct eye contact, energetic yet relaxed prosperous ease, wearing a premium soft olive green long-sleeve cotton tee with no blazer, centered seated leaning casually toward the camera with forearms resting on a clean dark desk edge, matte charcoal studio backdrop, clean high-key beauty lighting with luminous skin",
  /** Price action forex - heather grey turtleneck */
  priceActionForex:
    "Premium cinematic portrait of a generic Indonesian male price action forex educator in his mid 30s, genuine happy smile, easy direct eye contact, calm affluent confidence, wearing a soft heather grey fine-knit turtleneck with no blazer and no suit jacket, centered waist-up with a relaxed three-quarter lean, hands loosely interlaced in front, rich deep navy seamless studio backdrop, bright soft beauty fill illuminating the face",
  /** Narrative crypto - cream long-sleeve knit, wood-slat hint */
  narrativeCrypto:
    "Premium cinematic portrait of a generic Indonesian female crypto narrative researcher in her late 20s, bright warm happy smile, direct eye contact, prosperous creative ease, wearing a soft cream long-sleeve fine knit top with no blazer, centered standing portrait with relaxed shoulders and one hand lightly touching the opposite forearm, refined modern interior with soft pale wood vertical slats softly blurred behind her, natural daylight plus soft beauty fill on the face",
  /** Dividend screening - camel turtleneck, navy seamless */
  dividenSaham:
    "Premium cinematic portrait of a generic Indonesian male dividend investing educator in his early 40s, warm genuine happy smile, direct eye contact, quietly wealthy approachable aura, wearing a soft camel cashmere turtleneck with no blazer and no suit jacket, centered waist-up seated with relaxed posture and hands loosely clasped, rich deep navy seamless studio backdrop with subtle fabric texture, bright softbox beauty lighting evenly illuminating the face",
  /** Swing price action saham - soft sage long-sleeve */
  swingPriceAction:
    "Premium cinematic portrait of a generic Indonesian female swing trading educator in her mid 30s, genuine happy smile, easy direct eye contact, relaxed prosperous calm, wearing a soft sage green long-sleeve cotton tee with no blazer, centered seated leaning slightly toward the camera with one forearm resting casually on a polished desk edge, matte charcoal gray studio backdrop, clean high-key beauty lighting with luminous healthy skin",
  /** Order book microstructure - charcoal turtleneck + soft prop */
  mikrostrukturIdx:
    "Premium cinematic portrait of a generic Indonesian female market microstructure educator in her early 30s, warm genuine happy smile, direct eye contact, prosperous focused ease, wearing a charcoal fine-knit turtleneck with no blazer and no suit jacket, centered waist-up with a relaxed casual lean toward camera, precision chronograph watch resting softly out of focus on a light desk edge, solid deep navy seamless studio backdrop, bright soft beauty fill illuminating the face luminously",
} as const;

function portraitPrompt(scene: string): string {
  return `${scene}, ${MASTERCLASS_STYLE_SUFFIX}`;
}

export const MASTERCLASS_PORTRAIT_PROMPTS: Record<string, string> = {
  "fundamental-saham-untuk-pemula": portraitPrompt(SCENE.fundamental),
  "psikologi-trading-anti-fomo": portraitPrompt(SCENE.psikologi),
  "crypto-on-chain-dasar": portraitPrompt(SCENE.cryptoOnChain),
  "swing-trading-teknikal-dasar": portraitPrompt(SCENE.swingTeknikal),
  "membaca-laporan-keuangan-lanjutan": portraitPrompt(SCENE.valuasiLanjutan),
  "forex-makro-dasar": portraitPrompt(SCENE.forexMakro),
  "scalping-saham-intraday-jam-perdagangan": portraitPrompt(SCENE.scalpingIdx),
  "defi-dan-tokenomics-pemula": portraitPrompt(SCENE.defiPemula),
  "siklus-bitcoin-halving-dan-makro-kripto": portraitPrompt(SCENE.siklusBitcoin),
  "blueprint-manajemen-risiko-trader": portraitPrompt(SCENE.risikoPortofolio),
  "scalping-forex-sesi-london-ny": portraitPrompt(SCENE.scalpingForex),
  "price-action-forex-tanpa-indikator": portraitPrompt(SCENE.priceActionForex),
  "riset-narrative-kripto-menengah": portraitPrompt(SCENE.narrativeCrypto),
  "screening-saham-dividen-konsisten": portraitPrompt(SCENE.dividenSaham),
  "price-action-swing-saham-menengah": portraitPrompt(SCENE.swingPriceAction),
  "eksekusi-scalping-order-book-idx": portraitPrompt(SCENE.mikrostrukturIdx),
};

export const MASTERCLASS_PORTRAIT_SEEDS: Record<string, number> = {
  "fundamental-saham-untuk-pemula": 420507,
  "psikologi-trading-anti-fomo": 420501,
  "crypto-on-chain-dasar": 420502,
  "swing-trading-teknikal-dasar": 420503,
  "membaca-laporan-keuangan-lanjutan": 420504,
  "forex-makro-dasar": 420508,
  "scalping-saham-intraday-jam-perdagangan": 420509,
  "defi-dan-tokenomics-pemula": 420505,
  "siklus-bitcoin-halving-dan-makro-kripto": 420506,
  "blueprint-manajemen-risiko-trader": 420510,
  "scalping-forex-sesi-london-ny": 420511,
  "price-action-forex-tanpa-indikator": 420512,
  "riset-narrative-kripto-menengah": 420513,
  "screening-saham-dividen-konsisten": 420514,
  "price-action-swing-saham-menengah": 420515,
  "eksekusi-scalping-order-book-idx": 420516,
};

export function isMasterclassPortraitCourse(slug: string): boolean {
  return MASTERCLASS_PORTRAIT_COURSE_SLUGS.has(slug);
}
