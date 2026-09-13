/** Public legal imprint  -  SSOT vault: Documentation/Legal/Kontrak/06 - Identitas Badan Hukum Bursanalar (PT GMM).md */

export const LEGAL_ENTITY = {
  legalName: "PT Global Makmur Madani",
  brand: "Bursa",
  productName: "Bursanalar",
  registrationNumber: "1846773",
  streetAddress: "Gedung Menara 165 Lantai 4, Jalan TB Simatupang Kav. 1",
  city: "Jakarta Selatan",
  country: "ID",
  managers: ["Raden Mohammad (esa) Kaisar Khan", "Fakhri Muzakki, FMVA"] as const,
} as const;

const managersId = LEGAL_ENTITY.managers.join(" dan ");
const managersEn = LEGAL_ENTITY.managers.join(" and ");
const addressLine = `${LEGAL_ENTITY.streetAddress}, ${LEGAL_ENTITY.city}`;

export const legalEntityCopy = {
  id: {
    imprintShort: `Menaungi ${LEGAL_ENTITY.productName}. Pendiri: ${managersId}.`,
    imprintBlock: `${LEGAL_ENTITY.productName} dinaungi oleh ${LEGAL_ENTITY.legalName}, perseroan terbatas Indonesia (nomor registrasi ${LEGAL_ENTITY.registrationNumber}), berkedudukan di ${addressLine}. ${LEGAL_ENTITY.productName} didirikan oleh ${managersId}; keduanya mengurusi kegiatan usaha platform.`,
    footerCopyright: `© ${new Date().getFullYear()} ${LEGAL_ENTITY.legalName}`,
    aboutTitle: "Badan hukum",
    helpQuestion: "Siapa yang mendirikan dan mengoperasikan Bursa?",
    helpAnswer: `${LEGAL_ENTITY.legalName} menaungi merek Bursa / ${LEGAL_ENTITY.productName}. Pendiri ${LEGAL_ENTITY.productName}: ${managersId}. Keduanya mengurusi kegiatan usaha platform. Bursa bukan PUJK, broker, atau penasihat investasi.`,
  },
  en: {
    imprintShort: `Operates ${LEGAL_ENTITY.productName}. Management: ${managersEn}.`,
    imprintBlock: `${LEGAL_ENTITY.productName} is operated under ${LEGAL_ENTITY.legalName}, an Indonesian limited liability company (registration number ${LEGAL_ENTITY.registrationNumber}), at ${LEGAL_ENTITY.streetAddress}, South Jakarta. Day-to-day management of ${LEGAL_ENTITY.productName} is by ${managersEn}.`,
    footerCopyright: `© ${new Date().getFullYear()} ${LEGAL_ENTITY.legalName}`,
  },
} as const;
