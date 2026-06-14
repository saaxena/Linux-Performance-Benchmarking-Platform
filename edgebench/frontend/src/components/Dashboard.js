import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Cpu, MemoryStick, HardDrive, Wifi, Clock, Server, AlertTriangle, Activity } from 'lucide-react';
import { getMetrics, getMetricsHistory, getActiveAlerts, getAlertStats } from '../services/api';

const fmt = (bytes) => {
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
  if (bytes >= 1e3) return (bytes / 1e3).toFixed(1) + ' KB';
  return bytes + ' B';
};

const fmtUptime = (sec) => {
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const GaugeCard = ({ label, value, max = 100, unit = '%', color, icon: Icon, sub }) => {
  const pct = Math.min((value / max) * 100, 100);
  const col = pct > 85 ? '#ef4444' : pct > 65 ? '#f97316' : color;
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1.25rem', flex: 1, minWidth: 160 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: col, lineHeight: 1 }}>
            {typeof value === 'number' ? value.toFixed(1) : value}<span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#94a3b8', marginLeft: 2 }}>{unit}</span>
          </div>
          {sub && <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ background: `${col}18`, borderRadius: 8, padding: 8 }}>
          <Icon size={20} color={col} />
        </div>
      </div>
      {/* Bar */}
      <div style={{ height: 6, background: '#0f172a', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color = '#38bdf8' }) => (
  <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 140 }}>
    <div style={{ background: `${color}18`, borderRadius: 8, padding: 8, flexShrink: 0 }}>
      <Icon size={18} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', marginTop: 2 }}>{value}</div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem' }}>
      <div style={{ color: '#64748b', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value?.toFixed(1)}%</div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [alertStats, setAlertStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [m, h, as_] = await Promise.all([getMetrics(), getMetricsHistory(60), getAlertStats()]);
      setMetrics(m);
      setHistory(h.map(r => ({ ...r, time: new Date(r.timestamp).toLocaleTimeString() })));
      setAlertStats(as_);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); const id = setInterval(refresh, 10000); return () => clearInterval(id); }, [refresh]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#64748b' }}>
      <Activity size={20} style={{ marginRight: 8 }} /> Loading metrics…
    </div>
  );

  if (!metrics) return (
    <div style={{ textAlign: 'center', padding: 60, color: '#ef4444' }}>
      <AlertTriangle size={32} style={{ marginBottom: 12 }} />
      <div>Cannot connect to EdgeBench API at http://localhost:8000</div>
      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 8 }}>Make sure the backend is running.</div>
    </div>
  );

  const { cpu, memory, disk, network, system } = metrics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Gauge row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <GaugeCard label="CPU Usage" value={cpu.percent} icon={Cpu} color="#38bdf8"
          sub={`${cpu.cores} cores • Load: ${cpu.load_1min?.toFixed(2)}`} />
        <GaugeCard label="Memory" value={memory.percent} icon={MemoryStick} color="#a78bfa"
          sub={`${fmt(memory.used)} / ${fmt(memory.total)}`} />
        <GaugeCard label="Disk" value={disk.percent} icon={HardDrive} color="#34d399"
          sub={`${fmt(disk.used)} / ${fmt(disk.total)}`} />
        <GaugeCard label="Swap" value={memory.swap_percent} icon={Activity} color="#fb923c"
          sub={`${fmt(memory.swap_used)} used`} />
      </div>

      {/* Stat row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatCard label="Uptime" value={fmtUptime(system.uptime_seconds)} icon={Clock} color="#38bdf8" />
        <StatCard label="Net In" value={`${fmt(network.bytes_recv_per_sec)}/s`} icon={Wifi} color="#34d399" />
        <StatCard label="Net Out" value={`${fmt(network.bytes_sent_per_sec)}/s`} icon={Wifi} color="#f97316" />
        <StatCard label="TCP Conns" value={network.connections} icon={Server} color="#a78bfa" />
        {alertStats && (
          <StatCard label="Active Alerts" value={alertStats.active}
            icon={AlertTriangle} color={alertStats.active > 0 ? '#ef4444' : '#22c55e'} />
        )}
      </div>

      {/* Chart */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0' }}>Resource Utilization (last 60 samples)</h3>
          {lastUpdate && <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Updated {lastUpdate.toLocaleTimeString()}</span>}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="cpu_percent" name="CPU" stroke="#38bdf8" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="mem_percent" name="Memory" stroke="#a78bfa" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="disk_percent" name="Disk" stroke="#34d399" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
          {[['CPU', '#38bdf8'], ['Memory', '#a78bfa'], ['Disk', '#34d399']].map(([l, c]) => (
            <span key={l} style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 3, background: c, display: 'inline-block', borderRadius: 2 }} />{l}
            </span>
          ))}
        </div>
      </div>

      {/* CPU detail */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[['CPU Freq', cpu.frequency ? `${cpu.frequency} MHz` : 'N/A', '#38bdf8'],
          ['CPU Temp', cpu.temperature ? `${cpu.temperature}°C` : 'N/A', '#ef4444'],
          ['Load 1m', cpu.load_1min?.toFixed(2), '#38bdf8'],
          ['Load 5m', cpu.load_5min?.toFixed(2), '#a78bfa'],
          ['Load 15m', cpu.load_15min?.toFixed(2), '#34d399'],
          ['Disk Read', `${fmt(disk.read_bytes_per_sec)}/s`, '#34d399'],
          ['Disk Write', `${fmt(disk.write_bytes_per_sec)}/s`, '#fb923c'],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '0.75rem 1rem', minWidth: 110 }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{l}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: c, fontFamily: 'monospace' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
