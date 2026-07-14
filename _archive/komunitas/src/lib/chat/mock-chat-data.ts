import type { ChatMember, ChatMessage, ChatRoom } from "./types";

export const mockMembers: ChatMember[] = [
  {
    id: "m-1",
    name: "Andra Wicaksono, CFA",
    username: "andra",
    initials: "AW",
    role: "mentor",
    isOnline: true,
    avatarUrl: "/mentors/andra-wicaksono.png",
    profileSlug: "andra-wicaksono",
    bio: "Analis fundamental & CFA charterholder.",
  },
  {
    id: "m-2",
    name: "Kirana Ayu",
    username: "kirana",
    initials: "KA",
    role: "mentor",
    isOnline: true,
    avatarUrl: "/mentors/kirana-ayu.png",
    profileSlug: "kirana-ayu",
    bio: "Crypto trader dengan fokus on-chain analysis.",
  },
  {
    id: "m-3",
    name: "Budi Santoso",
    username: "budi",
    initials: "BS",
    role: "member",
    isOnline: true,
    bio: "Belajar saham pemula — fokus risk management.",
  },
  {
    id: "m-4",
    name: "Dewi Lestari",
    username: "dewi",
    initials: "DL",
    role: "member",
    isOnline: false,
  },
  {
    id: "m-5",
    name: "Rizky Pratama",
    username: "rizky",
    initials: "RP",
    role: "member",
    isOnline: true,
  },
  {
    id: "m-6",
    name: "Siti Nurhaliza",
    username: "siti",
    initials: "SN",
    role: "moderator",
    isOnline: true,
    bio: "Moderator komunitas — bantu jaga kualitas diskusi.",
  },
];

export const mockRooms: ChatRoom[] = [
  {
    id: "room-public",
    slug: "komunitas-publik",
    name: "Komunitas Publik Bursa",
    description:
      "Ruang publik terbuka untuk semua anggota — diskusi umum pasar dan komunitas trading.",
    channelCategory: "Publik",
    roomKind: "public",
    channelType: "text",
    isProtected: false,
    unreadCount: 2,
    mentionUnreadCount: 1,
    hasMention: true,
    onlineCount: 312,
    mentorSlug: "platform",
    mentorName: "Platform",
    mentorInitials: "PP",
  },
  {
    id: "room-andra-hub",
    slug: "komunitas-andra-wicaksono",
    name: "Grup Mentor — AW",
    description:
      "Satu hub mentor dengan cabang publik (diskusi) dan privat (internal).",
    channelCategory: "Komunitas",
    roomKind: "mentor_community",
    tier: "Menengah",
    channelType: "text",
    isProtected: false,
    unreadCount: 3,
    mentionUnreadCount: 1,
    hasMention: true,
    onlineCount: 24,
    mentorId: "mentor-andra",
    mentorSlug: "andra-wicaksono",
    mentorName: "Andra Wicaksono, CFA",
    mentorInitials: "AW",
    mentorAvatarUrl: "/mentors/andra-wicaksono.png",
    lastReadMessageId: "msg-3",
    branches: [
      {
        id: "br-aw-1",
        slug: "pengumuman",
        name: "Pengumuman",
        mode: "one_way",
        senderPolicy: "mentor_only",
        visibility: "public",
        sortOrder: 0,
        isActive: true,
      },
      {
        id: "br-aw-2",
        slug: "diskusi",
        name: "Diskusi",
        mode: "two_way",
        senderPolicy: "mentor_only",
        visibility: "public",
        sortOrder: 1,
        isActive: true,
        unreadCount: 2,
        mentionUnreadCount: 1,
        hasMention: true,
      },
      {
        id: "br-aw-3",
        slug: "internal",
        name: "Internal",
        mode: "one_way",
        senderPolicy: "mentor_and_moderators",
        visibility: "private",
        sortOrder: 2,
        isActive: true,
      },
    ],
  },
  {
    id: "room-pemula-saham",
    slug: "komunitas-melati-putri",
    name: "Grup Mentor — MP",
    description: "Hub mentor dengan cabang publik 1 arah / 2 arah dan cabang privat.",
    channelCategory: "Komunitas",
    roomKind: "mentor_community",
    tier: "Pemula",
    channelType: "text",
    isProtected: false,
    unreadCount: 12,
    mentionUnreadCount: 2,
    hasMention: true,
    onlineCount: 156,
    mentorSlug: "melati-putri",
    mentorName: "Melati Putri",
    mentorInitials: "MP",
    mentorAvatarUrl: "/mentors/melati-putri.png",
    lastReadMessageId: "msg-p2",
    branches: [
      {
        id: "br-kom-1",
        slug: "pengumuman",
        name: "Pengumuman",
        mode: "one_way",
        senderPolicy: "mentor_only",
        visibility: "public",
        sortOrder: 0,
        isActive: true,
      },
      {
        id: "br-kom-2",
        slug: "diskusi",
        name: "Diskusi",
        mode: "two_way",
        senderPolicy: "mentor_only",
        visibility: "public",
        sortOrder: 1,
        isActive: true,
      },
      {
        id: "br-kom-3",
        slug: "internal",
        name: "Internal",
        mode: "one_way",
        senderPolicy: "mentor_and_moderators",
        visibility: "private",
        sortOrder: 2,
        isActive: true,
      },
    ],
  },
  {
    id: "room-menengah-crypto",
    slug: "komunitas-kirana",
    name: "Grup Mentor — KA",
    description: "On-chain analysis, manajemen risiko, dan review setup $BTC & altcoin.",
    channelCategory: "Komunitas",
    roomKind: "mentor_community",
    tier: "Menengah",
    channelType: "text",
    isProtected: false,
    unreadCount: 0,
    onlineCount: 89,
    mentorSlug: "kirana-ayu",
    mentorName: "Kirana Ayu",
    mentorInitials: "KA",
    mentorAvatarUrl: "/mentors/kirana-ayu.png",
    lastReadMessageId: "msg-c2",
    branches: [
      {
        id: "br-ka-1",
        slug: "pengumuman",
        name: "Pengumuman",
        mode: "one_way",
        senderPolicy: "mentor_only",
        visibility: "public",
        sortOrder: 0,
        isActive: true,
      },
      {
        id: "br-ka-2",
        slug: "diskusi",
        name: "Diskusi",
        mode: "two_way",
        senderPolicy: "mentor_only",
        visibility: "public",
        sortOrder: 1,
        isActive: true,
      },
      {
        id: "br-ka-3",
        slug: "internal",
        name: "Internal",
        mode: "one_way",
        senderPolicy: "mentor_and_moderators",
        visibility: "private",
        sortOrder: 2,
        isActive: true,
      },
    ],
  },
  {
    id: "room-mahir-forex",
    slug: "forex-mahir",
    name: "Forex Desk Mahir",
    description: "Analisis makro, korelasi DXY, dan setup EURUSD/USDJPY tingkat lanjut.",
    channelCategory: "Trading",
    roomKind: "mentor_community",
    tier: "Mahir",
    channelType: "text",
    slowModeSeconds: 30,
    isProtected: false,
    unreadCount: 5,
    onlineCount: 42,
    mentorSlug: "fajar-nugroho",
    mentorName: "Fajar Nugroho",
    mentorInitials: "FN",
    mentorAvatarUrl: "/mentors/fajar-nugroho.png",
    lastReadMessageId: "msg-f1",
  },
  {
    id: "room-pemula-crypto",
    slug: "crypto-pemula",
    name: "Belajar Crypto dari Nol",
    description: "Ruang aman untuk pemula belajar wallet, exchange, dan dasar charting.",
    channelCategory: "Komunitas",
    roomKind: "mentor_community",
    tier: "Pemula",
    channelType: "announcement",
    isReadOnly: true,
    isProtected: false,
    unreadCount: 2,
    onlineCount: 203,
    mentorSlug: "kirana-ayu",
    mentorName: "Kirana Ayu",
    mentorInitials: "KA",
    mentorAvatarUrl: "/mentors/kirana-ayu.png",
    lastReadMessageId: "msg-cp1",
  },
];

const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();

export const mockMessages: Record<string, ChatMessage[]> = {
  "room-andra-hub": [
    {
      id: "msg-1",
      roomId: "room-andra-hub",
      type: "announcement",
      content:
        "Selamat datang di ruang sinyal internal. Semua konten di sini bersifat rahasia dan dilindungi. Dilarang screenshot atau membagikan ke platform lain.",
      author: mockMembers[0],
      createdAt: minutesAgo(120),
      isPinned: true,
    },
    {
      id: "msg-2",
      roomId: "room-andra-hub",
      type: "signal",
      content: "Setup swing trade $BBCA — fundamental masih kuat, entry di support.",
      author: mockMembers[0],
      createdAt: minutesAgo(45),
      signal: {
        id: "sig-1",
        ticker: "BBCA",
        direction: "LONG",
        entry: 9850,
        target: 10200,
        stopLoss: 9600,
        instrument: "Saham",
        status: "ACTIVE",
        note: "Hold 2-4 minggu, cut loss ketat.",
      },
      reactions: [
        { emoji: "🔥", count: 8, userReacted: true },
        { emoji: "👍", count: 12 },
      ],
    },
    {
      id: "msg-3",
      roomId: "room-andra-hub",
      type: "text",
      content: "Terima kasih @andra! Saya sudah set alert di $BBCA 9.850.",
      author: mockMembers[2],
      createdAt: minutesAgo(40),
      mentions: ["m-1"],
      replyTo: {
        id: "msg-2",
        authorName: "Andra Wicaksono, CFA",
        preview: "Setup swing trade $BBCA...",
      },
    },
    {
      id: "msg-4",
      roomId: "room-andra-hub",
      type: "signal",
      content: "Short term scalp $BTC — momentum lemah di resistance.",
      author: mockMembers[1],
      createdAt: minutesAgo(15),
      signal: {
        id: "sig-2",
        ticker: "BTC",
        direction: "SHORT",
        entry: 68420,
        target: 66800,
        stopLoss: 69200,
        instrument: "Crypto",
        status: "ACTIVE",
      },
      reactions: [{ emoji: "📉", count: 5 }],
    },
    {
      id: "msg-5",
      roomId: "room-andra-hub",
      type: "poll",
      content: "Sentimen minggu ini untuk IHSG?",
      author: mockMembers[0],
      createdAt: minutesAgo(5),
      poll: {
        question: "Sentimen minggu ini untuk IHSG?",
        totalVotes: 47,
        options: [
          { id: "p1", label: "Bullish 📈", votes: 28 },
          { id: "p2", label: "Netral ➡️", votes: 12 },
          { id: "p3", label: "Bearish 📉", votes: 7 },
        ],
      },
    },
  ],
  "room-pemula-saham": [
    {
      id: "msg-p1",
      roomId: "room-pemula-saham",
      type: "announcement",
      content:
        "Jadwal live Q&A setiap Rabu jam 19:00 WIB. Siapkan pertanyaan seputar analisis fundamental! Info lengkap: https://www.idx.co.id",
      author: mockMembers[0],
      createdAt: minutesAgo(300),
      isPinned: true,
      embeds: [
        {
          url: "https://www.idx.co.id",
          title: "Bursa Efek Indonesia",
          description: "Informasi resmi pasar modal Indonesia, data IHSG, dan pengumuman BEI.",
          siteName: "IDX",
          color: "#1a4d8f",
        },
      ],
    },
    {
      id: "msg-p2",
      roomId: "room-pemula-saham",
      type: "text",
      content: "Kak, bedanya $TLKM dan $EXCL untuk pemula lebih baik fokus yang mana ya?",
      author: mockMembers[4],
      createdAt: minutesAgo(30),
    },
    {
      id: "msg-p3",
      roomId: "room-pemula-saham",
      type: "text",
      content:
        "Untuk pemula, $TLKM lebih likuid dan volatilitasnya lebih stabil. $EXCL bagus tapi perlu paham sektor telekom dulu. Cek chart di https://www.tradingview.com",
      author: mockMembers[0],
      createdAt: minutesAgo(25),
      editedAt: minutesAgo(24),
      replyTo: {
        id: "msg-p2",
        authorName: "Rizky Pratama",
        preview: "bedanya $TLKM dan $EXCL...",
      },
      mentions: ["m-5"],
      reactions: [{ emoji: "💡", count: 6, userReacted: true }],
      embeds: [
        {
          url: "https://www.tradingview.com",
          title: "TradingView — Chart & Analisis",
          description: "Platform charting interaktif untuk saham, crypto, dan forex.",
          siteName: "TradingView",
          color: "#2962ff",
        },
      ],
      attachments: [
        {
          id: "att-1",
          name: "analisis-tlkm.pdf",
          url: "#",
          type: "pdf",
          size: 245_000,
        },
      ],
    },
  ],
  "room-menengah-crypto": [
    {
      id: "msg-c1",
      roomId: "room-menengah-crypto",
      type: "text",
      content: "On-chain data $BTC menunjukkan akumulasi whale di 66k-68k. Worth watching.",
      author: mockMembers[1],
      createdAt: minutesAgo(60),
    },
    {
      id: "msg-c2",
      roomId: "room-menengah-crypto",
      type: "poll",
      content: "",
      author: mockMembers[1],
      createdAt: minutesAgo(20),
      poll: {
        question: "Alt season Q3 2026?",
        totalVotes: 63,
        options: [
          { id: "a1", label: "Ya, sudah mulai", votes: 22 },
          { id: "a2", label: "Belum, tunggu BTC dulu", votes: 31 },
          { id: "a3", label: "Tidak yakin", votes: 10 },
        ],
      },
    },
  ],
  "room-mahir-forex": [
    {
      id: "msg-f1",
      roomId: "room-mahir-forex",
      type: "signal",
      content: "EURUSD breakout — NFP data mendukung dollar weakness sementara.",
      author: mockMembers[0],
      createdAt: minutesAgo(90),
      signal: {
        id: "sig-f1",
        ticker: "EURUSD",
        direction: "LONG",
        entry: 1.085,
        target: 1.092,
        stopLoss: 1.081,
        instrument: "Forex",
        status: "CLOSED",
      },
    },
  ],
  "room-pemula-crypto": [
    {
      id: "msg-cp1",
      roomId: "room-pemula-crypto",
      type: "announcement",
      content:
        "📢 Pengumuman: Modul 1 — Pengenalan Blockchain sudah tersedia. Baca materi di https://www.investopedia.com sebelum sesi berikutnya.",
      author: mockMembers[1],
      createdAt: minutesAgo(10),
      isPinned: true,
      embeds: [
        {
          url: "https://www.investopedia.com",
          title: "Investopedia — Edukasi Investasi",
          description: "Artikel dan definisi istilah keuangan untuk investor pemula hingga mahir.",
          siteName: "Investopedia",
          color: "#2d6a4f",
        },
      ],
    },
  ],
};

export function getRoomBySlug(slug: string): ChatRoom | undefined {
  return mockRooms.find((r) => r.slug === slug);
}

export function getMessagesForRoom(roomId: string): ChatMessage[] {
  return mockMessages[roomId] ?? [];
}

export function getPinnedMessages(roomId: string): ChatMessage[] {
  return getMessagesForRoom(roomId).filter((m) => m.isPinned);
}

export function getMembersForRoom(_roomId: string): ChatMember[] {
  return mockMembers;
}

export const TICKER_SUGGESTIONS = [
  "BBCA",
  "TLKM",
  "ASII",
  "BBRI",
  "BMRI",
  "GOTO",
  "BTC",
  "ETH",
  "SOL",
  "EURUSD",
  "USDJPY",
  "GBPUSD",
  "XAUUSD",
];

export function searchMessagesInRoom(
  roomId: string,
  query: string
): ChatMessage[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return getMessagesForRoom(roomId).filter(
    (m) =>
      !m.isDeleted &&
      (m.content.toLowerCase().includes(q) ||
        m.author.name.toLowerCase().includes(q) ||
        m.signal?.ticker.toLowerCase().includes(q))
  );
}
