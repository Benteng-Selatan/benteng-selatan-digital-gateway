import type { CSSProperties } from "react";
import { Database, Home, Info, Users, UserRound, VenusAndMars } from "lucide-react";

import { PageHero } from "@/components/public/PageHero";
import { getSiteData } from "@/lib/cms";
import { populationDashboardTotals } from "@/lib/population-dashboard";

export const dynamic = "force-dynamic";

function number(value: number): string {
  return value.toLocaleString("id-ID");
}

export default async function PopulationPage() {
  const data = await getSiteData();
  const dashboard = data.populationDashboard;
  const totals = populationDashboardTotals(dashboard);
  const malePercent = dashboard.totalPopulation > 0 ? (dashboard.male / dashboard.totalPopulation) * 100 : 0;
  const largestAge = Math.max(...dashboard.ageGroups.map((item) => item.value), 1);

  return (
    <>
      <PageHero
        eyebrow="Data Agregat Wilayah"
        title="Data Kependudukan"
        description="Ringkasan jumlah penduduk, komposisi jenis kelamin, kelompok usia, kepala keluarga, serta distribusi per RW tanpa menampilkan data individu."
      />
      <section className="section population-section">
        <div className="container">
          {dashboard.status !== "published" ? (
            <div className="empty-state">Data kependudukan sedang diperbarui dan belum dipublikasikan.</div>
          ) : (
            <>
              <div className="population-heading-row">
                <div>
                  <span className="eyebrow">Ringkasan kependudukan</span>
                  <h2>Gambaran penduduk Benteng Selatan</h2>
                  <p>Data ditampilkan dalam bentuk agregat untuk menjaga privasi warga.</p>
                </div>
                <div className="population-meta">
                  <span><Database size={16} /> {dashboard.source}</span>
                  <span><Info size={16} /> {dashboard.period}</span>
                </div>
              </div>

              <div className="population-kpi-grid">
                <article><Users size={24} /><strong>{number(dashboard.totalPopulation)}</strong><span>Total penduduk</span></article>
                <article><UserRound size={24} /><strong>{number(dashboard.male)}</strong><span>Laki-laki</span></article>
                <article><VenusAndMars size={24} /><strong>{number(dashboard.female)}</strong><span>Perempuan</span></article>
                <article><Home size={24} /><strong>{number(dashboard.households)}</strong><span>Kepala keluarga</span></article>
                <article><Database size={24} /><strong>{number(dashboard.totalRt)}</strong><span>Rukun Tetangga</span></article>
              </div>

              <div className="population-chart-grid">
                <article className="population-chart-card">
                  <div className="chart-card-heading"><div><span className="category-label">Distribusi usia</span><h3>Penduduk menurut kelompok usia</h3></div></div>
                  <div className="population-age-chart" role="img" aria-label="Grafik distribusi usia penduduk">
                    {dashboard.ageGroups.map((item) => (
                      <div className="population-age-column" key={item.id}>
                        <div className="population-age-value">{number(item.value)}</div>
                        <div className="population-age-track"><span style={{ height: `${Math.max(4, (item.value / largestAge) * 100)}%` }} /></div>
                        <strong>{item.label}</strong>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="population-chart-card">
                  <div className="chart-card-heading"><div><span className="category-label">Rasio jenis kelamin</span><h3>Komposisi penduduk</h3></div></div>
                  <div className="population-gender-layout">
                    <div
                      className="population-donut"
                      role="img"
                      aria-label={`${number(dashboard.male)} laki-laki dan ${number(dashboard.female)} perempuan`}
                      style={{ "--male-value": `${malePercent}%` } as CSSProperties}
                    >
                      <div><strong>{number(dashboard.totalPopulation)}</strong><span>Total jiwa</span></div>
                    </div>
                    <div className="chart-legend">
                      <div><span className="legend-dot population-male" /><p><strong>Laki-laki</strong><small>{number(dashboard.male)}</small></p></div>
                      <div><span className="legend-dot population-female" /><p><strong>Perempuan</strong><small>{number(dashboard.female)}</small></p></div>
                    </div>
                  </div>
                </article>
              </div>

              <article className="population-table-panel">
                <div className="population-table-heading">
                  <div><span className="eyebrow">Data per Rukun Warga</span><h2>Distribusi penduduk per RW</h2></div>
                  <div className="population-badges"><span>{dashboard.totalRw} RW</span><span>{dashboard.totalRt} RT</span></div>
                </div>
                <div className="population-table-scroll">
                  <table className="population-table">
                    <thead><tr><th>RW</th><th>Jumlah RT</th><th>Laki-laki</th><th>Perempuan</th><th>Total</th><th>KK</th><th>Kategori jumlah penduduk</th></tr></thead>
                    <tbody>
                      {dashboard.neighborhoods.map((row) => (
                        <tr key={row.id}><td>{row.rw}</td><td>{number(row.rt)}</td><td>{number(row.male)}</td><td>{number(row.female)}</td><td>{number(row.total)}</td><td>{number(row.households)}</td><td>{row.populationCategory}</td></tr>
                      ))}
                    </tbody>
                    <tfoot><tr><th>Total</th><th>{number(totals.rwRt)}</th><th>{number(totals.rwMale)}</th><th>{number(totals.rwFemale)}</th><th>{number(totals.rwPopulation)}</th><th>{number(totals.rwHouseholds)}</th><th>—</th></tr></tfoot>
                  </table>
                </div>
              </article>

              {dashboard.note ? <p className="data-footnote">{dashboard.note}</p> : null}
            </>
          )}
        </div>
      </section>
    </>
  );
}
