import Link from "next/link";

import { DeveloperDocsNav } from "@/components/developer/docs-nav";
import { DOC_NAV_SECTIONS } from "@/lib/developer-docs/sections";

export const metadata = {
  title: "Developer Documentation",
  description:
    "Panduan lengkap arsitektur, auth/roles, chat, kursus, enrollment, dan setup lokal Bursa.",
};

function DocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function DocSub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground">
      {children}
    </code>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="text-foreground">{children}</strong>;
}

export default function DeveloperDocsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="eyebrow mb-2">Onboarding</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Developer Documentation
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Panduan lengkap agar developer baru memahami bagaimana website Bursa disusun: stack,
          role, auth, chat, kursus, enrollment, learning, pendapatan, API reference, konvensi
          error, environment variables, pembayaran, setup lokal, dan batasan privasi yang wajib
          dihormati. Gunakan kotak pencarian di samping (atau menu &ldquo;Daftar isi&rdquo; di
          mobile) untuk melompat ke bagian yang dicari.
        </p>
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <Strong>Komunitas diarsipkan (2026-07-14):</Strong> fitur chat/komunitas dinonaktifkan via{" "}
          <Code>NEXT_PUBLIC_KOMUNITAS_ENABLED=false</Code>. Mirror kode ada di{" "}
          <Code>_archive/komunitas/</Code> — lihat <Code>RESTORE-PROMPT.md</Code> untuk mengaktifkan
          kembali. Bagian &ldquo;Sistem chat&rdquo; di bawah mendokumentasikan arsitektur saat fitur
          masih aktif.
        </div>
      </div>

      <div className="gap-8 lg:flex">
        <DeveloperDocsNav sections={DOC_NAV_SECTIONS} />

        <div className="min-w-0 flex-1 space-y-10 lg:max-w-3xl">
          {/* ── 1. Architecture ───────────────────────────────────────── */}
      <DocSection id="arsitektur" title="1. Arsitektur overview">
        <p>
          Aplikasi hidup di folder <Code>Website/</Code>. Ini adalah prototype lanjutan: frontend
          premium + backend parsial (Prisma, API routes, admin, chat). Belum production-ready
          (belum NextAuth server-side, Midtrans real, atau video CDN).
        </p>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[28rem] text-left text-xs">
            <thead className="bg-muted/50 text-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Layer</th>
                <th className="px-3 py-2 font-medium">Teknologi</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="px-3 py-2 text-foreground">Framework</td>
                <td className="px-3 py-2">Next.js App Router + React 19 + TypeScript</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2 text-foreground">Styling</td>
                <td className="px-3 py-2">Tailwind CSS v4 + komponen UI (shadcn/Base UI)</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2 text-foreground">Database</td>
                <td className="px-3 py-2">
                  Prisma 6 + PostgreSQL (Neon) — dipakai untuk dev &amp; prod, lihat{" "}
                  <Code>prisma/schema.prisma</Code>
                </td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2 text-foreground">Validasi</td>
                <td className="px-3 py-2">Zod</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2 text-foreground">Animasi</td>
                <td className="px-3 py-2">motion</td>
              </tr>
            </tbody>
          </table>
        </div>

        <DocSub title="Struktur folder">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Code>src/app/</Code> — pages & API routes (katalog, komunitas, admin, mentor,
              developer, belajar, checkout)
            </li>
            <li>
              <Code>src/components/</Code> — UI domain (chat, admin, mentor, developer, auth,
              video, search)
            </li>
            <li>
              <Code>src/lib/</Code> — auth, chat, admin, video, pricing, db, validations
            </li>
            <li>
              <Code>prisma/schema.prisma</Code> — model DB (User, Course, ChatRoom, ChatBranch,
              Enrollment, Transaction, dll.)
            </li>
          </ul>
        </DocSub>

        <DocSub title="Pola data">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Auth prototype di browser: <Code>localStorage</Code> (
              <Code>lib/auth/client.ts</Code>)
            </li>
            <li>
              Persistensi server: Prisma/SQLite via <Code>lib/db</Code> + route handlers di{" "}
              <Code>src/app/api/*</Code>
            </li>
            <li>
              Fallback mock admin ada di <Code>lib/admin/mock.ts</Code> jika API gagal
            </li>
            <li>
              Identitas API sering di-bridge lewat header <Code>x-user-email</Code> (bukan cookie
              session)
            </li>
          </ul>
        </DocSub>
      </DocSection>

      {/* ── 2. Roles ──────────────────────────────────────────────── */}
      <DocSection id="roles" title="2. Empat user roles">
        <p>
          Tipe client: <Code>learner | mentor | admin | developer</Code> (
          <Code>lib/auth/types.ts</Code>). Enum Prisma:{" "}
          <Code>LEARNER | MENTOR | ADMIN | DEVELOPER</Code>. Helper akses:{" "}
          <Code>lib/auth/roles.ts</Code>.
        </p>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[32rem] text-left text-xs">
            <thead className="bg-muted/50 text-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Bisa akses</th>
                <th className="px-3 py-2 font-medium">Bisa mutasi</th>
                <th className="px-3 py-2 font-medium">Tidak boleh</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="px-3 py-2 font-mono text-foreground">learner</td>
                <td className="px-3 py-2">
                  Situs publik, dashboard, katalog, belajar (sesuai enrollment), komunitas publik +
                  hub yang di-subscribe
                </td>
                <td className="px-3 py-2">Profil, notes, Q&amp;A, review, chat di cabang yang diizinkan</td>
                <td className="px-3 py-2">Panel admin/mentor/developer; cabang privat; chat staf</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2 font-mono text-foreground">mentor</td>
                <td className="px-3 py-2">
                  <Code>/mentor/*</Code>, hub sendiri, cabang privat di hub-nya, kolaborasi staf
                  mentor↔admin
                </td>
                <td className="px-3 py-2">
                  Profil mentor, usulan kurikulum/cabang, chat domain (termasuk 1-arah)
                </td>
                <td className="px-3 py-2">CRUD admin langsung; hub mentor lain (fail-closed)</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2 font-mono text-foreground">admin</td>
                <td className="px-3 py-2">
                  <Code>/admin/*</Code> penuh + semua room discoverable
                </td>
                <td className="px-3 py-2">
                  Courses, kurikulum, users, mentors, rooms, moderasi, approve usulan, pendapatan
                </td>
                <td className="px-3 py-2">—</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2 font-mono text-foreground">developer</td>
                <td className="px-3 py-2">
                  <Code>/developer</Code>, view Admin &amp; Mentor (QC), komunitas publik
                </td>
                <td className="px-3 py-2">Tidak untuk data produksi / chat privat</td>
                <td className="px-3 py-2">
                  Cabang privat, <Code>mentor_internal</Code>, token admin API untuk mutasi
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <DocSub title="Navbar per role">
          <p>
            Area ke-4 di navbar memakai <Code>getRoleNavLinks()</Code>:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Admin → <Code>/admin</Code>
            </li>
            <li>
              Mentor → <Code>/mentor</Code>
            </li>
            <li>
              Developer → <Code>/developer</Code> + <Code>/developer/docs</Code>
            </li>
            <li>Learner → tidak ada link panel khusus</li>
          </ul>
        </DocSub>

        <DocSub title="Guard helpers">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Code>canAccessAdminPanel</Code> — admin + developer (view)
            </li>
            <li>
              <Code>canMutateAdmin</Code> — admin saja
            </li>
            <li>
              <Code>canAccessMentorPanel</Code> — mentor + developer (view)
            </li>
            <li>
              <Code>canMutateMentor</Code> — mentor saja
            </li>
            <li>
              <Code>isQcViewer</Code> — developer (banner QC, form read-only)
            </li>
          </ul>
        </DocSub>
      </DocSection>

      {/* ── 3. Auth ───────────────────────────────────────────────── */}
      <DocSection id="auth" title="3. Auth (client + Prisma bridge)">
        <p>
          Auth saat ini adalah <Strong>prototype client-side</Strong>, bukan NextAuth. Session
          disimpan di <Code>localStorage</Code> key <Code>bursa-session</Code>; daftar user mock di{" "}
          <Code>bursa-users</Code>.
        </p>

        <DocSub title="Alur login / register">
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              User login/daftar di <Code>/masuk</Code> atau <Code>/daftar</Code>
            </li>
            <li>
              <Code>lib/auth/client.ts</Code> menulis session ke localStorage dan memicu event{" "}
              <Code>bursa-auth-change</Code>
            </li>
            <li>
              <Code>AuthProvider</Code> menyebarkan session ke UI; <Code>RoleGuard</Code> /{" "}
              <Code>AdminGuard</Code> melindungi panel
            </li>
            <li>
              Saat butuh data server, client memanggil <Code>/api/auth/ensure-user</Code> atau API
              lain dengan header identitas
            </li>
          </ol>
        </DocSub>

        <DocSub title="Bridge ke Prisma">
          <p>
            ID di localStorage sering <Strong>berbeda</Strong> dari <Code>User.id</Code> di Prisma.
            Karena itu API menyelesaikan user lewat email:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Header wajib untuk banyak endpoint: <Code>x-user-email</Code>
            </li>
            <li>
              Helper chat: <Code>lib/chat/api.ts</Code> menempelkan header dari session
            </li>
            <li>
              <Code>/api/auth/ensure-user</Code> — membuat/menyembuhkan baris Prisma untuk akun
              localStorage-only
            </li>
            <li>
              Enroll &amp; join room memakai <Code>resolveRequestUser</Code> dengan{" "}
              <Code>createIfMissing: true</Code>
            </li>
          </ul>
        </DocSub>

        <DocSub title="Proteksi API admin">
          <p>
            <Code>requireAdmin</Code> di <Code>lib/admin/server.ts</Code> membaca{" "}
            <Code>x-user-email</Code>, lookup Prisma, dan hanya mengizinkan{" "}
            <Code>UserRole.ADMIN</Code>. Developer QC <Strong>tidak</Strong> mendapat token admin
            untuk mutasi meskipun bisa melihat UI panel.
          </p>
        </DocSub>
      </DocSection>

      {/* ── 4. Chat ───────────────────────────────────────────────── */}
      <DocSection id="chat" title="4. Sistem chat (diarsipkan — lihat banner atas)">
        <p>
          <Strong>Status:</Strong> dinonaktifkan 2026-07-14. Saat aktif, chat ada di{" "}
          <Code>/komunitas</Code> (+ <Code>/komunitas/[roomSlug]</Code>). Logika akses utama:{" "}
          <Code>lib/chat/access.ts</Code>, <Code>lib/chat/room-kinds.ts</Code>, model Prisma{" "}
          <Code>ChatRoom</Code> / <Code>ChatBranch</Code> / <Code>ChatRoomMember</Code>.
        </p>

        <DocSub title="Tiga jenis room (roomKind)">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[28rem] text-left text-xs">
              <thead className="bg-muted/50 text-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Kind</th>
                  <th className="px-3 py-2 font-medium">Arti</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-foreground">PUBLIC</td>
                  <td className="px-3 py-2">
                    Room platform terbuka, thread flat (tanpa cabang). Siapa pun yang login bisa ikut.
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-foreground">MENTOR_COMMUNITY</td>
                  <td className="px-3 py-2">
                    Satu hub per mentor. Privasi hidup di <Strong>cabang</Strong>, bukan di level
                    room.
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-foreground">MENTOR_INTERNAL</td>
                  <td className="px-3 py-2">
                    Kolaborasi staf (mentor↔admin), biasanya <Code>isStaffCollaboration</Code>.
                    Bukan grup gabungan semua mentor. Developer diblokir.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </DocSub>

        <DocSub title="Cabang (branches) di hub mentor">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Strong>Mode</Strong>: <Code>ONE_WAY</Code> (1 arah) vs <Code>TWO_WAY</Code> (2 arah)
            </li>
            <li>
              <Strong>1 arah</Strong>: hanya mentor (atau mentor+moderator sesuai{" "}
              <Code>senderPolicy</Code>) yang boleh kirim; member hanya baca
            </li>
            <li>
              <Strong>2 arah</Strong>: semua member yang bisa melihat cabang boleh kirim
            </li>
            <li>
              <Strong>Visibility</Strong>: <Code>PUBLIC</Code> (member hub) vs{" "}
              <Code>PRIVATE</Code> (hanya mentor pemilik / moderator — developer selalu diblokir)
            </li>
            <li>
              Default landing: prefer cabang publik 2-arah (
              <Code>pickDefaultBranchId</Code>)
            </li>
            <li>
              Perubahan struktur cabang oleh mentor → usulan ke admin (
              <Code>/mentor/chat</Code> → <Code>/admin/branch-change-requests</Code>)
            </li>
          </ul>
        </DocSub>

        <DocSub title="Membership & riwayat pesan">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Role member: <Code>MEMBER | MODERATOR | MENTOR</Code>
            </li>
            <li>
              Learner masuk hub otomatis saat enroll kelas mentor tersebut (
              <Code>ensureHubMembershipForCourseEnrollment</Code>)
            </li>
            <li>
              Riwayat: staf/owner/admin = full; member biasa = sejak <Code>joinedAt</Code>;
              non-member = kosong (<Code>resolveMessageHistoryScope</Code>)
            </li>
          </ul>
        </DocSub>

        <DocSub title="Unread, mentions, reactions, polls, signals">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Strong>Unread</Strong> — dihitung dari pesan setelah <Code>lastReadAt</Code>;
              endpoint <Code>POST /api/chat/rooms/[roomId]/read</Code>
            </li>
            <li>
              <Strong>Mentions</Strong> — user id di <Code>metadata.mentions</Code>; badge{" "}
              <Code>mentionUnreadCount</Code> di list room/cabang
            </li>
            <li>
              <Strong>Reactions</Strong> —{" "}
              <Code>POST .../messages/[messageId]/react</Code>
            </li>
            <li>
              <Strong>Polls</Strong> — <Code>/api/trading/polls</Code> + vote
            </li>
            <li>
              <Strong>Signals</Strong> — <Code>/api/trading/signals</Code> (kartu sinyal di chat)
            </li>
            <li>
              Realtime saat ini: <Strong>polling</Strong> (bukan WebSocket)
            </li>
            <li>
              Room internal/protected: anti-screenshot, watermark, blur (lihat komponen chat
              protected)
            </li>
          </ul>
        </DocSub>
      </DocSection>

      {/* ── 5. Courses ────────────────────────────────────────────── */}
      <DocSection id="kursus" title="5. Kursus / kurikulum & usulan mentor">
        <DocSub title="Admin CRUD">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              UI: <Code>/admin/courses</Code>, kurikulum di{" "}
              <Code>/admin/courses/[id]/curriculum</Code>
            </li>
            <li>
              API: <Code>/api/admin/courses</Code>, modules, lessons, upload video, curriculum
              snapshot
            </li>
            <li>
              Model: <Code>Course</Code> → <Code>Module</Code> → <Code>Lesson</Code> (
              <Code>isPreviewGratis</Code>, <Code>videoUrl</Code>, <Code>sortOrder</Code>)
            </li>
            <li>
              Admin juga mengelola mentors, users, chat rooms, moderasi konten
            </li>
          </ul>
        </DocSub>

        <DocSub title="Alur change-request (mentor → admin)">
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Mentor mengajukan usulan di <Code>/mentor/usulan</Code> (konten: course / module /
              lesson — create/update/delete)
            </li>
            <li>
              Data tersimpan sebagai <Code>CourseChangeRequest</Code> berstatus{" "}
              <Code>PENDING</Code>
            </li>
            <li>
              Admin meninjau di <Code>/admin/change-requests</Code> → approve / reject / edit
            </li>
            <li>
              Hanya setelah approve, perubahan diterapkan ke kurikulum live
            </li>
            <li>
              Usulan cabang chat: alur paralel di <Code>/mentor/chat</Code> →{" "}
              <Code>/admin/branch-change-requests</Code>
            </li>
            <li>
              Diskusi operasional: chat kolaborasi staf privat mentor↔admin (bukan untuk developer)
            </li>
          </ol>
        </DocSub>
      </DocSection>

      {/* ── 6. Enrollment ─────────────────────────────────────────── */}
      <DocSection id="enrollment" title="6. Enrollment, checkout & hub membership">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Learner membuka <Code>/kelas/[slug]</Code> lalu checkout mock di{" "}
            <Code>/checkout/[slug]</Code>
          </li>
          <li>
            Sukses → <Code>/checkout/sukses</Code>; client memanggil{" "}
            <Code>POST /api/courses/[courseSlug]/enroll</Code> dengan{" "}
            <Code>x-user-email</Code>
          </li>
          <li>
            Server: bridge user Prisma jika perlu → upsert <Code>Enrollment</Code>
          </li>
          <li>
            Enrollment pertama membuat <Code>Transaction</Code> status{" "}
            <Code>COMPLETED</Code> (untuk laporan pendapatan)
          </li>
          <li>
            <Code>ensureHubMembershipForCourseEnrollment</Code> menambahkan learner ke hub mentor
            kelas tersebut (<Code>ChatRoomMember</Code>)
          </li>
          <li>
            GET enroll juga “menyembuhkan” membership hub jika enrollment sudah ada tapi member
            chat terlewat
          </li>
        </ol>
        <p>
          Komisi platform indikatif <Strong>25%</Strong> (
          <Code>PLATFORM_COMMISSION_RATE</Code> di <Code>lib/pricing.ts</Code>) — dipakai di UI
          checkout &amp; breakdown pendapatan.
        </p>
      </DocSection>

      {/* ── 7. Learning ───────────────────────────────────────────── */}
      <DocSection id="belajar" title="7. Learning: video, notes, komentar, review">
        <p>
          Workspace belajar: <Code>/belajar/[courseId]/[lessonId]</Code> (
          <Code>LearningWorkspace</Code>).
        </p>

        <DocSub title="Akses video">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Strong>Gratis otomatis</Strong>: pelajaran pertama di modul pertama (
              <Code>isFreeModuleLesson</Code> di <Code>lib/video/lesson-access.ts</Code>)
            </li>
            <li>
              Atau flag eksplisit <Code>preview</Code> / <Code>isPreviewGratis</Code>
            </li>
            <li>
              Guest: hanya preview gratis; enrolled: akses penuh
            </li>
            <li>
              Berbayar: watermark, anti-screenshot, token dari{" "}
              <Code>/api/video/playback-token</Code>
            </li>
          </ul>
        </DocSub>

        <DocSub title="Fitur belajar lain">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Strong>Notes</Strong> — timestamp ke video; API{" "}
              <Code>/api/courses/.../notes</Code>
            </li>
            <li>
              <Strong>Q&amp;A / komentar pelajaran</Strong> — questions, replies, likes
            </li>
            <li>
              <Strong>Progress</Strong> — <Code>/api/courses/[slug]/progress</Code>
            </li>
            <li>
              <Strong>Reviews</Strong> — rating + komentar per course;{" "}
              <Code>/api/courses/[slug]/reviews</Code>
            </li>
            <li>
              Ringkasan belajar user: <Code>/api/me/learning</Code>
            </li>
          </ul>
        </DocSub>
      </DocSection>

      {/* ── 8. Revenue ────────────────────────────────────────────── */}
      <DocSection id="pendapatan" title="8. Admin pendapatan / revenue">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            UI: <Code>/admin/pendapatan</Code>
          </li>
          <li>
            API: <Code>GET /api/admin/pendapatan</Code> (butuh admin via{" "}
            <Code>requireAdmin</Code>)
          </li>
          <li>
            Sumber: baris <Code>Transaction</Code> (+ estimasi dari enrollment bila perlu) lewat{" "}
            <Code>buildRevenueReport</Code>
          </li>
          <li>
            Laporan: total, filter periode (semua / 30h / 90h), breakdown per course &amp; per
            mentor, komisi platform vs payout mentor
          </li>
          <li>
            Status line: <Code>COMPLETED | PENDING | FAILED | REFUNDED | ESTIMATED</Code>
          </li>
        </ul>
      </DocSection>

      {/* ── 9. Routes & API ───────────────────────────────────────── */}
      <DocSection id="routes" title="9. Key routes & API map">
        <DocSub title="Halaman utama">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[28rem] text-left text-xs">
              <thead className="bg-muted/50 text-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Route</th>
                  <th className="px-3 py-2 font-medium">Fungsi</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["/", "Landing"],
                  ["/katalog", "Katalog + search/filter"],
                  ["/kelas/[slug]", "Detail kelas"],
                  ["/belajar/...", "Video + notes + Q&A"],
                  ["/checkout/[slug]", "Checkout mock"],
                  ["/dashboard", "Dashboard learner"],
                  ["/komunitas", "Chat / komunitas"],
                  ["/instruktur/[slug]", "Profil mentor publik"],
                  ["/jadi-mentor", "Landing daftar mentor"],
                  ["/admin/*", "Panel admin"],
                  ["/mentor/*", "Panel mentor"],
                  ["/developer", "QC Hub"],
                  ["/developer/docs", "Dokumentasi ini"],
                  ["/masuk, /daftar", "Auth prototype"],
                ].map(([route, desc]) => (
                  <tr key={route} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-foreground">{route}</td>
                    <td className="px-3 py-2">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DocSub>

        <DocSub title="API (ringkas)">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Code>/api/auth/ensure-user</Code> — bridge localStorage → Prisma
            </li>
            <li>
              <Code>/api/chat/rooms</Code>, <Code>.../[roomId]</Code>, messages, join, members,
              read, react, live
            </li>
            <li>
              <Code>/api/trading/polls</Code>, <Code>/api/trading/signals</Code>
            </li>
            <li>
              <Code>/api/courses/[slug]/enroll</Code>, progress, reviews, notes, questions
            </li>
            <li>
              <Code>/api/video/playback-token</Code>
            </li>
            <li>
              <Code>/api/me/profile</Code>, avatar, learning
            </li>
            <li>
              <Code>/api/admin/*</Code> — courses, curriculum, mentors, users, chat-rooms,
              moderation, change-requests, branch-change-requests, pendapatan, stats,
              collaboration-chat
            </li>
            <li>
              <Code>/api/mentor/*</Code> — profile, courses, change-requests,
              branch-change-requests, chat-rooms, collaboration-chat, applications
            </li>
          </ul>
        </DocSub>
      </DocSection>

      {/* ── 10. API reference ─────────────────────────────────────── */}
      <DocSection id="api-reference" title="10. API reference lengkap">
        <p>
          Semua endpoint di bawah adalah route handler Next.js App Router (
          <Code>src/app/api/**/route.ts</Code>). Kecuali disebutkan lain, identitas dikirim lewat
          header <Code>x-user-email</Code> (bridge localStorage → Prisma, lihat §3). Body divalidasi
          dengan Zod (<Code>src/lib/validations</Code>, <Code>lib/auth/validation.ts</Code>).
        </p>

        <DocSub title="Auth (/api/auth/*)">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[36rem] text-left text-xs">
              <thead className="bg-muted/50 text-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Endpoint</th>
                  <th className="px-3 py-2 font-medium">Auth</th>
                  <th className="px-3 py-2 font-medium">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["POST /api/auth/register", "Publik", "Daftar learner baru. Rate limit 3/jam per IP. 409 jika email/username/phone duplikat."],
                  ["POST /api/auth/login", "Publik", "identifier (email/username/phone) + password. Rate limit 5/menit. Pesan error generik (anti-enumeration)."],
                  ["POST /api/auth/forgot-password", "Publik", "Selalu balas pesan generik yang sama baik email ada atau tidak. Rate limit 3/jam."],
                  ["GET /api/auth/reset-password", "Publik", "?token= — validasi token reset sebelum menampilkan form."],
                  ["POST /api/auth/reset-password", "Publik", "token + password baru. Rate limit 5/menit."],
                  ["GET /api/auth/check-username", "Publik", "?username= — { available: boolean } untuk form daftar/edit profil."],
                  ["GET /api/auth/oauth-status", "Publik", "{ google: boolean } — apakah Google OAuth dikonfigurasi (env terisi)."],
                  ["GET /api/auth/oauth-bridge", "NextAuth session", "Menjembatani sesi Google OAuth ke auth prototype client (localStorage)."],
                  ["* /api/auth/[...nextauth]", "—", "Handler NextAuth.js (Google provider), lihat src/auth.ts."],
                  ["POST /api/auth/ensure-user", "x-user-email (atau body)", "Bridge akun localStorage-only → baris Prisma (dipanggil setelah login/daftar)."],
                ].map(([ep, auth, desc]) => (
                  <tr key={ep} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-foreground">{ep}</td>
                    <td className="px-3 py-2">{auth}</td>
                    <td className="px-3 py-2">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DocSub>

        <DocSub title="Profil & akun (/api/me/*)">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Code>GET/PUT /api/me/profile</Code> — profil dasar (nama, bio, dsb.)
            </li>
            <li>
              <Code>POST /api/me/avatar</Code> — upload avatar (multipart form-data)
            </li>
            <li>
              <Code>GET /api/me/learning</Code> — ringkasan kelas yang sedang dipelajari
            </li>
            <li>
              <Code>GET /api/me/transactions</Code> — riwayat transaksi pembelian
            </li>
            <li>
              <Code>GET/POST /api/me/watchlist</Code>, <Code>DELETE .../[id]</Code> — watchlist
              ticker saham/crypto/forex; body <Code>{"{ ticker, instrument, notes? }"}</Code>
            </li>
            <li>
              <Code>GET/POST /api/me/playlists</Code>, <Code>GET/PUT/DELETE .../[slug]</Code> —
              koleksi lesson/course kustom milik user
            </li>
          </ul>
        </DocSub>

        <DocSub title="Kursus & pembelajaran (/api/courses/[courseSlug]/*)">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Code>POST /api/courses/[courseSlug]/enroll</Code> — enroll + healing hub membership
              (§6); <Code>GET</Code> untuk cek status enroll
            </li>
            <li>
              <Code>GET/POST /api/courses/[courseSlug]/progress</Code> — progres per lesson
            </li>
            <li>
              <Code>GET/POST /api/courses/[courseSlug]/reviews</Code> — rating + komentar (unik per
              user/course)
            </li>
            <li>
              <Code>GET/POST .../lessons/[lessonId]/notes</Code>,{" "}
              <Code>PUT/DELETE .../notes/[noteId]</Code> — catatan bertimestamp video
            </li>
            <li>
              <Code>GET/POST .../lessons/[lessonId]/questions</Code>,{" "}
              <Code>.../questions/[questionId]</Code>, <Code>.../like</Code>,{" "}
              <Code>.../replies</Code> — Q&amp;A per lesson (pin, like, balasan)
            </li>
          </ul>
        </DocSub>

        <DocSub title="Video">
          <p>
            <Code>POST /api/video/playback-token</Code> — body{" "}
            <Code>{"{ userId?, email?, courseId, lessonId, isPreview? }"}</Code>. Preview gratis
            (modul pertama, atau flag <Code>isPreviewGratis</Code>) tidak butuh login; konten
            berbayar butuh <Code>userId</Code> + enrollment terverifikasi (localStorage atau
            Prisma). Balasan berisi token bertanggal-kedaluwarsa + <Code>videoUrl</Code>.
          </p>
        </DocSub>

        <DocSub title="Chat (/api/chat/rooms/*) & trading">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Code>GET/POST /api/chat/rooms</Code>, <Code>GET .../[roomId]</Code>,{" "}
              <Code>POST .../join</Code>, <Code>GET .../members</Code>,{" "}
              <Code>DELETE .../members/[userId]</Code>
            </li>
            <li>
              <Code>GET/POST .../[roomId]/messages</Code>,{" "}
              <Code>PATCH/DELETE .../messages/[messageId]</Code>,{" "}
              <Code>POST .../messages/[messageId]/react</Code>
            </li>
            <li>
              <Code>POST .../[roomId]/read</Code> — update <Code>lastReadAt</Code> (unread counter)
            </li>
            <li>
              <Code>GET .../[roomId]/live</Code> — polling endpoint untuk pesan baru (bukan
              WebSocket)
            </li>
            <li>
              <Code>GET/POST /api/trading/polls</Code>,{" "}
              <Code>POST .../[pollId]/vote</Code> — polling di dalam chat
            </li>
            <li>
              <Code>GET/POST /api/trading/signals</Code> — kartu sinyal trading (entry/target/SL)
            </li>
          </ul>
        </DocSub>

        <DocSub title="Sesi 1-on-1 mentor (booking)">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Code>GET /api/mentors/[slug]/availability-slots</Code> — publik; daftar slot terbuka
              (belum dibooking, di masa depan) jika <Code>mentor.availableFor1on1</Code>
            </li>
            <li>
              <Code>POST /api/mentors/[slug]/availability-slots/[slotId]/book</Code> — butuh
              identitas (email); menandai slot <Code>isBooked</Code>, 409 jika sudah dibooking, 410
              jika sudah lewat waktu. Prototype: tidak ada pembayaran terpisah untuk sesi.
            </li>
            <li>
              Admin kelola slot: <Code>GET/POST /api/admin/mentors/[id]/availability-slots</Code>,{" "}
              <Code>PATCH/DELETE .../availability-slots/[slotId]</Code> (butuh{" "}
              <Code>requireAdmin</Code>)
            </li>
          </ul>
        </DocSub>

        <DocSub title="Admin (/api/admin/*) — requireAdmin, kecuali disebut lain">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Code>/api/admin/courses</Code> (+ <Code>[id]</Code>, <Code>modules</Code>,{" "}
              <Code>modules/[moduleId]/lessons</Code>, <Code>curriculum</Code>) — CRUD kurikulum
            </li>
            <li>
              <Code>/api/admin/uploads/thumbnail</Code>,{" "}
              <Code>/api/admin/uploads/video</Code> — multipart upload ke{" "}
              <Code>public/uploads/*</Code> (thumbnail: JPG/PNG/WebP/SVG, maks 5 MB)
            </li>
            <li>
              <Code>/api/admin/mentors</Code> (+ <Code>[id]</Code>) — CRUD profil mentor
            </li>
            <li>
              <Code>/api/admin/users</Code> (+ <Code>[id]</Code>) — kelola user &amp; role
            </li>
            <li>
              <Code>/api/admin/chat-rooms</Code> (+ <Code>[id]</Code>,{" "}
              <Code>[id]/members</Code>) — kelola room &amp; keanggotaan
            </li>
            <li>
              <Code>/api/admin/moderation</Code> (+ <Code>[id]</Code>) — antrian moderasi konten
              dilaporkan
            </li>
            <li>
              <Code>/api/admin/change-requests</Code>,{" "}
              <Code>/api/admin/branch-change-requests</Code> (+ <Code>[id]</Code>) — approve/reject
              usulan mentor (§5, §4)
            </li>
            <li>
              <Code>GET /api/admin/pendapatan</Code> — laporan revenue (§8);{" "}
              <Code>GET /api/admin/stats</Code> — ringkasan dashboard (total user, mentor, course,
              enrollment, revenue, room aktif, moderasi pending, aktivitas terbaru)
            </li>
            <li>
              <Code>/api/admin/collaboration-chat</Code> — chat kolaborasi staf admin↔mentor
              (<Code>isStaffCollaboration</Code>)
            </li>
            <li>
              <Code>requireAdminPanel</Code> (admin + developer, read) vs. <Code>requireAdmin</Code>{" "}
              (admin saja, mutasi) — lihat <Code>lib/admin/server.ts</Code>
            </li>
          </ul>
        </DocSub>

        <DocSub title="Mentor (/api/mentor/*) — role MENTOR">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Code>/api/mentor/profile</Code>, <Code>/api/mentor/courses</Code>
            </li>
            <li>
              <Code>/api/mentor/change-requests</Code>,{" "}
              <Code>/api/mentor/branch-change-requests</Code> — ajukan usulan (§5, §4)
            </li>
            <li>
              <Code>/api/mentor/chat-rooms</Code>,{" "}
              <Code>/api/mentor/collaboration-chat</Code> — hub sendiri + chat staf privat
            </li>
            <li>
              <Code>POST /api/mentor/applications</Code> — publik; formulir pendaftaran calon
              mentor (bukan mentor login), lihat <Code>lib/mentor-program/applications.ts</Code>
            </li>
          </ul>
        </DocSub>
      </DocSection>

      {/* ── 11. Error handling & conventions ──────────────────────── */}
      <DocSection id="konvensi-error" title="11. Error handling & konvensi API">
        <p>
          Konvensi umum ada di <Code>lib/api-utils.ts</Code>: <Code>jsonOk(data, status?)</Code>{" "}
          untuk respons sukses dan <Code>jsonError(message, status?)</Code> →{" "}
          <Code>{"{ error: message }"}</Code> untuk gagal. <Code>handleApiError(error)</Code>{" "}
          dipanggil di blok <Code>catch</Code> hampir semua route dan menstandardkan mapping error.
        </p>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[30rem] text-left text-xs">
            <thead className="bg-muted/50 text-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Kapan dipakai</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["400", "Payload tidak lengkap/salah bentuk (non-Zod)"],
                ["401", "Belum autentikasi (x-user-email hilang, sesi OAuth tidak ada)"],
                ["403", "Autentikasi ok tapi tidak diizinkan (bukan admin/mentor, cabang privat)"],
                ["404", "Entity tidak ditemukan (mentor, course, room, slot, dsb.)"],
                ["409", "Konflik (email/username dipakai, slot sudah dibooking)"],
                ["410", "Slot/resource sudah kedaluwarsa (mis. slot booking sudah lewat)"],
                ["422", "Validasi Zod gagal — pesan diambil dari ZodError.issues"],
                ["429", "Rate limit terlampaui (lihat checkRateLimit di bawah)"],
                ["500", "Error server tak terduga / Prisma"],
              ].map(([code, desc]) => (
                <tr key={code} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-foreground">{code}</td>
                  <td className="px-3 py-2">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DocSub title="Rate limiting (prototype, in-memory)">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Code>lib/auth/rate-limit.ts</Code> — sliding window sederhana per key (in-memory
              Map), key biasanya <Code>{"`aksi:${ip}`"}</Code> dari <Code>clientIp(request)</Code>
            </li>
            <li>Register: 3/jam · Login: 5/menit · Forgot/reset password: 3/jam &amp; 5/menit</li>
            <li>
              <Strong>Catatan produksi</Strong>: in-memory tidak scale di multi-instance (Vercel
              serverless) — rencana pindah ke Redis (<Code>@upstash/ratelimit</Code>) sebelum go
              live sungguhan
            </li>
          </ul>
        </DocSub>

        <DocSub title="Validasi & keamanan">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Body divalidasi Zod sebelum diproses; error Zod otomatis jadi status 422 lewat{" "}
              <Code>handleApiError</Code>
            </li>
            <li>
              Password di-hash bcrypt cost 12 (<Code>lib/auth/password-policy.ts</Code>); pesan
              login gagal generik (tidak membedakan email salah vs password salah — OWASP A07)
            </li>
            <li>
              Reset password: token disimpan sebagai hash saja (<Code>PasswordResetToken</Code>),
              single-use, ada <Code>expiresAt</Code>/<Code>usedAt</Code>
            </li>
            <li>
              Error Prisma umum (P2002 duplikat, P2003 referensi tidak valid, P2022 kolom belum
              migrasi) sudah dipetakan ke pesan yang manusiawi di <Code>handleApiError</Code>
            </li>
          </ul>
        </DocSub>
      </DocSection>

      {/* ── 12. Environment variables & deployment ────────────────── */}
      <DocSection id="env-deploy" title="12. Environment variables & deployment">
        <p>
          Lihat <Code>.env.example</Code> di root <Code>Website/</Code> untuk template lengkap.
          Database wajib PostgreSQL (Neon direkomendasikan) — <Strong>SQLite tidak berjalan di
          Vercel</Strong>, jadi gunakan Neon (atau Postgres lain) juga untuk dev lokal.
        </p>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[32rem] text-left text-xs">
            <thead className="bg-muted/50 text-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Variabel</th>
                <th className="px-3 py-2 font-medium">Wajib?</th>
                <th className="px-3 py-2 font-medium">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["DATABASE_URL", "Ya", "Neon pooled connection string (host mengandung -pooler)"],
                ["DIRECT_URL", "Ya", "Neon direct connection — dipakai prisma migrate deploy"],
                ["NEXTAUTH_SECRET / AUTH_SECRET", "Opsional*", "Wajib jika ingin login Google aktif; generate: npx auth secret"],
                ["NEXTAUTH_URL", "Opsional*", "URL publik situs, tanpa trailing slash (mis. https://bursa.example.com)"],
                ["GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET", "Opsional*", "OAuth 2.0 Client dari Google Cloud Console — tanpa ini, tombol Google disembunyikan (oauth-status)"],
              ].map(([name, req, desc]) => (
                <tr key={name} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-foreground">{name}</td>
                  <td className="px-3 py-2">{req}</td>
                  <td className="px-3 py-2">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs">
          *Opsional untuk build/prototype, tapi tanpa keempatnya alur &ldquo;Lanjutkan dengan
          Google&rdquo; tidak berfungsi.
        </p>

        <DocSub title="Build & deploy (Vercel)">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Build command project: <Code>prisma generate &amp;&amp; prisma migrate deploy &amp;&amp;
              next build</Code> (lihat <Code>package.json</Code> → <Code>scripts.build</Code>) —
              migrasi Prisma otomatis dijalankan setiap deploy
            </li>
            <li>
              Set <Code>DATABASE_URL</Code> + <Code>DIRECT_URL</Code> (dan variabel Google OAuth
              jika dipakai) di Vercel Project Settings → Environment Variables sebelum deploy
              pertama
            </li>
            <li>
              <Code>postinstall</Code> menjalankan <Code>prisma generate</Code> otomatis saat{" "}
              <Code>npm install</Code>
            </li>
            <li>
              Setelah deploy, verifikasi lewat halaman ini (
              <Code>/developer/docs</Code>) dan QC Hub (<Code>/developer</Code>) sebelum
              mengumumkan rilis ke tim
            </li>
          </ul>
        </DocSub>
      </DocSection>

      {/* ── 13. Payment / checkout ─────────────────────────────────── */}
      <DocSection id="pembayaran" title="13. Pembayaran & checkout (mock)">
        <p>
          Checkout saat ini adalah <Strong>simulasi</Strong> (<Code>checkout-form.tsx</Code>) —
          tidak ada payment gateway sungguhan yang terhubung. Memilih metode pembayaran lalu
          &ldquo;bayar&rdquo; langsung membuat <Code>Enrollment</Code> + <Code>Transaction</Code>{" "}
          status <Code>COMPLETED</Code> (§6), tanpa redirect ke provider eksternal.
        </p>

        <DocSub title="Metode pembayaran yang ditampilkan (lib/payment/methods.ts)">
          <ul className="list-disc space-y-1 pl-5">
            <li>E-wallet: GoPay, OVO, DANA</li>
            <li>Transfer Virtual Account (BCA, Mandiri, BNI, BRI, dll.)</li>
            <li>Kartu Kredit/Debit (Visa, Mastercard, JCB)</li>
            <li>QRIS</li>
          </ul>
        </DocSub>

        <DocSub title="Belum ada — jangan asumsikan sudah terhubung">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Strong>Tidak ada webhook pembayaran</Strong> — tidak ada route{" "}
              <Code>/api/webhooks/*</Code> atau callback dari payment gateway di codebase saat ini
            </li>
            <li>
              Integrasi Midtrans (atau gateway Indonesia lain) masih rencana — komentar di{" "}
              <Code>lib/payment/methods.ts</Code> menyebut &ldquo;selaras dengan integrasi Midtrans
              (P3)&rdquo; sebagai fase mendatang, belum diimplementasikan
            </li>
            <li>
              Saat mengimplementasikan gateway sungguhan: tambahkan endpoint webhook terpisah yang
              memverifikasi signature dari provider, lalu update <Code>Transaction.status</Code>{" "}
              (dan hindari mempercayai status dari client)
            </li>
          </ul>
        </DocSub>

        <DocSub title="Booking sesi 1-on-1 mentor">
          <p>
            Booking slot mentor (§10, &ldquo;Sesi 1-on-1 mentor&rdquo;) juga{" "}
            <Strong>tidak</Strong> memicu pembayaran terpisah di API — slot langsung ditandai{" "}
            <Code>isBooked</Code> saat learner booking. <Code>sessionPrice</Code> di profil mentor
            saat ini hanya label informasi di UI.
          </p>
        </DocSub>
      </DocSection>

      {/* ── 14. Setup ─────────────────────────────────────────────── */}
      <DocSection id="setup" title="14. Setup lokal">
        <p>
          Kerjakan dari folder <Code>Website/</Code>. Pastikan Node.js terpasang.
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <Code>npm install</Code>
          </li>
          <li>
            Salin <Code>.env.example</Code> → <Code>.env</Code> (atau <Code>.env.local</Code>) dan
            isi <Code>DATABASE_URL</Code> + <Code>DIRECT_URL</Code> dengan connection string Neon
            PostgreSQL (§12) — buat project gratis di{" "}
            <Link
              href="https://neon.tech"
              className="text-primary underline-offset-2 hover:underline"
            >
              neon.tech
            </Link>
          </li>
          <li>
            <Code>npm run db:generate</Code> — generate Prisma Client
          </li>
          <li>
            <Code>npm run db:migrate</Code> — jalankan migrasi
          </li>
          <li>
            <Code>npm run db:seed</Code> — data demo + akun test
          </li>
          <li>
            <Code>npm run dev</Code> — buka{" "}
            <Link
              href="http://localhost:3000"
              className="text-primary underline-offset-2 hover:underline"
            >
              http://localhost:3000
            </Link>
          </li>
        </ol>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[24rem] text-left text-xs">
            <thead className="bg-muted/50 text-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Script</th>
                <th className="px-3 py-2 font-medium">Kegunaan</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["npm run db:generate", "prisma generate"],
                ["npm run db:migrate", "prisma migrate dev"],
                ["npm run db:seed", "tsx prisma/seed.ts"],
                ["npm run db:studio", "Prisma Studio GUI"],
                ["npm run lint", "ESLint"],
              ].map(([cmd, use]) => (
                <tr key={cmd} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-foreground">{cmd}</td>
                  <td className="px-3 py-2">{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DocSub title="Catatan Windows: Prisma file lock (EPERM)">
          <p>
            Di Windows, <Code>prisma generate</Code> sering gagal dengan <Code>EPERM</Code> /
            tidak bisa menimpa <Code>query_engine-windows.dll.node</Code> karena proses{" "}
            <Code>node</Code> (biasanya <Code>npm run dev</Code>) masih mengunci file di{" "}
            <Code>node_modules/.prisma</Code>.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Strong>Stop dulu</Strong> dev server (Ctrl+C) dan tutup Prisma Studio jika terbuka
            </li>
            <li>
              Jalankan ulang <Code>npm run db:generate</Code>, lalu <Code>npm run dev</Code>
            </li>
            <li>
              Jika masih terkunci: Task Manager → end proses <Code>node.exe</Code> yang nyangkut,
              atau restart terminal
            </li>
            <li>
              Path workspace mengandung spasi — quote path bila menjalankan perintah di luar
              folder proyek
            </li>
          </ul>
        </DocSub>
      </DocSection>

      {/* ── 15. Privacy ───────────────────────────────────────────── */}
      <DocSection id="privasi" title="15. Aturan privasi (wajib)">
        <p>
          Privasi chat mentor ada di <Strong>cabang (branch)</Strong>, bukan “room privat”
          terpisah untuk hub. Aturan di <Code>lib/chat/access.ts</Code> dan{" "}
          <Code>lib/chat/room-kinds.ts</Code>:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Role <Code>developer</Code> <Strong>tidak boleh</Strong> melihat atau mengirim di
            cabang <Code>visibility: private</Code>
          </li>
          <li>
            Developer juga diblokir dari chat kolaborasi staf (
            <Code>mentor_internal</Code> / <Code>isStaffCollaboration</Code>) — satu thread privat
            mentor↔admin, bukan grup semua mentor
          </li>
          <li>
            Cabang privat disembunyikan di tab chat; room staf dikunci di komunitas / sidebar / QC
          </li>
          <li>
            Mentor pemilik hub (atau moderator) boleh mengakses cabang privat di grup mereka
          </li>
          <li>
            Learner hanya melihat room publik + hub yang di-subscribe; tidak melihat internal
          </li>
          <li>
            Mentor hanya melihat publik + hub yang dimiliki/dimoderasi (privasi antar-mentor)
          </li>
          <li>
            <Strong>Jangan</Strong> menambah bypass QC ke pesan cabang privat — ini hard
            requirement produk
          </li>
        </ul>
      </DocSection>

      {/* ── 16. Demo accounts ─────────────────────────────────────── */}
      <DocSection id="demo" title="16. Akun test">
        <p>
          Di-seed lewat <Code>prisma/seed.ts</Code> dan juga di-seed ke localStorage client.
          Password default kecuali disebutkan: <Code>password123</Code>.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[24rem] text-left text-xs">
            <thead className="bg-muted/50 text-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Password</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="px-3 py-2 font-mono text-foreground">learner@test.dev</td>
                <td className="px-3 py-2">learner</td>
                <td className="px-3 py-2 font-mono">password123</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2 font-mono text-foreground">mentor@test.dev</td>
                <td className="px-3 py-2">mentor</td>
                <td className="px-3 py-2 font-mono">password123</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2 font-mono text-foreground">admin@test.dev</td>
                <td className="px-3 py-2">admin</td>
                <td className="px-3 py-2 font-mono">password123</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2 font-mono text-foreground">developer@test.dev</td>
                <td className="px-3 py-2">developer</td>
                <td className="px-3 py-2 font-mono">password123</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2 font-mono text-foreground">demo@bursa.id</td>
                <td className="px-3 py-2">learner (demo)</td>
                <td className="px-3 py-2 font-mono">demo1234</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Heuristik email di client: <Code>@dev.bursa.dev</Code> → developer,{" "}
          <Code>@mentor.bursa.dev</Code> → mentor (lihat <Code>roleForEmail</Code>).
        </p>
      </DocSection>

      {/* ── QC checklist ──────────────────────────────────────────── */}
      <DocSection id="qc" title="Alur QC developer">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Login sebagai developer → buka{" "}
            <Link
              href="/developer"
              className="text-primary underline-offset-2 hover:underline"
            >
              QC Hub
            </Link>
            .
          </li>
          <li>Tinjau Admin Panel dan Mentor Panel (banner QC; form mentor read-only).</li>
          <li>Uji alur learner: beranda → katalog → checkout → belajar → komunitas publik.</li>
          <li>
            Pastikan cabang privat / chat staf tidak bisa dibuka dan tidak menampilkan pesan.
          </li>
          <li>Laporkan bug UX/regresi tanpa menyalin konten chat privat.</li>
        </ol>
        <p className="pt-2">
          Kembali ke{" "}
          <Link
            href="/developer"
            className="text-primary underline-offset-2 hover:underline"
          >
            QC Hub
          </Link>
          .
        </p>
      </DocSection>
        </div>
      </div>
    </div>
  );
}
