import type { SocialDashboard } from "@/lib/types";

export function percentage(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return (value / total) * 100;
}

export function formatPercentage(value: number, total: number): string {
  return `${percentage(value, total).toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;
}

export function socialDashboardTotals(data: SocialDashboard) {
  return {
    pbiJk: data.pbiJk.yes + data.pbiJk.no,
    pkh: data.pkh.no + data.pkh.family + data.pkh.administrator,
    sembako: data.sembako.no + data.sembako.family + data.sembako.administrator,
    deciles: data.deciles.d1 + data.deciles.d2 + data.deciles.d3 + data.deciles.d4 + data.deciles.d5,
    pkhRecipients: data.pkh.family + data.pkh.administrator,
    sembakoRecipients: data.sembako.family + data.sembako.administrator,
  };
}

export function validateSocialDashboard(data: SocialDashboard): string[] {
  const errors: string[] = [];
  const numericValues = [
    data.totalRecords,
    data.pbiJk.yes,
    data.pbiJk.no,
    data.pkh.no,
    data.pkh.family,
    data.pkh.administrator,
    data.sembako.no,
    data.sembako.family,
    data.sembako.administrator,
    data.deciles.d1,
    data.deciles.d2,
    data.deciles.d3,
    data.deciles.d4,
    data.deciles.d5,
  ];

  if (!Number.isInteger(data.totalRecords) || data.totalRecords <= 0) {
    errors.push("Total basis data harus berupa bilangan bulat lebih dari 0.");
  }
  if (numericValues.some((value) => !Number.isFinite(value) || value < 0 || !Number.isInteger(value))) {
    errors.push("Seluruh jumlah kategori harus berupa bilangan bulat dan tidak boleh negatif.");
  }

  const totals = socialDashboardTotals(data);
  const comparisons: [string, number][] = [
    ["PBI-JK", totals.pbiJk],
    ["PKH", totals.pkh],
    ["Sembako", totals.sembako],
    ["Desil", totals.deciles],
  ];
  for (const [label, total] of comparisons) {
    if (total !== data.totalRecords) {
      errors.push(`Jumlah kategori ${label} adalah ${total.toLocaleString("id-ID")}, sedangkan total basis data ${data.totalRecords.toLocaleString("id-ID")}.`);
    }
  }

  if (data.status === "published" && !data.period.trim()) {
    errors.push("Periode data wajib diisi sebelum dipublikasikan.");
  }
  if (data.status === "published" && !data.source.trim()) {
    errors.push("Sumber data wajib diisi sebelum dipublikasikan.");
  }
  return errors;
}
