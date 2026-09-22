/**
 * IDX (Bursa Efek Indonesia) ticker list for auto-complete.
 * Source: Top liquid stocks on BEI.
 */

export interface IdxTicker {
  symbol: string;
  name: string;
}

export const IDX_TICKERS: IdxTicker[] = [
  { symbol: "BBCA", name: "Bank Central Asia" },
  { symbol: "BBRI", name: "Bank Rakyat Indonesia" },
  { symbol: "BBNI", name: "Bank Negara Indonesia" },
  { symbol: "BMRI", name: "Bank Mandiri" },
  { symbol: "BBKP", name: "Bank Bukopin" },
  { symbol: "BBTN", name: "Bank Tabungan Negara" },
  { symbol: "BNGA", name: "Bank CIMB Niaga" },
  { symbol: "BNII", name: "Bank Mayapada" },
  { symbol: "TLKM", name: "Telkom Indonesia" },
  { symbol: "ASII", name: "Astra International" },
  { symbol: "GGRM", name: "Gudang Garam" },
  { symbol: "UNVR", name: "Unilever Indonesia" },
  { symbol: "ICBP", name: "Indofood CBP" },
  { symbol: "MBTO", name: "Mayora Indah" },
  { symbol: "ADRO", name: "Adaro Energy" },
  { symbol: "ANTM", name: "Aneka Tambang" },
  { symbol: "PGAS", name: "Perusahaan Gas Negara" },
  { symbol: "TPIA", name: "Chandra Asri Petrochemical" },
  { symbol: "UNTR", name: "United Tractors" },
  { symbol: "INDF", name: "Indofood Sukses Makmur" },
  { symbol: "SMGR", name: "Semen Indonesia" },
  { symbol: "KLBF", name: "Kalbe Farma" },
  { symbol: "INCO", name: "Vale Indonesia" },
  { symbol: "TINS", name: "Timah" },
  { symbol: "INTP", name: "Indocement" },
  { symbol: "ISAT", name: "Indosat" },
  { symbol: "EXCL", name: "XL Axiata" },
  { symbol: "HMSP", name: "HM Sampoerna" },
  { symbol: "AKRA", name: "AKR Corporindo" },
  { symbol: "MEDC", name: "Medco Energi" },
  { symbol: "MIKA", name: "Mitra Keluarga Karya" },
  { symbol: "MPPA", name: "Map Boga Adiperkasa" },
  { symbol: "PWON", name: "Pakuwon Jati" },
  { symbol: "PTBA", name: "Bukit Asam" },
  { symbol: "JPFA", name: "Japfa Comfeed" },
];
