import type { PopulationDashboard } from "@/lib/types";

export function populationDashboardTotals(data: PopulationDashboard) {
  return {
    gender: data.male + data.female,
    ages: data.ageGroups.reduce((sum, item) => sum + item.value, 0),
    rwPopulation: data.neighborhoods.reduce((sum, item) => sum + item.total, 0),
    rwMale: data.neighborhoods.reduce((sum, item) => sum + item.male, 0),
    rwFemale: data.neighborhoods.reduce((sum, item) => sum + item.female, 0),
    rwHouseholds: data.neighborhoods.reduce((sum, item) => sum + item.households, 0),
    rwRt: data.neighborhoods.reduce((sum, item) => sum + item.rt, 0),
  };
}

export function validatePopulationDashboard(data: PopulationDashboard): string[] {
  const errors: string[] = [];
  const integers = [
    data.totalPopulation,
    data.male,
    data.female,
    data.households,
    data.totalRt,
    data.totalRw,
    ...data.ageGroups.map((item) => item.value),
    ...data.neighborhoods.flatMap((item) => [item.rt, item.male, item.female, item.total, item.households]),
  ];

  if (integers.some((value) => !Number.isInteger(value) || value < 0)) {
    errors.push("Seluruh angka kependudukan harus berupa bilangan bulat dan tidak boleh negatif.");
  }
  if (data.totalPopulation <= 0) errors.push("Total penduduk harus lebih dari 0.");
  if (data.totalRw <= 0 || data.neighborhoods.length !== data.totalRw) {
    errors.push(`Jumlah baris RW (${data.neighborhoods.length}) harus sama dengan total RW (${data.totalRw}).`);
  }
  if (data.ageGroups.length < 1 || data.ageGroups.length > 12) {
    errors.push("Kelompok usia harus berjumlah 1 sampai 12 kelompok.");
  }

  const ageIds = new Set<string>();
  for (const item of data.ageGroups) {
    if (!item.id.trim() || ageIds.has(item.id)) errors.push("ID kelompok usia harus unik dan tidak boleh kosong.");
    ageIds.add(item.id);
    if (!item.label.trim()) errors.push("Label kelompok usia wajib diisi.");
  }

  const rwCodes = new Set<string>();
  for (const row of data.neighborhoods) {
    const code = row.rw.trim().toUpperCase();
    if (!/^RW\s?\d{1,3}$/.test(code)) errors.push(`Kode RW “${row.rw}” tidak valid.`);
    if (rwCodes.has(code)) errors.push(`Kode ${row.rw} digunakan lebih dari satu kali.`);
    rwCodes.add(code);
    if (row.male + row.female !== row.total) {
      errors.push(`${row.rw}: laki-laki + perempuan harus sama dengan total.`);
    }
    if (!row.populationCategory.trim()) errors.push(`${row.rw}: kategori jumlah penduduk wajib diisi.`);
  }

  const totals = populationDashboardTotals(data);
  if (totals.gender !== data.totalPopulation) errors.push("Jumlah laki-laki dan perempuan tidak sama dengan total penduduk.");
  if (totals.ages !== data.totalPopulation) errors.push("Jumlah seluruh kelompok usia tidak sama dengan total penduduk.");
  if (totals.rwPopulation !== data.totalPopulation) errors.push("Jumlah penduduk seluruh RW tidak sama dengan total penduduk.");
  if (totals.rwMale !== data.male) errors.push("Jumlah laki-laki seluruh RW tidak sama dengan ringkasan laki-laki.");
  if (totals.rwFemale !== data.female) errors.push("Jumlah perempuan seluruh RW tidak sama dengan ringkasan perempuan.");
  if (totals.rwHouseholds !== data.households) errors.push("Jumlah KK seluruh RW tidak sama dengan ringkasan KK.");
  if (totals.rwRt !== data.totalRt) errors.push("Jumlah RT seluruh RW tidak sama dengan ringkasan RT.");

  if (data.status === "published") {
    if (!data.period.trim()) errors.push("Periode data kependudukan wajib diisi sebelum dipublikasikan.");
    if (!data.source.trim()) errors.push("Sumber data kependudukan wajib diisi sebelum dipublikasikan.");
    if (data.isSimulation) errors.push("Data simulasi tidak boleh dipublikasikan. Nonaktifkan label simulasi setelah data resmi diverifikasi.");
  }

  return [...new Set(errors)];
}
