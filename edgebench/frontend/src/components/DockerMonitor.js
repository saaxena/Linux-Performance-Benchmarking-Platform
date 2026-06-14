import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Terminal, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { getDockerStatus, getContainers, getContainerLogs } from '../services/api';

const StatusBadge = ({ status }) => {
  const colors = { running: ['#22c55e', '#22c55e20'], exited: ['#ef4444', '#ef444420'], paused: ['#eab308', '#eab30820'] };
  const [col, bg] = colors[status] || ['#94a3b8', '#94a3b820'];
  return (
    <span style={{ background: bg, color: col, borderRadius: 4, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize' }}>
      <span style={{ display: 'inline-block', width: 6, height: 6, background: col, borderRadius: '50%', marginRight: 4 }} />{status}
    </span>
  );
};

const MiniBar = ({ value, color }) => (
  <div style={{ width: 60, height: 5, background: '#0f172a', borderRadius: 3, overflow: 'hidden', display: 'inline-block' }}>
    <div style={{ height: '100%', width: `${Math.min(value, 100)}%`, background: value > 85 ? '#ef4444' : color, borderRadius: 3 }} />
  </div>
);

export default function DockerMonitor() {
  const [status, setStatus] = useState(null);
  const [containers, setContainers] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [logs, setLogs] = useState({});
  const [expandedLogs, setExpandedLogs] = useState({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([getDockerStatus(), getContainers(showAll)]);
      setStatus(s);
      setContainers(c);
    } catch {}
    setLoading(false);
  }, [showAll]);

  useEffect(() => { refresh(); const id = setInterval(refresh, 15000); return () => clearInterval(id); }, [refresh]);

  const toggleLogs = async (id, name) => {
    if (expandedLogs[id]) {
      setExpandedLogs(e => ({ ...e, [id]: false }));
      return;
    }
    try {
      const data = await getContainerLogs(id);
      setLogs(l => ({ ...l, [id]: data.lines }));
      setExpandedLogs(e => ({ ...e, [id]: true }));
    } catch (e) {
      setLogs(l => ({ ...l, [id]: [`Error fetching logs: ${e.message}`] }));
      setExpandedLogs(e => ({ ...e, [id]: true }));
    }
  };

  if (loading) return <div style={{ color: '#64748b', padding: 40, textAlign: 'center' }}>Loading Docker status…</div>;

  return (
    <div>
      {/* Status bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: status?.available ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
          <span style={{ fontSize: '0.82rem', color: status?.available ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
            Docker {status?.available ? 'Available' : 'Unavailable'}
          </span>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#94a3b8', cursor: 'pointer' }}>
          <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} />
          Show all containers
        </label>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#64748b' }}>
          {containers.length} container{containers.length !== 1 ? 's' : ''}
          <button onClick={refresh} style={{ background: 'transparent', border: '1px solid #334155', borderRadius: 6, padding: '4px 8px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {!status?.available && (
        <div style={{ background: '#eab30818', border: '1px solid #eab30840', borderRadius: 10, padding: '1rem', marginBottom: 16, display: 'flex', gap: 10, color: '#fde68a', fontSize: '0.83rem' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>Docker daemon is not running or not accessible. Start Docker and refresh, or run the backend with Docker socket mounted.</div>
        </div>
      )}

      {containers.length === 0 && status?.available && (
        <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>No containers found. Start some containers or enable "Show all".</div>
      )}

      {/* Container cards */}
      {containers.map(c => (
        <div key={c.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.95rem' }}>{c.name}</span>
                  <StatusBadge status={c.status} />
                  {c.restart_count > 0 && (
                    <span style={{ background: '#f9731618', color: '#fb923c', borderRadius: 4, padding: '2px 7px', fontSize: '0.7rem', fontWeight: 600 }}>
                      Restarts: {c.restart_count}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{c.image}</div>
                <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 2 }}>ID: {c.id}</div>
              </div>
              <button onClick={() => toggleLogs(c.id, c.name)} style={{
                background: 'transparent', border: '1px solid #334155', borderRadius: 6, padding: '5px 10px',
                color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem',
              }}>
                <Terminal size={13} /> Logs {expandedLogs[c.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>CPU</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MiniBar value={c.cpu_percent} color="#38bdf8" />
                  <span style={{ fontSize: '0.75rem', color: '#e2e8f0', fontFamily: 'monospace' }}>{c.cpu_percent.toFixed(1)}%</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Memory</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MiniBar value={c.memory_percent} color="#a78bfa" />
                  <span style={{ fontSize: '0.75rem', color: '#e2e8f0', fontFamily: 'monospace' }}>{c.memory_used_mb.toFixed(0)} MB</span>
                </div>
              </div>
              {Object.keys(c.ports || {}).length > 0 && (
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Ports</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                    {Object.entries(c.ports).filter(([, v]) => v).map(([k]) => k).join(', ')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Log panel */}
          {expandedLogs[c.id] && (
            <div style={{ borderTop: '1px solid #334155', background: '#0f172a', padding: '0.75rem 1.25rem', maxHeight: 260, overflowY: 'auto' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', lineHeight: 1.6 }}>
                {(logs[c.id] || []).map((line, i) => (
                  <div key={i} style={{ color: line.includes('ERROR') || line.includes('error') ? '#fca5a5' : line.includes('WARN') ? '#fde68a' : '#94a3b8', wordBreak: 'break-all' }}>
                    {line}
                  </div>
                ))}
                {!logs[c.id] && <div style={{ color: '#64748b' }}>Loading logs…</div>}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
