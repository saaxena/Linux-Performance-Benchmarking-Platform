import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Play, Loader, CheckCircle, Clock } from 'lucide-react';
import { runCPUBenchmark, runMemBenchmark, runDiskBenchmark, getBenchmarkHistory } from '../services/api';

const BENCHMARKS = [
  { id: 'cpu',    label: 'CPU',    color: '#38bdf8', desc: 'Prime sieve, matrix multiply, Fibonacci stress' },
  { id: 'memory', label: 'Memory', color: '#a78bfa', desc: 'Allocation, sequential R/W, random access' },
  { id: 'disk',   label: 'Disk',   color: '#34d399', desc: 'Sequential write/read, random I/O' },
];

const RUNNERS = { cpu: runCPUBenchmark, memory: runMemBenchmark, disk: runDiskBenchmark };

const ResultTable = ({ data }) => {
  if (!data) return null;
  const flatRows = [];
  const recurse = (obj, prefix = '') => {
    Object.entries(obj).forEach(([k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'object' && v !== null) recurse(v, key);
      else flatRows.push([key, typeof v === 'number' ? (Number.isInteger(v) ? v.toLocaleString() : v.toFixed(4)) : String(v)]);
    });
  };
  recurse(data);
  return (
    <div style={{ marginTop: 12, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
        <tbody>
          {flatRows.map(([k, v]) => (
            <tr key={k} style={{ borderBottom: '1px solid #334155' }}>
              <td style={{ padding: '5px 10px', color: '#64748b', fontFamily: 'monospace' }}>{k}</td>
              <td style={{ padding: '5px 10px', color: '#e2e8f0', fontFamily: 'monospace', textAlign: 'right' }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function BenchmarkEngine() {
  const [running, setRunning] = useState({});
  const [results, setResults] = useState({});
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    try { setHistory(await getBenchmarkHistory(30)); } catch {}
  };

  useEffect(() => { loadHistory(); }, []);

  const run = async (id) => {
    setRunning(r => ({ ...r, [id]: true }));
    try {
      const res = await RUNNERS[id]();
      setResults(r => ({ ...r, [id]: res }));
      await loadHistory();
    } catch (e) {
      setResults(r => ({ ...r, [id]: { error: e.response?.data?.detail || e.message } }));
    }
    setRunning(r => ({ ...r, [id]: false }));
  };

  const runAll = async () => {
    for (const b of BENCHMARKS) await run(b.id);
  };

  const histByType = (type) => history.filter(h => h.benchmark_type === type).slice(-10);
  const [expanded, setExpanded] = useState({});

  return (
    <div>
      {/* Run all button */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={runAll} disabled={Object.values(running).some(Boolean)} style={{
          padding: '9px 20px', background: '#38bdf818', border: '1px solid #38bdf8', borderRadius: 8,
          color: '#38bdf8', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8,
          opacity: Object.values(running).some(Boolean) ? 0.5 : 1,
        }}>
          <Play size={16} /> Run All Benchmarks
        </button>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Results are saved to history</span>
      </div>

      {/* Benchmark cards */}
      {BENCHMARKS.map(({ id, label, color, desc }) => {
        const result = results[id];
        const isRunning = running[id];
        const hist = histByType(id);

        return (
          <div key={id} style={{ background: '#1e293b', border: `1px solid #334155`, borderRadius: 12, padding: '1.25rem', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0' }}>{label} Benchmark</h3>
                  {result && !result.error && !isRunning && <CheckCircle size={15} color="#22c55e" />}
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>{desc}</p>
              </div>
              <button onClick={() => run(id)} disabled={isRunning} style={{
                padding: '7px 16px', background: `${color}18`, border: `1px solid ${color}`, borderRadius: 8,
                color, cursor: isRunning ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6, opacity: isRunning ? 0.7 : 1,
              }}>
                {isRunning ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />Running…</> : <><Play size={14} />Run</>}
              </button>
            </div>

            {/* Score & duration */}
            {result && !result.error && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 16px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>Score</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color, fontFamily: 'monospace' }}>{result.score?.toFixed(2)}</div>
                </div>
                <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 16px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>Duration</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={14} />{result.duration?.toFixed(2)}s
                  </div>
                </div>
              </div>
            )}

            {result?.error && (
              <div style={{ background: '#ef444418', border: '1px solid #ef4444', borderRadius: 8, padding: '8px 12px', color: '#fca5a5', fontSize: '0.8rem', marginBottom: 8 }}>
                Error: {result.error}
              </div>
            )}

            {/* Detailed results toggle */}
            {result?.details && (
              <button onClick={() => setExpanded(e => ({ ...e, [id]: !e[id] }))} style={{
                background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.75rem', padding: '4px 0',
              }}>
                {expanded[id] ? '▲ Hide' : '▼ Show'} details
              </button>
            )}
            {expanded[id] && <ResultTable data={result.details} />}

            {/* History chart */}
            {hist.length > 1 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Score History</div>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={hist} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="timestamp" tick={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                    <Tooltip formatter={v => v.toFixed(2)} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: '0.75rem' }} />
                    <Bar dataKey="score" fill={color} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      })}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
