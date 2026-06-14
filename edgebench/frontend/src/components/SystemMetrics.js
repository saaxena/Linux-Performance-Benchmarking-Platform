import React, { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getMetrics, getMetricsHistory } from '../services/api';

const fmt = (b) => b >= 1e9 ? (b / 1e9).toFixed(2) + ' GB' : b >= 1e6 ? (b / 1e6).toFixed(2) + ' MB' : b >= 1e3 ? (b / 1e3).toFixed(1) + ' KB' : b + ' B';

const Tip = ({ active, payload, label, suffix = '%' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem' }}>
      <div style={{ color: '#64748b', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: {p.value?.toFixed(2)}{suffix}</div>)}
    </div>
  );
};

const Section = ({ title, color, children }) => (
  <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1.25rem', marginBottom: 16 }}>
    <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 600, color, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 10, height: 10, background: color, borderRadius: '50%', display: 'inline-block' }} />{title}
    </h3>
    {children}
  </div>
);

const MetaGrid = ({ items }) => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
    {items.map(([k, v]) => (
      <div key={k} style={{ background: '#0f172a', borderRadius: 6, padding: '6px 12px' }}>
        <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>{k}</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', fontFamily: 'monospace' }}>{v}</div>
      </div>
    ))}
  </div>
);

export default function SystemMetrics() {
  const [live, setLive] = useState(null);
  const [history, setHistory] = useState([]);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const [m, h] = await Promise.all([getMetrics(), getMetricsHistory(80)]);
      setLive(m);
      setHistory(h.map(r => ({
        ...r,
        time: new Date(r.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        net_recv_kb: (r.net_bytes_recv / 1024).toFixed(2),
        net_sent_kb: (r.net_bytes_sent / 1024).toFixed(2),
      })));
      setTick(t => t + 1);
    } catch {}
  }, []);

  useEffect(() => { refresh(); const id = setInterval(refresh, 8000); return () => clearInterval(id); }, [refresh]);

  if (!live) return <div style={{ color: '#64748b', padding: 40, textAlign: 'center' }}>Loading real-time metrics…</div>;

  const { cpu, memory, disk, network } = live;

  return (
    <div>
      {/* CPU */}
      <Section title="CPU" color="#38bdf8">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={history}>
            <defs><linearGradient id="cpu" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} /><stop offset="95%" stopColor="#38bdf8" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={v => v + '%'} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="cpu_percent" name="CPU" stroke="#38bdf8" fill="url(#cpu)" dot={false} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <MetaGrid items={[
          ['Utilization', `${cpu.percent.toFixed(1)}%`],
          ['Cores', cpu.cores],
          ['Load 1m', cpu.load_1min?.toFixed(2)],
          ['Load 5m', cpu.load_5min?.toFixed(2)],
          ['Load 15m', cpu.load_15min?.toFixed(2)],
          ['Frequency', cpu.frequency ? `${cpu.frequency.toFixed(0)} MHz` : 'N/A'],
          ['Temperature', cpu.temperature ? `${cpu.temperature}°C` : 'N/A'],
        ]} />
      </Section>

      {/* Memory */}
      <Section title="Memory" color="#a78bfa">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={history}>
            <defs><linearGradient id="mem" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} /><stop offset="95%" stopColor="#a78bfa" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={v => v + '%'} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="mem_percent" name="Memory" stroke="#a78bfa" fill="url(#mem)" dot={false} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <MetaGrid items={[
          ['Used', fmt(memory.used)],
          ['Available', fmt(memory.available)],
          ['Total', fmt(memory.total)],
          ['Usage', `${memory.percent.toFixed(1)}%`],
          ['Swap Used', fmt(memory.swap_used)],
          ['Swap Total', fmt(memory.swap_total)],
          ['Swap %', `${memory.swap_percent.toFixed(1)}%`],
        ]} />
      </Section>

      {/* Disk */}
      <Section title="Disk" color="#34d399">
        <MetaGrid items={[
          ['Total', fmt(disk.total)],
          ['Used', fmt(disk.used)],
          ['Free', fmt(disk.free)],
          ['Usage', `${disk.percent.toFixed(1)}%`],
          ['Read Rate', `${fmt(disk.read_bytes_per_sec)}/s`],
          ['Write Rate', `${fmt(disk.write_bytes_per_sec)}/s`],
        ]} />
        <div style={{ marginTop: 12, height: 6, background: '#0f172a', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${disk.percent}%`, background: disk.percent > 85 ? '#ef4444' : '#34d399', borderRadius: 3, transition: 'width 0.5s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.7rem', color: '#64748b' }}>
          <span>0</span><span>{fmt(disk.total)}</span>
        </div>
      </Section>

      {/* Network */}
      <Section title="Network" color="#fb923c">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={v => `${v}KB`} />
            <Tooltip content={<Tip suffix=" KB/s" />} />
            <Line type="monotone" dataKey="net_recv_kb" name="Recv" stroke="#34d399" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="net_sent_kb" name="Sent" stroke="#fb923c" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        <MetaGrid items={[
          ['Recv Rate', `${fmt(network.bytes_recv_per_sec)}/s`],
          ['Sent Rate', `${fmt(network.bytes_sent_per_sec)}/s`],
          ['TCP Conns', network.connections],
          ['Packets Recv', network.packets_recv],
          ['Packets Sent', network.packets_sent],
        ]} />
      </Section>
    </div>
  );
}
