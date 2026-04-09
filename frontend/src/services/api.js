import axios from 'axios';

const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

const configuredBaseURL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api';

// Base API instance
const api = axios.create({
  baseURL: configuredBaseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = storage.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally (token expired / invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      storage.remove('token');
      storage.remove('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  sendRegisterOtp: (data) => api.post('/auth/send-register-otp', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyResetOtp: (email, otp) => api.post('/auth/verify-reset-otp', { email, otp }),
  resetPassword: (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, newPassword }),
};

// ─── Wallet ─────────────────────────────────────────────────────────────────
export const walletAPI = {
  getWallet: () => api.get('/wallet'),
};

// ─── Trading ─────────────────────────────────────────────────────────────────
export const tradeAPI = {
  buy: (data) => api.post('/trade/buy', data),
  sell: (data) => api.post('/trade/sell', data),
  getHistory: (page = 1, limit = 20) => api.get(`/trade/history?page=${page}&limit=${limit}`),
};

export const binaryAPI = {
  getSettings:  ()           => api.get('/binary/settings'),
  place:        (data)       => api.post('/binary/place', data),
  getActive:    ()           => api.get('/binary/active'),
  getHistory:   (page = 1)   => api.get(`/binary/history?page=${page}&limit=30`),
  // Admin
  adminGetSettings: ()       => api.get('/binary/admin/settings'),
  adminUpdateSettings: (data)=> api.put('/binary/admin/settings', data),
  adminGetTrades: (page = 1) => api.get(`/binary/admin/trades?page=${page}`),
};

// ─── Transactions ────────────────────────────────────────────────────────────
export const transactionAPI = {
  getAll: (page = 1, limit = 20, type = '') =>
    api.get(`/transactions?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`),
};

// ─── Market ──────────────────────────────────────────────────────────────────
export const marketAPI = {
  getPrices:  ()                       => api.get('/market/prices'),
  getCandles: (symbol, interval = '1m', limit = 120) =>
    api.get(`/market/candles/${symbol}?interval=${interval}&limit=${limit}`),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (page = 1, search = '') => api.get(`/admin/users?page=${page}&search=${search}`),
  getTrades: (page = 1) => api.get(`/admin/trades?page=${page}`),
  modifyBalance: (userId, amount, reason) =>
    api.patch(`/admin/users/${userId}/balance`, { amount, reason }),
  setRole: (userId, role) => api.patch(`/admin/users/${userId}/role`, { role }),
  adjustPlan: (userId, plan, duration) =>
    api.patch(`/admin/users/${userId}/plan`, { plan, duration }),
  banUser: (userId, ban, reason = '') =>
    api.patch(`/admin/users/${userId}/ban`, { ban, reason }),
  setTradeMode: (userId, tradeMode, tradeWinRates) =>
    api.patch(`/admin/users/${userId}/trademode`, { tradeMode, tradeWinRates }),
};

// ─── Plans ───────────────────────────────────────────────────────────────────
export const planAPI = {
  getPlans: () => api.get('/plans'),
  purchasePlan: (planName) => api.post('/plans/purchase', { planName }),
  getMyPlan: () => api.get('/plans/my'),
};

// ─── Recharge ────────────────────────────────────────────────────────────────
export const rechargeAPI = {
  recharge: (amount) => api.post('/recharge', { amount }),
  getHistory: (page = 1) => api.get(`/recharge/history?page=${page}`),
};

// ─── Deposit ─────────────────────────────────────────────────────────────────
export const depositAPI = {
  getAddresses: () => api.get('/deposit/addresses'),
  submit: (formData) => api.post('/deposit/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getHistory: (page = 1) => api.get(`/deposit/history?page=${page}`),
};

// ─── Admin Deposit ────────────────────────────────────────────────────────────
// ─── Settings ────────────────────────────────────────────────────────────────
export const settingsAPI = {
  getSupport: () => api.get('/settings/support'),
  getAll: () => api.get('/settings/all'),
  save: (key, value) => api.put('/settings', { key, value }),
};

// ─── Profile ──────────────────────────────────────────────────────────────────
export const profileAPI = {
  update: (data) => api.put('/auth/profile', data),
  reviewKyc: (userId, status) => api.patch(`/admin/users/${userId}/kyc`, { status }),
};

export const adminDepositAPI = {
  getAddresses: () => api.get('/admin/deposit-addresses'),
  addAddress: (data) => api.post('/admin/deposit-addresses', data),
  updateAddress: (id, data) => api.put(`/admin/deposit-addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/admin/deposit-addresses/${id}`),
  getRequests: (page = 1, status = '') => api.get(`/admin/deposit-requests?page=${page}&status=${status}`),
  approve: (id, adminNote = '') => api.patch(`/admin/deposit-requests/${id}/approve`, { adminNote }),
  reject: (id, adminNote = '') => api.patch(`/admin/deposit-requests/${id}/reject`, { adminNote }),
};

export const planPurchaseAPI = {
  getAll: (page = 1) => api.get(`/admin/plan-purchases?page=${page}`),
};

// ─── Transfer ─────────────────────────────────────────────────────────────────
export const transferAPI = {
  send: (data) => api.post('/transfer', data),
  history: () => api.get('/transfer/history'),
};

// ─── Withdraw ─────────────────────────────────────────────────────────────────
export const withdrawAPI = {
  submit: (data) => api.post('/withdraw/submit', data),
  sendOtp: (data) => api.post('/withdraw/send-otp', data),
  verifyOtp: (otp) => api.post('/withdraw/verify-otp', { otp }),
  history: (page = 1) => api.get(`/withdraw/history?page=${page}`),
};

// ─── Admin Withdraw ───────────────────────────────────────────────────────────
export const adminWithdrawAPI = {
  getRequests: (page = 1, status = '') => api.get(`/admin/withdraw-requests?page=${page}&status=${status}`),
  approve: (id, adminNote = '') => api.patch(`/admin/withdraw-requests/${id}/approve`, { adminNote }),
  reject: (id, adminNote = '') => api.patch(`/admin/withdraw-requests/${id}/reject`, { adminNote }),
};

// ─── Agent ────────────────────────────────────────────────────────────────────
export const agentAPI = {
  getUsers: (page = 1, search = '') => api.get(`/agent/users?page=${page}&search=${search}`),
  reviewKyc: (userId, status) => api.patch(`/agent/users/${userId}/kyc`, { status }),
  setTradeMode: (userId, tradeMode) => api.patch(`/agent/users/${userId}/trademode`, { tradeMode }),
  getDepositRequests: (page = 1, status = '') => api.get(`/agent/deposit-requests?page=${page}&status=${status}`),
  approveDeposit: (id, adminNote = '') => api.patch(`/agent/deposit-requests/${id}/approve`, { adminNote }),
  rejectDeposit: (id, adminNote = '') => api.patch(`/agent/deposit-requests/${id}/reject`, { adminNote }),
  getWithdrawRequests: (page = 1, status = '') => api.get(`/agent/withdraw-requests?page=${page}&status=${status}`),
  approveWithdraw: (id, adminNote = '') => api.patch(`/agent/withdraw-requests/${id}/approve`, { adminNote }),
  rejectWithdraw: (id, adminNote = '') => api.patch(`/agent/withdraw-requests/${id}/reject`, { adminNote }),
  modifyBalance: (userId, amount, reason) => api.patch(`/agent/users/${userId}/balance`, { amount, reason }),
};

// ─── Admin Agent Management ───────────────────────────────────────────────────
export const adminAgentAPI = {
  listAgents: () => api.get('/admin/agents'),
  createAgent: (data) => api.post('/admin/agents', data),
  setPermissions: (id, permissions) => api.patch(`/admin/agents/${id}/permissions`, { permissions }),
  banAgent: (id, ban, reason = '') => api.patch(`/admin/agents/${id}/ban`, { ban, reason }),
};

export default api;
