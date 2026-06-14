import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { getProcesses, searchProcesses, getZombies } from '../services/api';

const Btn = ({ active, children, onClick, color = '#38bdf8' }) => (
  <button onClick={onClick} style={{
    padding: '5px 12px', borderRadius: 6, border: `1px solid ${active ? color : '#334155'}`,
    background: active ? `${color}18` : 'transparent', color: active ? color : '#94a3b8',
    fontSize: '0.78rem', cursor: 'pointer', fontWeight: active ? 600 : 400,
  }}>{children}</button>
);

const Bar = ({ value, max, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ flex: 1, height: 5, background: '#0f172a', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min((value / max) * 100, 100)}%`, background: color, borderRadius: 3 }} />
    </div>
    <span style={{ fontSize: '0.75rem', color: '#94a3b8', minWidth: 40, textAlign: 'right', fontFamily: 'monospace' }}>
      {value.toFixed(1)}%
    </span>
  </div>
);

export default function ProcessAnalyzer() {
  const [procs, setProcs] = useState([]);
  const [zombies, setZombies] = useState([]);
  const [sortBy, setSortBy] = useState('cpu');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(50);

  const fetchProcs = useCallback(async () => {
    setLoading(true);
    try {
      const data = search
        ? await searchProcesses(search)
        : await getProcesses(sortBy, limit);
      setProcs(data);
      const z = await getZombies();
      setZombies(z);
    } catch {}
    setLoading(false);
  }, [sortBy, search, limit]);

  useEffect(() => { fetchProcs(); }, [fetchProcs]);
  useEffect(() => {
    if (!search) { const id = setInterval(fetchProcs, 15000); return () => clearInterval(id); }
  }, [fetchProcs, search]);

  const maxCPU = Math.max(...procs.map(p => p.cpu_percent), 1);
  const maxMem = Math.max(...procs.map(p => p.memory_percent), 1);

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search processes…"
            style={{ width: '100%', padding: '7px 10px 7px 32px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: '0.875rem', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['cpu', 'memory', 'pid', 'name'].map(s => (
            <Btn key={s} active={sortBy === s && !search} onClick={() => { setSortBy(s); setSearch(''); }}>{s.toUpperCase()}</Btn>
          ))}
        </div>
        <button onClick={fetchProcs} style={{ padding: '5px 10px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem' }}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Zombie warning */}
      {zombies.length > 0 && (
        <div style={{ background: '#fef2f218', border: '1px solid #ef444440', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#fca5a5', fontSize: '0.83rem' }}>
          <AlertTriangle size={15} />{zombies.length} zombie process{zombies.length !== 1 ? 'es' : ''} detected: {zombies.map(z => `${z.name}(${z.pid})`).join(', ')}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
                {['PID', 'Name', 'Status', 'CPU %', 'Memory %', 'MEM MB', 'Threads', 'User'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {procs.map((p, i) => (
                <tr key={p.pid} style={{ borderBottom: '1px solid #1e293b20', background: i % 2 === 0 ? 'transparent' : '#ffffff04' }}>
                  <td style={{ padding: '8px 12px', color: '#64748b', fontFamily: 'monospace' }}>{p.pid}</td>
                  <td style={{ padding: '8px 12px', color: '#e2e8f0', fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ background: p.status === 'running' ? '#22c55e20' : '#64748b20', color: p.status === 'running' ? '#22c55e' : '#94a3b8', borderRadius: 4, padding: '2px 7px', fontSize: '0.7rem', fontWeight: 600 }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', minWidth: 130 }}><Bar value={p.cpu_percent} max={maxCPU} color="#38bdf8" /></td>
                  <td style={{ padding: '8px 12px', minWidth: 130 }}><Bar value={p.memory_percent} max={maxMem} color="#a78bfa" /></td>
                  <td style={{ padding: '8px 12px', color: '#94a3b8', fontFamily: 'monospace' }}>{p.memory_mb.toFixed(1)}</td>
                  <td style={{ padding: '8px 12px', color: '#64748b', fontFamily: 'monospace' }}>{p.num_threads}</td>
                  <td style={{ padding: '8px 12px', color: '#64748b', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.username}</td>
                </tr>
              ))}
              {procs.length === 0 && !loading && (
                <tr><td colSpan={8} style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>No processes found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '8px 14px', borderTop: '1px solid #334155', color: '#64748b', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>{procs.length} processes shown</span>
          <span>Auto-refresh every 15s</span>
        </div>
      </div>
    </div>
  );
}
