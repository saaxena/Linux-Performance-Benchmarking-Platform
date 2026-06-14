import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Cpu, Activity, Gauge, Container, Network,
  Bell, BarChart3, FileText, ChevronLeft, ChevronRight, Zap, AlertTriangle
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import SystemMetrics from './components/SystemMetrics';
import ProcessAnalyzer from './components/ProcessAnalyzer';
import BenchmarkEngine from './components/BenchmarkEngine';
import DockerMonitor from './components/DockerMonitor';
import Diagnostics from './components/Diagnostics';
import AlertsPanel from './components/AlertsPanel';
import Analytics from './components/Analytics';
import Reports from './components/Reports';
import { getActiveAlerts } from './services/api';

const NAV = [
  { path: '/',           label: 'Dashboard',   icon: LayoutDashboard },
  { path: '/metrics',    label: 'Metrics',     icon: Activity },
  { path: '/processes',  label: 'Processes',   icon: Cpu },
  { path: '/benchmarks', label: 'Benchmarks',  icon: Gauge },
  { path: '/docker',     label: 'Docker',      icon: Container },
  { path: '/diagnostics',label: 'Diagnostics', icon: Network },
  { path: '/alerts',     label: 'Alerts',      icon: Bell },
  { path: '/analytics',  label: 'Analytics',   icon: BarChart3 },
  { path: '/reports',    label: 'Reports',     icon: FileText },
];

function Sidebar({ collapsed, setCollapsed, alertCount }) {
  return (
    <aside style={{
      width: collapsed ? 64 : 220,
      minHeight: '100vh',
      background: '#1e293b',
      borderRight: '1px solid #334155',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #334155', minHeight: 64 }}>
        <Zap size={22} color="#38bdf8" strokeWidth={2.5} style={{ flexShrink: 0 }} />
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#38bdf8', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
            EdgeBench
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0.5rem 0' }}>
        {NAV.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0.6rem 1rem',
              textDecoration: 'none',
              color: isActive ? '#38bdf8' : '#94a3b8',
              background: isActive ? 'rgba(56,189,248,0.08)' : 'transparent',
              borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s',
              position: 'relative',
            })}
          >
            <Icon size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
            {!collapsed && label === 'Alerts' && alertCount > 0 && (
              <span style={{
                marginLeft: 'auto', background: '#ef4444', color: '#fff',
                borderRadius: 10, padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700,
              }}>{alertCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0.75rem', border: 'none', background: 'transparent',
          color: '#64748b', cursor: 'pointer', borderTop: '1px solid #334155',
        }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}

function AppContent() {
  const [collapsed, setCollapsed] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const fetchAlerts = () => {
      getActiveAlerts().then(a => setAlertCount(a.length)).catch(() => {});
    };
    fetchAlerts();
    const id = setInterval(fetchAlerts, 30000);
    return () => clearInterval(id);
  }, []);

  const pageTitle = NAV.find(n => n.path === location.pathname)?.label || 'EdgeBench';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} alertCount={alertCount} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          height: 64, background: '#1e293b', borderBottom: '1px solid #334155',
          display: 'flex', alignItems: 'center', padding: '0 1.5rem',
          justifyContent: 'space-between', flexShrink: 0,
        }}>
          <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>{pageTitle}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {alertCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontSize: '0.8rem' }}>
                <AlertTriangle size={14} />
                <span>{alertCount} active alert{alertCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            <div style={{
              background: '#0f172a', border: '1px solid #334155', borderRadius: 6,
              padding: '4px 10px', fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace',
            }}>
              v1.0.0
            </div>
          </div>
        </header>

        {/* Main content */}
        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          <Routes>
            <Route path="/"            element={<Dashboard />} />
            <Route path="/metrics"     element={<SystemMetrics />} />
            <Route path="/processes"   element={<ProcessAnalyzer />} />
            <Route path="/benchmarks"  element={<BenchmarkEngine />} />
            <Route path="/docker"      element={<DockerMonitor />} />
            <Route path="/diagnostics" element={<Diagnostics />} />
            <Route path="/alerts"      element={<AlertsPanel />} />
            <Route path="/analytics"   element={<Analytics />} />
            <Route path="/reports"     element={<Reports />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
