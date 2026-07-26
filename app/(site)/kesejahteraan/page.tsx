import type { CSSProperties } from "react";
import { CalendarDays, Database, HeartHandshake, Info, Route, ShieldCheck, Users } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { getSiteData } from "@/lib/cms";
import { formatPercentage, percentage, socialDashboardTotals } from "@/lib/social-dashboard";

export const dynamic = "force-dynamic";

function number(value: number) {
  return value.toLocaleString("id-ID");
}

export default async function SocialPage() {
  const data = await getSiteData();
  const dashboard = data.socialDashboard;
  const totals = socialDashboardTotals(dashboard);
  const pbiPercent = percentage(dashboard.pbiJk.yes, dashboard.totalRecords);
  const deciles = [
    ["Desil 1", dashboard.deciles.d1],
    ["Desil 2", dashboard.deciles.d2],
    ["Desil 3", dashboard.deciles.d3],
    ["Desil 4", dashboard.deciles.d4],
    ["Desil 5", dashboard.deciles.d5],
  ] as const;
  const largestDecile = Math.max(...deciles.map(([, value]) => value), 1);

  return (
    <>
      <PageHero eyebrow="Informasi Sosial" title="Kesejahteraan Sosial" description={data.socialContent.intro} />
      <section className="section">
        <div className="container">
          <article className="notice success">
            <ShieldCheck size={22} />
            <div><strong>Perlindungan data pribadi</strong><p>{data.socialContent.privacyNote}</p></div>
          </article>

          {dashboard.status === "published" ? (
            <>
              <div className="welfare-heading-row">
                <div>
                  <span className="eyebrow">Ringkasan data kesejahteraan</span>
                  <h2>Gambaran penerima bantuan dan klasifikasi desil</h2>
                  <p>Persentase dihitung otomatis dari total {number(dashboard.totalRecords)} data agregat.</p>
                </div>
                <div className="welfare-meta">
                  <span><CalendarDays size={16} /> {dashboard.period}</span>
                  <span><Database size={16} /> {dashboard.source}</span>
                </div>
              </div>

              <div className="welfare-summary-grid">
                <article className="welfare-kpi-card">
                  <span className="icon-box"><Database size={21} /></span>
                  <strong>{number(dashboard.totalRecords)}</strong>
                  <h3>Total basis data</h3>
                  <p>Jumlah record agregat yang menjadi dasar perhitungan.</p>
                </article>
                <article className="welfare-kpi-card">
                  <span className="icon-box"><HeartHandshake size={21} /></span>
                  <strong>{formatPercentage(dashboard.pbiJk.yes, dashboard.totalRecords)}</strong>
                  <h3>Penerima PBI-JK</h3>
                  <p>{number(dashboard.pbiJk.yes)} dari {number(dashboard.totalRecords)} data.</p>
                </article>
                <article className="welfare-kpi-card">
                  <span className="icon-box"><Users size={21} /></span>
                  <strong>{formatPercentage(totals.pkhRecipients, dashboard.totalRecords)}</strong>
                  <h3>Terdata PKH</h3>
                  <p>{number(totals.pkhRecipients)} data: {number(dashboard.pkh.family)} keluarga dan {number(dashboard.pkh.administrator)} pengurus.</p>
                </article>
                <article className="welfare-kpi-card">
                  <span className="icon-box"><HeartHandshake size={21} /></span>
                  <strong>{formatPercentage(totals.sembakoRecipients, dashboard.totalRecords)}</strong>
                  <h3>Terdata Sembako</h3>
                  <p>{number(totals.sembakoRecipients)} data: {number(dashboard.sembako.family)} keluarga dan {number(dashboard.sembako.administrator)} pengurus.</p>
                </article>
              </div>

              <div className="assistance-grid">
                <article className="assistance-chart-card">
                  <div className="chart-card-heading"><div><span className="category-label">PBI-JK</span><h3>Komposisi penerima</h3></div><small>{dashboard.pbiJk.period}</small></div>
                  <div className="donut-layout">
                    <div
                      className="donut-chart"
                      role="img"
                      aria-label={`${formatPercentage(dashboard.pbiJk.yes, dashboard.totalRecords)} menerima PBI-JK`}
                      style={{ "--donut-value": `${pbiPercent}%` } as CSSProperties}
                    >
                      <div><strong>{formatPercentage(dashboard.pbiJk.yes, dashboard.totalRecords)}</strong><span>menerima</span></div>
                    </div>
                    <div className="chart-legend">
                      <div><span className="legend-dot legend-primary" /><p><strong>Ya</strong><small>{number(dashboard.pbiJk.yes)} · {formatPercentage(dashboard.pbiJk.yes, dashboard.totalRecords)}</small></p></div>
                      <div><span className="legend-dot legend-muted" /><p><strong>Tidak</strong><small>{number(dashboard.pbiJk.no)} · {formatPercentage(dashboard.pbiJk.no, dashboard.totalRecords)}</small></p></div>
                    </div>
                  </div>
                </article>

                <article className="assistance-chart-card">
                  <div className="chart-card-heading"><div><span className="category-label">PKH</span><h3>Status dalam basis data</h3></div><small>{dashboard.pkh.period}</small></div>
                  <div className="stacked-chart" aria-label="Distribusi status PKH">
                    <div className="stacked-bar">
                      <span className="segment segment-family" style={{ width: `${percentage(dashboard.pkh.family, dashboard.totalRecords)}%` }} />
                      <span className="segment segment-admin" style={{ width: `${percentage(dashboard.pkh.administrator, dashboard.totalRecords)}%` }} />
                      <span className="segment segment-none" style={{ width: `${percentage(dashboard.pkh.no, dashboard.totalRecords)}%` }} />
                    </div>
                    <div className="chart-legend compact-legend">
                      <div><span className="legend-dot segment-family" /><p><strong>Keluarga</strong><small>{number(dashboard.pkh.family)} · {formatPercentage(dashboard.pkh.family, dashboard.totalRecords)}</small></p></div>
                      <div><span className="legend-dot segment-admin" /><p><strong>Pengurus</strong><small>{number(dashboard.pkh.administrator)} · {formatPercentage(dashboard.pkh.administrator, dashboard.totalRecords)}</small></p></div>
                      <div><span className="legend-dot segment-none" /><p><strong>Tidak</strong><small>{number(dashboard.pkh.no)} · {formatPercentage(dashboard.pkh.no, dashboard.totalRecords)}</small></p></div>
                    </div>
                  </div>
                </article>

                <article className="assistance-chart-card">
                  <div className="chart-card-heading"><div><span className="category-label">Sembako</span><h3>Status dalam basis data</h3></div><small>{dashboard.sembako.period}</small></div>
                  <div className="stacked-chart" aria-label="Distribusi status bantuan Sembako">
                    <div className="stacked-bar">
                      <span className="segment segment-family" style={{ width: `${percentage(dashboard.sembako.family, dashboard.totalRecords)}%` }} />
                      <span className="segment segment-admin" style={{ width: `${percentage(dashboard.sembako.administrator, dashboard.totalRecords)}%` }} />
                      <span className="segment segment-none" style={{ width: `${percentage(dashboard.sembako.no, dashboard.totalRecords)}%` }} />
                    </div>
                    <div className="chart-legend compact-legend">
                      <div><span className="legend-dot segment-family" /><p><strong>Keluarga</strong><small>{number(dashboard.sembako.family)} · {formatPercentage(dashboard.sembako.family, dashboard.totalRecords)}</small></p></div>
                      <div><span className="legend-dot segment-admin" /><p><strong>Pengurus</strong><small>{number(dashboard.sembako.administrator)} · {formatPercentage(dashboard.sembako.administrator, dashboard.totalRecords)}</small></p></div>
                      <div><span className="legend-dot segment-none" /><p><strong>Tidak</strong><small>{number(dashboard.sembako.no)} · {formatPercentage(dashboard.sembako.no, dashboard.totalRecords)}</small></p></div>
                    </div>
                  </div>
                </article>
              </div>

              <article className="decile-panel">
                <div className="decile-copy">
                  <span className="eyebrow">Klasifikasi desil</span>
                  <h2>Distribusi tingkat kesejahteraan relatif</h2>
                  <p>Klasifikasi desil menunjukkan pengelompokan tingkat kesejahteraan relatif dalam basis data. Desil yang lebih rendah menggambarkan kelompok dengan kondisi kesejahteraan relatif lebih rendah.</p>
                  <div className="notice compact"><Info size={19} /><div><strong>Catatan interpretasi</strong><p>Data ini bukan penetapan status individu oleh website dan dapat berubah mengikuti pembaruan basis data resmi.</p></div></div>
                </div>
                <div className="decile-bars">
                  {deciles.map(([label, value]) => (
                    <div className="decile-row" key={label}>
                      <div><strong>{label}</strong><span>{number(value)} · {formatPercentage(value, dashboard.totalRecords)}</span></div>
                      <div className="decile-track"><span style={{ width: `${(value / largestDecile) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              </article>

              {dashboard.note ? <p className="data-footnote">{dashboard.note}</p> : null}
            </>
          ) : (
            <div className="empty-state">Dashboard kesejahteraan sedang diperbarui dan belum dipublikasikan.</div>
          )}
        </div>
      </section>

      <section className="section section-tinted"><div className="container two-column-content">
        <article className="content-panel"><span className="icon-box"><Info size={22} /></span><h2>Hambatan akses layanan</h2><ul className="check-list">{data.socialContent.accessBarriers.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article className="content-panel"><span className="icon-box"><Route size={22} /></span><h2>Alur memperoleh informasi</h2><ol className="step-list">{data.socialContent.serviceFlow.map((item, index) => <li key={item}><span>{index + 1}</span><p>{item}</p></li>)}</ol></article>
        <article className="content-panel"><h2>Rekomendasi umum</h2><ul className="check-list">{data.socialContent.recommendations.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article className="content-panel"><h2>Kontak rujukan</h2><p>{data.socialContent.referralContact}</p></article>
      </div></section>
    </>
  );
}
