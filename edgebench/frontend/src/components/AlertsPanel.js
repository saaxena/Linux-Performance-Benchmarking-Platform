import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Bell, Shield } from 'lucide-react';
import { getAlerts, getAlertStats, resolveAlert, getThresholds } from '../services/api';

const SEV_STYLES = {
  critical: { color: '#ef4444', bg: '#ef444418', border: '#ef444440' },
  high:     { color: '#f97316', bg: '#f9731618', border: '#f9731640' },
  medium:   { color: '#eab308', bg: '#eab30818', border: '#eab30840' },
  low:      { color: '#22c55e', bg: '#22c55e18', border: '#22c55e40' },
};

const SevBadge = ({ sev }) => {
  const s = SEV_STYLES[sev] || SEV_STYLES.low;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 4, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
      {sev}
    </span>
  );
};

const StatCard = ({ value, label, color }) => (
  <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '1rem', textAlign: 'center', flex: 1, minWidth: 80 }}>
    <div style={{ fontSize: '1.8rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
  </div>
);

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [thresholds, setThresholds] = useState(null);
  const [filter, setFilter] = useState('all'); // all | active | resolved
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState({});

  const refresh = useCallback(async () => {
    try {
      const resolved = filter === 'all' ? null : filter === 'resolved';
      const [a, s, t] = await Promise.all([
        getAlerts(resolved),
        getAlertStats(),
        getThresholds(),
      ]);
      setAlerts(a);
      setStats(s);
      setThresholds(t);
    } catch {}
    setLoading(false);
  }, [filter]);

  useEffect(() => { refresh(); const id = setInterval(refresh, 20000); return () => clearInterval(id); }, [refresh]);

  const handleResolve = async (id) => {
    setResolving(r => ({ ...r, [id]: true }));
    try { await resolveAlert(id); await refresh(); } catch {}
    setResolving(r => ({ ...r, [id]: false }));
  };

  const fmtTs = (ts) => ts ? new Date(ts).toLocaleString() : '—';
  const typeColors = { cpu: '#38bdf8', memory: '#a78bfa', disk: '#34d399', swap: '#fb923c', network: '#22c55e' };

  return (
    <div>
      {/* Stats row */}
      {stats && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <StatCard value={stats.total}    label="Total Alerts"    color="#64748b" />
          <StatCard value={stats.active}   label="Active"          color={stats.active > 0 ? '#ef4444' : '#22c55e'} />
          <StatCard value={stats.critical} label="Critical"        color="#ef4444" />
          <StatCard value={stats.high}     label="High"            color="#f97316" />
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {['all', 'active', 'resolved'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 6, border: `1px solid ${filter === f ? '#38bdf8' : '#334155'}`,
            background: filter === f ? '#38bdf818' : 'transparent', color: filter === f ? '#38bdf8' : '#64748b',
            cursor: 'pointer', fontSize: '0.8rem', fontWeight: filter === f ? 600 : 400, textTransform: 'capitalize',
          }}>{f}</button>
        ))}
        <button onClick={refresh} style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid #334155', borderRadius: 6, padding: '5px 10px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem' }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Alert list */}
      {loading && <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Loading alerts…</div>}

      {!loading && alerts.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
          <Shield size={36} style={{ marginBottom: 12, color: '#22c55e' }} />
          <div style={{ fontWeight: 600, color: '#22c55e', fontSize: '1rem' }}>All Clear</div>
          <div style={{ fontSize: '0.83rem', marginTop: 4 }}>No {filter !== 'all' ? filter : ''} alerts found</div>
        </div>
      )}

      {alerts.map(a => {
        const sev = SEV_STYLES[a.severity] || SEV_STYLES.low;
        const typeColor = typeColors[a.alert_type] || '#94a3b8';
        return (
          <div key={a.id} style={{
            background: '#1e293b', border: `1px solid ${a.resolved ? '#334155' : sev.border}`,
            borderRadius: 10, padding: '1rem 1.25rem', marginBottom: 10,
            opacity: a.resolved ? 0.65 : 1,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  {a.resolved ? <CheckCircle size={15} color="#22c55e" /> : <AlertTriangle size={15} color={sev.color} />}
                  <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.875rem' }}>{a.message}</span>
                  <SevBadge sev={a.severity} />
                  <span style={{ background: `${typeColor}18`, color: typeColor, borderRadius: 4, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    {a.alert_type}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: '#64748b', flexWrap: 'wrap' }}>
                  <span>Value: <span style={{ color: sev.color, fontFamily: 'monospace', fontWeight: 600 }}>{a.value?.toFixed(1)}%</span></span>
                  <span>Threshold: <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{a.threshold}%</span></span>
                  <span>Triggered: <span style={{ color: '#94a3b8' }}>{fmtTs(a.timestamp)}</span></span>
                  {a.resolved && <span>Resolved: <span style={{ color: '#22c55e' }}>{fmtTs(a.resolved_at)}</span></span>}
                </div>
              </div>
              {!a.resolved && (
                <button onClick={() => handleResolve(a.id)} disabled={resolving[a.id]} style={{
                  padding: '5px 12px', background: '#22c55e18', border: '1px solid #22c55e40', borderRadius: 6,
                  color: '#22c55e', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <CheckCircle size={12} />{resolving[a.id] ? '…' : 'Resolve'}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Thresholds panel */}
      {thresholds && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1rem 1.25rem', marginTop: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bell size={15} /> Alert Thresholds
          </h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(thresholds).map(([type, t]) => (
              <div key={type} style={{ background: '#0f172a', borderRadius: 8, padding: '8px 14px', minWidth: 130 }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>{type}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem' }}>
                  <span><span style={{ color: '#f97316', fontWeight: 600 }}>High</span> {t.high}%</span>
                  <span><span style={{ color: '#ef4444', fontWeight: 600 }}>Crit</span> {t.critical}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
