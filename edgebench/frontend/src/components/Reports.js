import React, { useState } from 'react';
import { FileText, Download, ExternalLink, Code, RefreshCw } from 'lucide-react';
import { getReportJSON, getReportHTML } from '../services/api';

const fmt = (v, unit = '') => v !== undefined && v !== null ? `${typeof v === 'number' ? v.toLocaleString() : v}${unit}` : '—';

export default function Reports() {
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview'); // overview | alerts | benchmarks | raw

  const fetchJSON = async () => {
    setLoading(true); setError(null);
    try { setJsonData(await getReportJSON()); } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const downloadJSON = () => {
    if (!jsonData) return;
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `edgebench-report-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  };

  const openHTML = () => window.open(getReportHTML(), '_blank');

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{
      padding: '6px 14px', borderRadius: 6, border: `1px solid ${tab === id ? '#38bdf8' : '#334155'}`,
      background: tab === id ? '#38bdf818' : 'transparent', color: tab === id ? '#38bdf8' : '#64748b',
      cursor: 'pointer', fontSize: '0.8rem', fontWeight: tab === id ? 600 : 400,
    }}>{label}</button>
  );

  const KV = ({ k, v, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #334155', fontSize: '0.82rem' }}>
      <span style={{ color: '#64748b' }}>{k}</span>
      <span style={{ color: color || '#e2e8f0', fontFamily: 'monospace', fontWeight: 500 }}>{v}</span>
    </div>
  );

  const SEV_COL = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };

  return (
    <div>
      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={fetchJSON} disabled={loading} style={{
          padding: '9px 18px', background: '#38bdf818', border: '1px solid #38bdf8', borderRadius: 8,
          color: '#38bdf8', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
          display: 'flex', alignItems: 'center', gap: 8, opacity: loading ? 0.6 : 1,
        }}>
          {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={16} />}
          {loading ? 'Generating…' : jsonData ? 'Refresh Report' : 'Generate Report'}
        </button>
        {jsonData && (
          <>
            <button onClick={downloadJSON} style={{ padding: '9px 18px', background: '#34d39918', border: '1px solid #34d399', borderRadius: 8, color: '#34d399', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download size={16} /> Download JSON
            </button>
            <button onClick={openHTML} style={{ padding: '9px 18px', background: '#a78bfa18', border: '1px solid #a78bfa', borderRadius: 8, color: '#a78bfa', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ExternalLink size={16} /> Open HTML Report
            </button>
          </>
        )}
      </div>

      {error && (
        <div style={{ background: '#ef444418', border: '1px solid #ef444440', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', marginBottom: 16, fontSize: '0.83rem' }}>
          Error: {error}
        </div>
      )}

      {!jsonData && !loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
          <FileText size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div>Click "Generate Report" to create a snapshot report of your system.</div>
          <div style={{ marginTop: 6, fontSize: '0.8rem' }}>Reports include system info, 24h utilization, alerts, and benchmark results.</div>
        </div>
      )}

      {jsonData && (
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <TabBtn id="overview" label="Overview" />
            <TabBtn id="alerts" label={`Alerts (${jsonData.alerts?.length || 0})`} />
            <TabBtn id="benchmarks" label={`Benchmarks (${jsonData.benchmarks?.length || 0})`} />
            <TabBtn id="raw" label="Raw JSON" />
          </div>

          {tab === 'overview' && (
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '0.875rem', color: '#94a3b8', fontWeight: 600 }}>System Information</h3>
                <KV k="Hostname"   v={jsonData.system?.hostname} />
                <KV k="OS"         v={jsonData.system?.os} />
                <KV k="CPU Cores"  v={jsonData.system?.cpu_count} />
                <KV k="Total RAM"  v={fmt(jsonData.system?.total_ram_gb, ' GB')} />
                <KV k="Total Disk" v={fmt(jsonData.system?.total_disk_gb, ' GB')} />
                <KV k="Generated"  v={jsonData.generated_at?.replace('T', ' ').slice(0, 19)} />
              </div>
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '0.875rem', color: '#94a3b8', fontWeight: 600 }}>24-Hour Utilization</h3>
                <KV k="Samples"    v={jsonData.utilization_24h?.samples} />
                <KV k="Avg CPU"    v={fmt(jsonData.utilization_24h?.avg_cpu_percent, '%')} color="#38bdf8" />
                <KV k="Max CPU"    v={fmt(jsonData.utilization_24h?.max_cpu_percent, '%')} color={jsonData.utilization_24h?.max_cpu_percent > 85 ? '#ef4444' : '#38bdf8'} />
                <KV k="Avg Memory" v={fmt(jsonData.utilization_24h?.avg_mem_percent, '%')} color="#a78bfa" />
                <KV k="Max Memory" v={fmt(jsonData.utilization_24h?.max_mem_percent, '%')} color={jsonData.utilization_24h?.max_mem_percent > 85 ? '#ef4444' : '#a78bfa'} />
              </div>
            </div>
          )}

          {tab === 'alerts' && (
            <div>
              {jsonData.alerts?.length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>No alerts recorded</div>}
              {jsonData.alerts?.map((a, i) => (
                <div key={i} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', marginBottom: 8, fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: SEV_COL[a.severity] || '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>{a.severity}</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{a.message}</span>
                    <span style={{ color: '#64748b', marginLeft: 'auto', fontSize: '0.72rem' }}>{a.timestamp?.replace('T', ' ').slice(0, 16)}</span>
                    <span style={{ color: a.resolved ? '#22c55e' : '#ef4444', fontSize: '0.72rem' }}>{a.resolved ? '✓ resolved' : '⚠ active'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'benchmarks' && (
            <div>
              {jsonData.benchmarks?.length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>No benchmarks run yet — go to the Benchmarks page to run some!</div>}
              {jsonData.benchmarks?.map((b, i) => (
                <div key={i} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', marginBottom: 8, display: 'flex', gap: 16, alignItems: 'center', fontSize: '0.82rem' }}>
                  <span style={{ textTransform: 'capitalize', fontWeight: 600, color: '#e2e8f0', minWidth: 70 }}>{b.type}</span>
                  <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700 }}>Score: {b.score?.toFixed(2)}</span>
                  <span style={{ color: '#64748b' }}>{b.duration_seconds?.toFixed(2)}s</span>
                  <span style={{ color: '#64748b', marginLeft: 'auto', fontSize: '0.72rem' }}>{b.timestamp?.replace('T', ' ').slice(0, 16)}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'raw' && (
            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '1rem', maxHeight: 600, overflowY: 'auto' }}>
              <pre style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(jsonData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
