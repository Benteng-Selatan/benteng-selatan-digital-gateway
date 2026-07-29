import { getSiteData } from "@/lib/cms";

const suspiciousPatterns: { label: string; pattern: RegExp }[] = [
  { label: "placeholder dalam kurung siku", pattern: /\[[^\]]*(?:belum|isi|nama|alamat|kontak)[^\]]*\]/i },
  { label: "teks belum diisi", pattern: /\bbelum\s+(?:diisi|tersedia|diverifikasi|diperbarui)\b/i },
  { label: "data contoh", pattern: /\b(?:data|konten|umkm|fasilitas|layanan)\s+contoh\b/i },
  { label: "narasi prototipe", pattern: /\b(?:portal informasi awal|narasi final|layanan daring pilot|persyaratan awal)\b/i },
  { label: "catatan internal publikasi", pattern: /\b(?:izin publikasi|izin untuk dipublikasikan|setelah memperoleh data resmi)\b/i },
];

type Finding = {
  path: string;
  label: string;
  value: string;
};

function inspect(value: unknown, path: string, findings: Finding[]): void {
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return;
    for (const candidate of suspiciousPatterns) {
      if (candidate.pattern.test(normalized)) {
        findings.push({
          path,
          label: candidate.label,
          value: normalized.slice(0, 180),
        });
      }
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => inspect(item, `${path}[${index}]`, findings));
    return;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (record.status === "draft") return;
    for (const [key, child] of Object.entries(record)) {
      inspect(child, path ? `${path}.${key}` : key, findings);
    }
  }
}

async function main() {
  const data = await getSiteData();
  const findings: Finding[] = [];
  inspect(data, "siteData", findings);

  if (findings.length === 0) {
    console.log("Official-content readiness: OK");
    return;
  }

  console.error(`Official-content readiness: ditemukan ${findings.length} indikasi placeholder.`);
  for (const finding of findings) {
    console.error(`- ${finding.path}: ${finding.label} -> ${JSON.stringify(finding.value)}`);
  }
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
