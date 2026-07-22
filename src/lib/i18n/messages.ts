/**
 * Prototype i18n message catalog — settings page + shared UI labels only.
 * Full app translation (100+ pages) is planned as future work; extend this file
 * or split by namespace as coverage grows.
 */
import type { Locale } from "./locale";

export type Messages = {
  common: {
    back: string;
    active: string;
    email: string;
    password: string;
    signIn: string;
    signUp: string;
    editProfile: string;
  };
  settings: {
    pageTitle: string;
    eyebrow: string;
    description: string;
    publicProfile: {
      title: string;
      description: string;
      editButton: string;
    };
    account: {
      title: string;
      signedOutDescription: string;
      signedInDescription: string;
      changePassword: string;
      accountNote: string;
      profileTitle: string;
      profileDescription: string;
      accountInfoTitle: string;
      accountInfoDescription: string;
      emailHint: string;
      changeEmail: string;
      accountStatus: string;
      memberSince: string;
      passwordTitle: string;
      passwordDescription: string;
      passwordMasked: string;
      passwordLastUpdated: string;
      currentPassword: string;
      currentPasswordPlaceholder: string;
      newPassword: string;
      newPasswordPlaceholder: string;
      confirmPassword: string;
      confirmPasswordPlaceholder: string;
      savePassword: string;
      cancel: string;
      passwordPrototypeNote: string;
      dangerZoneTitle: string;
      dangerZoneDescription: string;
      deactivateAccount: string;
      deleteAccount: string;
      openProfileTitle: string;
      openProfileDescription: string;
      openProfile: string;
    };
    devices: {
      title: string;
      description: string;
      signedOutDescription: string;
      sessionTitle: string;
      sessionDescription: string;
    };
    payment: {
      title: string;
      description: string;
      methodsTitle: string;
      methodsDescription: string;
      signedOutDescription: string;
    };
    appearance: {
      title: string;
      description: string;
    };
    language: {
      title: string;
      description: string;
      idLabel: string;
      idDescription: string;
      enLabel: string;
      enDescription: string;
      activeLocale: string;
      tabSectionTitle: string;
      tabSectionDescription: string;
    };
    tabs: {
      account: string;
      devices: string;
      payment: string;
      language: string;
    };
    theme: {
      dark: string;
      darkDescription: string;
      light: string;
      lightDescription: string;
      system: string;
      systemDescription: string;
      activeTheme: string;
      resolvedDark: string;
      resolvedLight: string;
    };
  };
};

const id: Messages = {
  common: {
    back: "Kembali",
    active: "Aktif",
    email: "Email",
    password: "Kata sandi",
    signIn: "Masuk",
    signUp: "Daftar",
    editProfile: "Edit profil",
  },
  settings: {
    pageTitle: "Pengaturan",
    eyebrow: "Preferensi",
    description: "Kelola akun, pembayaran, keamanan, dan preferensi tampilan platform.",
    publicProfile: {
      title: "Profil publik",
      description: "Foto, nama tampilan, dan bio dikelola di halaman profil terpisah.",
      editButton: "Edit profil",
    },
    account: {
      title: "Akun",
      signedOutDescription:
        "Masuk atau buat akun untuk menyimpan progres belajar dan mengakses dashboard.",
      signedInDescription: "Informasi login dan keamanan akunmu.",
      changePassword: "Ubah kata sandi",
      accountNote:
        "Perubahan email dan kata sandi akan tersedia segera. Edit profil publik di halaman profil.",
      profileTitle: "Profil publik",
      profileDescription: "Foto, nama tampilan, dan bio dikelola di halaman profil terpisah.",
      accountInfoTitle: "Informasi akun",
      accountInfoDescription: "Detail login dan status keanggotaanmu di Bursa.",
      emailHint: "Email digunakan untuk masuk dan notifikasi penting.",
      changeEmail: "Ubah email",
      accountStatus: "Status akun",
      memberSince: "Anggota sejak",
      passwordTitle: "Kata sandi",
      passwordDescription: "Perbarui kata sandi secara berkala untuk menjaga keamanan akun.",
      passwordMasked: "••••••••",
      passwordLastUpdated: "Terakhir diperbarui: hubungi support jika perlu reset.",
      currentPassword: "Kata sandi saat ini",
      currentPasswordPlaceholder: "Masukkan kata sandi saat ini",
      newPassword: "Kata sandi baru",
      newPasswordPlaceholder: "Minimal 8 karakter",
      confirmPassword: "Konfirmasi kata sandi baru",
      confirmPasswordPlaceholder: "Ulangi kata sandi baru",
      savePassword: "Simpan kata sandi",
      cancel: "Batal",
      passwordPrototypeNote:
        "Perubahan kata sandi dari halaman ini akan segera tersedia. Gunakan Lupa kata sandi jika perlu reset.",
      dangerZoneTitle: "Zona berbahaya",
      dangerZoneDescription:
        "Menonaktifkan atau menghapus akun akan menghapus akses ke progres belajar, chat, dan riwayat transaksi. Hubungi privacy@bursanalar.com untuk permintaan penghapusan akun.",
      deactivateAccount: "Nonaktifkan akun",
      deleteAccount: "Hapus akun",
      openProfileTitle: "Butuh mengubah profil publik?",
      openProfileDescription: "Foto, nama tampilan, dan bio ada di halaman profil.",
      openProfile: "Buka profil",
    },
    devices: {
      title: "Perangkat",
      description:
        "Satu akun hanya dapat aktif di maksimal {max} perangkat sekaligus. Keluar dari perangkat yang tidak kamu pakai untuk membuka slot di perangkat baru.",
      signedOutDescription: "Masuk untuk melihat perangkat yang terhubung ke akunmu.",
      sessionTitle: "Sesi perangkat",
      sessionDescription:
        "Daftar perangkat dan opsi keluar dari sesi jarak jauh akan tersedia di sini.",
    },
    payment: {
      title: "Pembayaran",
      description: "Metode pembayaran tersimpan dan riwayat tagihan kelas.",
      methodsTitle: "Metode pembayaran",
      methodsDescription:
        "Kelola kartu, e-wallet, dan riwayat pembelian akan ditambahkan di sini.",
      signedOutDescription:
        "Masuk untuk melihat metode pembayaran tersimpan dan riwayat transaksi.",
    },
    appearance: {
      title: "Tampilan",
      description: "Pilih mode gelap atau terang. Default platform adalah mode gelap cinematic.",
    },
    language: {
      title: "Bahasa aplikasi",
      description: "Pilih bahasa antarmuka. Default platform adalah Bahasa Indonesia.",
      idLabel: "Bahasa Indonesia",
      idDescription: "Default — seluruh label pengaturan dan UI umum",
      enLabel: "English",
      enDescription: "Interface labels in English",
      activeLocale: "Bahasa aktif",
      tabSectionTitle: "Bahasa & tampilan",
      tabSectionDescription:
        "Preferensi bahasa antarmuka dan mode gelap/terang platform.",
    },
    tabs: {
      account: "Akun",
      devices: "Perangkat",
      payment: "Pembayaran",
      language: "Bahasa",
    },
    theme: {
      dark: "Gelap",
      darkDescription: "Default — slate navy dengan aksen lavender",
      light: "Terang",
      lightDescription: "Lebih terang untuk membaca lama",
      system: "Sistem",
      systemDescription: "Ikuti preferensi perangkat",
      activeTheme: "Tema aktif",
      resolvedDark: "Gelap",
      resolvedLight: "Terang",
    },
  },
};

const en: Messages = {
  common: {
    back: "Back",
    active: "Active",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    signUp: "Sign up",
    editProfile: "Edit profile",
  },
  settings: {
    pageTitle: "Settings",
    eyebrow: "Preferences",
    description: "Manage your account, payments, security, and platform display preferences.",
    publicProfile: {
      title: "Public profile",
      description: "Photo, display name, and bio are managed on a separate profile page.",
      editButton: "Edit profile",
    },
    account: {
      title: "Account",
      signedOutDescription:
        "Sign in or create an account to save learning progress and access your dashboard.",
      signedInDescription: "Your login and account security information.",
      changePassword: "Change password",
      accountNote:
        "Email and password changes will be available soon. Edit your public profile on the profile page.",
      profileTitle: "Public profile",
      profileDescription: "Photo, display name, and bio are managed on a separate profile page.",
      accountInfoTitle: "Account information",
      accountInfoDescription: "Your login details and membership status on Bursa.",
      emailHint: "Email is used for sign-in and important notifications.",
      changeEmail: "Change email",
      accountStatus: "Account status",
      memberSince: "Member since",
      passwordTitle: "Password",
      passwordDescription: "Update your password regularly to keep your account secure.",
      passwordMasked: "••••••••",
      passwordLastUpdated: "Last updated: contact support if you need a reset.",
      currentPassword: "Current password",
      currentPasswordPlaceholder: "Enter your current password",
      newPassword: "New password",
      newPasswordPlaceholder: "At least 8 characters",
      confirmPassword: "Confirm new password",
      confirmPasswordPlaceholder: "Repeat new password",
      savePassword: "Save password",
      cancel: "Cancel",
      passwordPrototypeNote:
        "Password changes from this page will be available soon. Use Forgot password if you need a reset.",
      dangerZoneTitle: "Danger zone",
      dangerZoneDescription:
        "Deactivating or deleting your account removes access to learning progress, chat, and transaction history. Contact privacy@bursanalar.com to request account deletion.",
      deactivateAccount: "Deactivate account",
      deleteAccount: "Delete account",
      openProfileTitle: "Need to edit your public profile?",
      openProfileDescription: "Photo, display name, and bio are on the profile page.",
      openProfile: "Open profile",
    },
    devices: {
      title: "Devices",
      description:
        "One account can only be active on up to {max} devices at a time. Sign out from devices you no longer use to free a slot on a new device.",
      signedOutDescription: "Sign in to view devices connected to your account.",
      sessionTitle: "Device sessions",
      sessionDescription:
        "Device list and remote sign-out options will be available here.",
    },
    payment: {
      title: "Payment",
      description: "Saved payment methods and class billing history.",
      methodsTitle: "Payment methods",
      methodsDescription:
        "Manage cards, e-wallets, and purchase history will be added here.",
      signedOutDescription:
        "Sign in to view saved payment methods and transaction history.",
    },
    appearance: {
      title: "Appearance",
      description: "Choose dark or light mode. The platform default is cinematic dark mode.",
    },
    language: {
      title: "App language",
      description: "Choose the interface language. The platform default is Bahasa Indonesia.",
      idLabel: "Bahasa Indonesia",
      idDescription: "Default — settings labels and common UI copy",
      enLabel: "English",
      enDescription: "Interface labels in English",
      activeLocale: "Active language",
      tabSectionTitle: "Language & appearance",
      tabSectionDescription: "Interface language and platform dark/light mode preferences.",
    },
    tabs: {
      account: "Account",
      devices: "Devices",
      payment: "Payment",
      language: "Language",
    },
    theme: {
      dark: "Dark",
      darkDescription: "Default — slate navy with lavender accents",
      light: "Light",
      lightDescription: "Brighter for extended reading",
      system: "System",
      systemDescription: "Follow device preference",
      activeTheme: "Active theme",
      resolvedDark: "Dark",
      resolvedLight: "Light",
    },
  },
};

const catalog: Record<Locale, Messages> = { id, en };

export function getMessages(locale: Locale): Messages {
  return catalog[locale];
}
