export const PILOT_SERVICE = {
  code: "surat-keterangan-usaha",
  name: "Surat Keterangan Usaha",
  description: "Pengajuan awal Surat Keterangan Usaha untuk warga Benteng Selatan.",
  requirements: [
    "Data pemohon dan alamat harus sesuai dokumen kependudukan.",
    "Data usaha harus lengkap dan dapat diverifikasi petugas.",
    "KTP/KK asli atau salinan dibawa ketika petugas meminta verifikasi.",
  ],
} as const;

export const REQUEST_STATUSES = [
  "submitted",
  "under_review",
  "revision_required",
  "verified",
  "approved",
  "rejected",
  "completed",
] as const;

export type ServiceRequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  submitted: "Sudah diajukan",
  under_review: "Sedang diperiksa",
  revision_required: "Perlu diperbaiki",
  verified: "Data terverifikasi",
  approved: "Disetujui",
  rejected: "Ditolak",
  completed: "Selesai",
};

export const CONTRIBUTION_TYPES = ["umkm", "tourism", "map"] as const;
export type ContributionType = (typeof CONTRIBUTION_TYPES)[number];

export const CONTRIBUTION_TYPE_LABELS: Record<ContributionType, string> = {
  umkm: "UMKM",
  tourism: "Kabar / kegiatan",
  map: "Lokasi peta",
};

export const SUBMISSION_STATUSES = [
  "submitted",
  "under_review",
  "revision_required",
  "approved",
  "published",
  "rejected",
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  submitted: "Sudah diajukan",
  under_review: "Sedang diperiksa",
  revision_required: "Perlu diperbaiki",
  approved: "Disetujui",
  published: "Sudah diterbitkan",
  rejected: "Ditolak",
};

export interface PublicCitizen {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
}

export interface CitizenRequestSummary {
  id: string;
  requestNumber: string;
  serviceCode: string;
  serviceName: string;
  status: ServiceRequestStatus;
  applicantName: string;
  updatedAt: string;
  submittedAt: string;
}

export interface CitizenSubmissionSummary {
  id: string;
  submissionNumber: string;
  type: ContributionType;
  status: SubmissionStatus;
  title: string;
  reviewNote: string;
  updatedAt: string;
}
