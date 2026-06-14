import React, { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { getTrends, getAnalyticsSummary, getBenchmarkTrends } from '../services/api';

const PERIODS = ['1h', '6h', '24h', '7d', '30d'];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem' }}>
      <div style={{ color: '#64748b', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</div>)}
    </div>
  );
};

const SummaryCard = ({ label, value, color }) => (
  <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.75rem 1rem', flex: 1, minWidth: 120 }}>
    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: '1rem', fontWeight: 700, color: color || '#e2e8f0', fontFamily: 'monospace' }}>{value}</div>
  </div>
);

const ChartCard = ({ title, color, children }) => (
  <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1.25rem', marginBottom: 16 }}>
    <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 10, height: 10, background: color, borderRadius: '50%', display: 'inline-block' }} />{title}
    </h3>
    {children}
  </div>
);

const fmtTs = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
};

export default function Analytics() {
  const [period, setPeriod] = useState('24h');
  const [trends, setTrends] = useState([]);
  const [summary, setSummary] = useState(null);
  const [benchmarkHistory, setBenchmarkHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s, bh] = await Promise.all([getTrends(period), getAnalyticsSummary(), getBenchmarkTrends()]);
      const data = (t.data || []).map(r => ({ ...r, time: fmtTs(r.timestamp) }));
      setTrends(data);
      setSummary(s);
      setBenchmarkHistory(bh.map(r => ({
        ...r,
        time: new Date(r.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      })));
    } catch {}
    setLoading(false);
  }, [period]);

  useEffect(() => { refresh(); }, [refresh]);

  const avgCPU = trends.length ? (trends.reduce((s, r) => s + (r.cpu_percent || 0), 0) / trends.length).toFixed(1) : '—';
  const avgMem = trends.length ? (trends.reduce((s, r) => s + (r.mem_percent || 0), 0) / trends.length).toFixed(1) : '—';
  const maxCPU = trends.length ? Math.max(...trends.map(r => r.cpu_percent || 0)).toFixed(1) : '—';
  const maxMem = trends.length ? Math.max(...trends.map(r => r.mem_percent || 0)).toFixed(1) : '—';

  const cpuBench = benchmarkHistory.filter(b => b.benchmark_type === 'cpu');
  const memBench = benchmarkHistory.filter(b => b.benchmark_type === 'memory');
  const diskBench = benchmarkHistory.filter(b => b.benchmark_type === 'disk');

  return (
    <div>
      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {PERIODS.map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding: '6px 16px', borderRadius: 6, border: `1px solid ${period === p ? '#38bdf8' : '#334155'}`,
            background: period === p ? '#38bdf818' : 'transparent', color: period === p ? '#38bdf8' : '#64748b',
            cursor: 'pointer', fontWeight: period === p ? 600 : 400, fontSize: '0.82rem',
          }}>{p}</button>
        ))}
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <SummaryCard label={`Avg CPU (${period})`}  value={`${avgCPU}%`} color="#38bdf8" />
        <SummaryCard label={`Max CPU (${period})`}  value={`${maxCPU}%`} color={parseFloat(maxCPU) > 85 ? '#ef4444' : '#38bdf8'} />
        <SummaryCard label={`Avg Mem (${period})`}  value={`${avgMem}%`} color="#a78bfa" />
        <SummaryCard label={`Max Mem (${period})`}  value={`${maxMem}%`} color={parseFloat(maxMem) > 85 ? '#ef4444' : '#a78bfa'} />
        {summary && <SummaryCard label="Total Records" value={summary.total_metric_records?.toLocaleString()} color="#34d399" />}
        {summary && <SummaryCard label="Total Benchmarks" value={summary.total_benchmarks} color="#fb923c" />}
      </div>

      {loading && <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Loading trend data…</div>}

      {!loading && trends.length === 0 && (
        <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>
          No data for period "{period}". Metrics are collected every 30s — check back soon.
        </div>
      )}

      {!loading && trends.length > 0 && (
        <>
          {/* CPU + Memory overlay */}
          <ChartCard title={`CPU & Memory Trend — ${period}`} color="#38bdf8">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="gCPU" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} /><stop offset="95%" stopColor="#38bdf8" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gMEM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a78bfa" stopOpacity={0.25} /><stop offset="95%" stopColor="#a78bfa" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={v => v + '%'} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize: '0.78rem', color: '#94a3b8' }} />
                <Area type="monotone" dataKey="cpu_percent" name="CPU" stroke="#38bdf8" fill="url(#gCPU)" dot={false} strokeWidth={2} />
                <Area type="monotone" dataKey="mem_percent" name="Memory" stroke="#a78bfa" fill="url(#gMEM)" dot={false} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Disk + Network */}
          <ChartCard title={`Disk & Network — ${period}`} color="#34d399">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} interval="preserveStartEnd" />
                <YAxis yAxisId="disk" domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={v => v + '%'} />
                <YAxis yAxisId="net" orientation="right" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={v => (v / 1024).toFixed(0) + 'K'} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize: '0.78rem', color: '#94a3b8' }} />
                <Line yAxisId="disk" type="monotone" dataKey="disk_percent" name="Disk %" stroke="#34d399" dot={false} strokeWidth={2} />
                <Line yAxisId="net" type="monotone" dataKey="net_bytes_recv" name="Net Recv" stroke="#fb923c" dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}

      {/* Benchmark history charts */}
      {benchmarkHistory.length > 0 && (
        <ChartCard title="Benchmark Score History" color="#fb923c">
          <div style={{ display: 'grid', gap: 12 }}>
            {[['CPU Scores', cpuBench, '#38bdf8'], ['Memory Scores', memBench, '#a78bfa'], ['Disk Scores', diskBench, '#34d399']].map(([lbl, data, color]) =>
              data.length > 0 ? (
                <div key={lbl}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 6 }}>{lbl}</div>
                  <ResponsiveContainer width="100%" height={80}>
                    <BarChart data={data} barSize={14}>
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                      <Tooltip formatter={v => v.toFixed(2)} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: '0.75rem' }} />
                      <Bar dataKey="score" fill={color} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null
            )}
          </div>
        </ChartCard>
      )}
    </div>
  );
}
