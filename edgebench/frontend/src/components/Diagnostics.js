import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Globe, Wifi, Search, Radio } from 'lucide-react';
import { pingHost, dnsLookup, portScan, checkConnectivity } from '../services/api';

const Btn = ({ onClick, loading, children, color = '#38bdf8' }) => (
  <button onClick={onClick} disabled={loading} style={{
    padding: '8px 18px', background: `${color}18`, border: `1px solid ${color}`, borderRadius: 8,
    color, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.82rem',
    display: 'flex', alignItems: 'center', gap: 6, opacity: loading ? 0.6 : 1,
  }}>
    <Play size={14} />{loading ? 'Running…' : children}
  </button>
);

const Input = ({ value, onChange, placeholder }) => (
  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
    flex: 1, padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
    color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', minWidth: 0,
  }} />
);

const Card = ({ title, icon: Icon, color, children }) => (
  <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1.25rem', marginBottom: 16 }}>
    <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ background: `${color}18`, borderRadius: 8, padding: 6 }}><Icon size={16} color={color} /></span>{title}
    </h3>
    {children}
  </div>
);

const ResultBox = ({ data }) => {
  if (!data) return null;
  const isErr = data.success === false || data.error;
  return (
    <div style={{ marginTop: 12, background: '#0f172a', border: `1px solid ${isErr ? '#ef4444' : '#22c55e'}30`, borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: '0.8rem', fontWeight: 600, color: isErr ? '#ef4444' : '#22c55e' }}>
        {isErr ? <XCircle size={14} /> : <CheckCircle size={14} />}
        {isErr ? 'Failed' : 'Success'}
      </div>
      <pre style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 300, overflowY: 'auto' }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

export default function Diagnostics() {
  const [pingTarget, setPingTarget] = useState('8.8.8.8');
  const [pingResult, setPingResult] = useState(null);
  const [pingLoading, setPingLoading] = useState(false);

  const [dnsTarget, setDnsTarget] = useState('google.com');
  const [dnsResult, setDnsResult] = useState(null);
  const [dnsLoading, setDnsLoading] = useState(false);

  const [scanTarget, setScanTarget] = useState('localhost');
  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);

  const [connResult, setConnResult] = useState(null);
  const [connLoading, setConnLoading] = useState(false);

  const runPing = async () => {
    setPingLoading(true); setPingResult(null);
    try { setPingResult(await pingHost(pingTarget)); } catch (e) { setPingResult({ success: false, error: e.message }); }
    setPingLoading(false);
  };

  const runDNS = async () => {
    setDnsLoading(true); setDnsResult(null);
    try { setDnsResult(await dnsLookup(dnsTarget)); } catch (e) { setDnsResult({ success: false, error: e.message }); }
    setDnsLoading(false);
  };

  const runPortScan = async () => {
    setScanLoading(true); setScanResult(null);
    try { setScanResult(await portScan(scanTarget)); } catch (e) { setScanResult({ success: false, error: e.message }); }
    setScanLoading(false);
  };

  const runConn = async () => {
    setConnLoading(true); setConnResult(null);
    try { setConnResult(await checkConnectivity()); } catch (e) { setConnResult({ error: e.message }); }
    setConnLoading(false);
  };

  return (
    <div>
      {/* Ping */}
      <Card title="Ping Test" icon={Radio} color="#38bdf8">
        <div style={{ display: 'flex', gap: 10 }}>
          <Input value={pingTarget} onChange={setPingTarget} placeholder="Host or IP (e.g. 8.8.8.8)" />
          <Btn onClick={runPing} loading={pingLoading} color="#38bdf8">Ping</Btn>
        </div>
        {pingResult && (
          <div style={{ marginTop: 12 }}>
            {pingResult.output && (
              <pre style={{ background: '#0f172a', borderRadius: 8, padding: '10px 14px', fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0, maxHeight: 200, overflowY: 'auto' }}>
                {pingResult.output}
              </pre>
            )}
            {!pingResult.output && <ResultBox data={pingResult} />}
          </div>
        )}
      </Card>

      {/* DNS */}
      <Card title="DNS Lookup" icon={Globe} color="#a78bfa">
        <div style={{ display: 'flex', gap: 10 }}>
          <Input value={dnsTarget} onChange={setDnsTarget} placeholder="Hostname (e.g. google.com)" />
          <Btn onClick={runDNS} loading={dnsLoading} color="#a78bfa">Lookup</Btn>
        </div>
        {dnsResult && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              {dnsResult.success ? <CheckCircle size={14} color="#22c55e" /> : <XCircle size={14} color="#ef4444" />}
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: dnsResult.success ? '#22c55e' : '#ef4444' }}>
                {dnsResult.success ? `Resolved in ${dnsResult.duration_ms}ms` : dnsResult.error}
              </span>
            </div>
            {dnsResult.addresses?.map(a => (
              <div key={a} style={{ background: '#0f172a', borderRadius: 6, padding: '6px 12px', marginBottom: 4, fontFamily: 'monospace', fontSize: '0.82rem', color: '#38bdf8' }}>
                {a}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Port Scan */}
      <Card title="Port Scanner" icon={Search} color="#34d399">
        <div style={{ display: 'flex', gap: 10 }}>
          <Input value={scanTarget} onChange={setScanTarget} placeholder="Host (e.g. localhost, 192.168.1.1)" />
          <Btn onClick={runPortScan} loading={scanLoading} color="#34d399">Scan</Btn>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: '0.73rem', color: '#64748b' }}>
          Scanning common ports: 21, 22, 80, 443, 3306, 5432, 6379, 8000, 8080, 27017…
        </p>
        {scanResult && !scanResult.error && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 8 }}>
              Scanned {scanResult.ports_scanned} ports in {scanResult.duration_seconds}s
              — {scanResult.open_ports?.length} open
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {scanResult.all_results?.map(r => (
                <span key={r.port} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontFamily: 'monospace',
                  background: r.status === 'open' ? '#22c55e20' : '#1e293b',
                  color: r.status === 'open' ? '#22c55e' : '#475569',
                  border: `1px solid ${r.status === 'open' ? '#22c55e50' : '#334155'}`,
                  fontWeight: r.status === 'open' ? 700 : 400,
                }}>
                  {r.port} {r.status === 'open' ? '✓' : ''}
                </span>
              ))}
            </div>
          </div>
        )}
        {scanResult?.error && <ResultBox data={scanResult} />}
      </Card>

      {/* Connectivity */}
      <Card title="Internet Connectivity" icon={Wifi} color="#fb923c">
        <Btn onClick={runConn} loading={connLoading} color="#fb923c">Check Connectivity</Btn>
        {connResult && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              {connResult.internet_available ? <CheckCircle size={16} color="#22c55e" /> : <XCircle size={16} color="#ef4444" />}
              <span style={{ fontWeight: 600, color: connResult.internet_available ? '#22c55e' : '#ef4444', fontSize: '0.875rem' }}>
                Internet {connResult.internet_available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            {connResult.results?.map(r => (
              <div key={r.host + r.port} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#0f172a', borderRadius: 6, marginBottom: 4, fontSize: '0.78rem' }}>
                <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{r.host}:{r.port}</span>
                <span style={{ color: r.status === 'reachable' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                  {r.status === 'reachable' ? `✓ ${r.rtt_ms}ms` : '✗ unreachable'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
