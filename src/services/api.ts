// ── تغيير الـ IP هنا فقط ─────────────────────────────────────────────────────
export const BASE_URL = 'http://10.24.143.136:8000';
const FINNHUB_KEY = 'd6d85h1r01qgk7mkutb0d6d85h1r01qgk7mkutbg';

// ── Auth Token ────────────────────────────────────────────────────────────────
let authToken: string | null = null;
export const setAuthToken = (token: string | null) => { authToken = token; };
export const getAuthToken = () => authToken;

const authHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
});

// ── Timeout Helper ────────────────────────────────────────────────────────────
const DEFAULT_TIMEOUT = 10000;

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout: number = DEFAULT_TIMEOUT): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error(`انتهت مهلة الطلب (${timeout / 1000}s): ${url}`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

// ── Cache Layer ───────────────────────────────────────────────────────────────
const cache = new Map<string, { data: any; expiry: number }>();

const cachedFetch = async (url: string, ttlMs: number = 30000): Promise<any> => {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && now < cached.expiry) return cached.data;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  cache.set(url, { data, expiry: now + ttlMs });
  return data;
};

// ── Retry Helper ──────────────────────────────────────────────────────────────
const fetchWithRetry = async (fn: () => Promise<any>, retries: number = 2, delay: number = 1000): Promise<any> => {
  try { return await fn(); }
  catch (err) {
    if (retries === 0) throw err;
    await new Promise<void>(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(fn, retries - 1, delay * 1.5);
  }
};

// ── Finnhub ───────────────────────────────────────────────────────────────────
export const getDirectQuote = async (symbol: string) => {
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`;
  return cachedFetch(url, 15000);
};

// ── API ───────────────────────────────────────────────────────────────────────
export const API = {
  register: async (name: string, email: string, password: string) => {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name,email,password}) }, 15000);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'فشل التسجيل');
    return data;
  },

  login: async (email: string, password: string) => {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) }, 15000);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'فشل تسجيل الدخول');
    return data;
  },

  forgotPassword: async (email: string) => {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/forgot-password`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email}) }, 15000);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'فشل إرسال طلب إعادة تعيين كلمة المرور');
    return data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/reset-password`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({token, new_password: newPassword}) }, 15000);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'فشل تغيير كلمة المرور');
    return data;
  },

  getPortfolio: async (userId: string) => fetchWithRetry(() => cachedFetch(`${BASE_URL}/portfolio/${userId}`, 20000)),

  createPortfolio: async (userId: string) => {
    const res = await fetchWithTimeout(`${BASE_URL}/portfolio/create`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({user_id:userId}) });
    if (!res.ok) throw new Error('فشل إنشاء المحفظة');
    return res.json();
  },

  fundPortfolio: async (userId: string, amount: number) => {
    const res = await fetchWithTimeout(`${BASE_URL}/portfolio/fund`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({user_id:userId,amount}) });
    if (!res.ok) throw new Error('فشل تحديث الرصيد');
    return res.json();
  },

  analyzeStock: async (symbol: string) => fetchWithRetry(() => cachedFetch(`${BASE_URL}/portfolio/analyze/${symbol}`, 60000)),

  quote: async (symbol: string) => fetchWithRetry(() => cachedFetch(`${BASE_URL}/quote/${symbol}`, 15000)),

  buy: async (userId: string, symbol: string, budget: number) => {
    cache.forEach((_, key) => { if (key.includes(userId)) cache.delete(key); });
    const res = await fetchWithTimeout(`${BASE_URL}/trade/buy`, { method:'POST', headers:authHeaders(), body:JSON.stringify({user_id:userId,symbol,budget}) }, 20000);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'فشلت عملية الشراء');
    return data;
  },

  sell: async (userId: string, symbol: string, quantity: number) => {
    cache.forEach((_, key) => { if (key.includes(userId)) cache.delete(key); });
    const res = await fetchWithTimeout(`${BASE_URL}/trade/sell`, { method:'POST', headers:authHeaders(), body:JSON.stringify({user_id:userId,symbol,quantity}) }, 20000);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'فشلت عملية البيع');
    return data;
  },

  requestProposal: async (userId: string, symbol: string, budget: number) => {
    const res = await fetchWithTimeout(`${BASE_URL}/ai/propose`, { method:'POST', headers:authHeaders(), body:JSON.stringify({user_id:userId,symbol,budget}) }, 30000);
    if (!res.ok) throw new Error('فشل طلب الاقتراح');
    return res.json();
  },

  getProposals: async (userId: string) => fetchWithRetry(() => cachedFetch(`${BASE_URL}/ai/proposals/${userId}`, 10000)),

  approveProposal: async (proposalId: string, userId: string) => {
    cache.forEach((_, key) => { if (key.includes(userId)) cache.delete(key); });
    const res = await fetchWithTimeout(`${BASE_URL}/ai/proposal/${proposalId}/approve`, { method:'POST', headers:authHeaders(), body:JSON.stringify({user_id:userId}) }, 20000);
    if (!res.ok) throw new Error('فشل قبول الاقتراح');
    return res.json();
  },

  rejectProposal: async (proposalId: string, userId: string) => {
    cache.forEach((_, key) => { if (key.includes(userId)) cache.delete(key); });
    const res = await fetchWithTimeout(`${BASE_URL}/ai/proposal/${proposalId}/reject`, { method:'POST', headers:authHeaders(), body:JSON.stringify({user_id:userId}) }, 20000);
    if (!res.ok) throw new Error('فشل رفض الاقتراح');
    return res.json();
  },

  executePlan: async (userId: string, plan: any) => {
    cache.forEach((_, key) => { if (key.includes(userId)) cache.delete(key); });
    const res = await fetchWithTimeout(`${BASE_URL}/ai-analysis/execute`, { method:'POST', headers:authHeaders(), body:JSON.stringify({user_id:userId,plan}) }, 60000);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'فشل تنفيذ الخطة');
    return data;
  },

  clearCache: () => cache.clear(),
  clearUserCache: (userId: string) => { cache.forEach((_, key) => { if (key.includes(userId)) cache.delete(key); }); },
};