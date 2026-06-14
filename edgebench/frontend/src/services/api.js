import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE, timeout: 30000 });

// ── Metrics ──────────────────────────────────────────────────────────────────
export const getMetrics       = () => api.get('/api/v1/metrics/current').then(r => r.data);
export const getMetricsHistory= (limit=100) => api.get(`/api/v1/metrics/history?limit=${limit}`).then(r => r.data);
export const getMetricsSummary= () => api.get('/api/v1/metrics/summary').then(r => r.data);

// ── Processes ────────────────────────────────────────────────────────────────
export const getProcesses    = (sortBy='cpu', limit=50) => api.get(`/api/v1/processes/?sort_by=${sortBy}&limit=${limit}`).then(r => r.data);
export const getTopCPU       = (limit=10) => api.get(`/api/v1/processes/top-cpu?limit=${limit}`).then(r => r.data);
export const getTopMemory    = (limit=10) => api.get(`/api/v1/processes/top-memory?limit=${limit}`).then(r => r.data);
export const searchProcesses = (name) => api.get(`/api/v1/processes/search?name=${encodeURIComponent(name)}`).then(r => r.data);
export const getZombies      = () => api.get('/api/v1/processes/zombies').then(r => r.data);

// ── Benchmarks ───────────────────────────────────────────────────────────────
export const runCPUBenchmark    = () => api.post('/api/v1/benchmarks/cpu').then(r => r.data);
export const runMemBenchmark    = () => api.post('/api/v1/benchmarks/memory').then(r => r.data);
export const runDiskBenchmark   = () => api.post('/api/v1/benchmarks/disk').then(r => r.data);
export const runAllBenchmarks   = () => api.post('/api/v1/benchmarks/all').then(r => r.data);
export const getBenchmarkHistory= (limit=50, type=null) =>
  api.get(`/api/v1/benchmarks/history?limit=${limit}${type ? `&benchmark_type=${type}` : ''}`).then(r => r.data);

// ── Docker ───────────────────────────────────────────────────────────────────
export const getDockerStatus    = () => api.get('/api/v1/docker/status').then(r => r.data);
export const getContainers      = (all=false) => api.get(`/api/v1/docker/containers?all=${all}`).then(r => r.data);
export const getContainerLogs   = (id, tail=100) => api.get(`/api/v1/docker/containers/${id}/logs?tail=${tail}`).then(r => r.data);

// ── Diagnostics ──────────────────────────────────────────────────────────────
export const pingHost     = (target, count=4) => api.post('/api/v1/diagnostics/ping', { target, count }).then(r => r.data);
export const dnsLookup    = (hostname) => api.post('/api/v1/diagnostics/dns', { hostname }).then(r => r.data);
export const portScan     = (target, ports) => api.post('/api/v1/diagnostics/port-scan', { target, ports }).then(r => r.data);
export const checkConnectivity = () => api.get('/api/v1/diagnostics/connectivity').then(r => r.data);

// ── Alerts ───────────────────────────────────────────────────────────────────
export const getAlerts      = (resolved=null) => api.get(`/api/v1/alerts/${resolved !== null ? `?resolved=${resolved}` : ''}`).then(r => r.data);
export const getActiveAlerts= () => api.get('/api/v1/alerts/active').then(r => r.data);
export const getAlertStats  = () => api.get('/api/v1/alerts/stats').then(r => r.data);
export const resolveAlert   = (id) => api.put(`/api/v1/alerts/${id}/resolve`).then(r => r.data);
export const getThresholds  = () => api.get('/api/v1/alerts/thresholds').then(r => r.data);

// ── Analytics ────────────────────────────────────────────────────────────────
export const getTrends         = (period='1h') => api.get(`/api/v1/analytics/trends?period=${period}`).then(r => r.data);
export const getAnalyticsSummary = () => api.get('/api/v1/analytics/summary').then(r => r.data);
export const getBenchmarkTrends  = () => api.get('/api/v1/analytics/benchmark-history').then(r => r.data);

// ── Reports ──────────────────────────────────────────────────────────────────
export const getReportJSON = () => api.get('/api/v1/reports/json').then(r => r.data);
export const getReportHTML = () => `${BASE}/api/v1/reports/html`;

export const WS_URL = BASE.replace('http', 'ws') + '/ws';

export default api;
