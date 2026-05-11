const BASE_URL = 'http://172.30.55.184:8000';
const FINNHUB_KEY = 'd6d85h1r01qgk7mkutb0d6d85h1r01qgk7mkutbg';

// ── Timeout Helper ─────────────────────────────────────────────────────────
const DEFAULT_TIMEOUT = 10000; // 10 ثانية

const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`انتهت مهلة الطلب (${timeout / 1000}s): ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

// ── Cache Layer ────────────────────────────────────────────────────────────
const cache = new Map<string, { data: any; expiry: number }>();

const cachedFetch = async (
  url: string,
  ttlMs: number = 30000 // 30 ثانية افتراضي
): Promise<any> => {
  const now = Date.now();
  const cached = cache.get(url);

  if (cached && now < cached.expiry) {
    return cached.data;
  }

  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  cache.set(url, { data, expiry: now + ttlMs });
  return data;
};

// ── Retry Helper ───────────────────────────────────────────────────────────
const fetchWithRetry = async (
  fn: () => Promise<any>,
  retries: number = 2,
  delay: number = 1000
): Promise<any> => {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    await new Promise<void>(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(fn, retries - 1, delay * 1.5);
  }
};

// ── Finnhub ────────────────────────────────────────────────────────────────
export const getDirectQuote = async (symbol: string) => {
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`;
  return cachedFetch(url, 15000); // cache 15 ثانية لأسعار السوق
};

// ── API ────────────────────────────────────────────────────────────────────
export const API = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  register: async (name: string, email: string, password: string) => {
    const res = await fetchWithTimeout(
      `${BASE_URL}/auth/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      },
      15000
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'فشل التسجيل');
    return data;
  },

  login: async (email: string, password: string) => {
    const res = await fetchWithTimeout(
      `${BASE_URL}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      },
      15000
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'فشل تسجيل الدخول');
    return data;
  },

  // ── Portfolio ─────────────────────────────────────────────────────────────
  getPortfolio: async (userId: string) => {
    return fetchWithRetry(() =>
      cachedFetch(`${BASE_URL}/portfolio/${userId}`, 20000)
    );
  },

  createPortfolio: async (userId: string) => {
    const res = await fetchWithTimeout(
      `${BASE_URL}/portfolio/create`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      }
    );
    if (!res.ok) throw new Error('فشل إنشاء المحفظة');
    return res.json();
  },

  fundPortfolio: async (userId: string, amount: number) => {
    const res = await fetchWithTimeout(
      `${BASE_URL}/portfolio/fund`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, amount }),
      }
    );
    if (!res.ok) throw new Error('فشل تحديث الرصيد');
    return res.json();
  },

  analyzeStock: async (symbol: string) => {
    return fetchWithRetry(() =>
      cachedFetch(`${BASE_URL}/portfolio/analyze/${symbol}`, 60000) // cache دقيقة للتحليل
    );
  },

  // ── Market Data ───────────────────────────────────────────────────────────
  quote: async (symbol: string) => {
    return fetchWithRetry(() =>
      cachedFetch(`${BASE_URL}/quote/${symbol}`, 15000)
    );
  },

  // ── Manual Trade ──────────────────────────────────────────────────────────
  buy: async (userId: string, symbol: string, budget: number) => {
    // امسح الـ cache بعد أي trade
    cache.forEach((_, key) => {
      if (key.includes(userId)) cache.delete(key);
    });

    const res = await fetchWithTimeout(
      `${BASE_URL}/trade/buy`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, symbol, budget }),
      },
      20000
    );
    const buyData = await res.json();
    if (!res.ok) throw new Error(buyData.detail || 'فشلت عملية الشراء');
    return buyData;
  },

  sell: async (userId: string, symbol: string, quantity: number) => {
    cache.forEach((_, key) => {
      if (key.includes(userId)) cache.delete(key);
    });

    const res = await fetchWithTimeout(
      `${BASE_URL}/trade/sell`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, symbol, quantity }),
      },
      20000
    );
    const sellData = await res.json();
    if (!res.ok) throw new Error(sellData.detail || 'فشلت عملية البيع');
    return sellData;
  },

  // ── AI Trade ──────────────────────────────────────────────────────────────
  requestProposal: async (userId: string, symbol: string, budget: number) => {
    const res = await fetchWithTimeout(
      `${BASE_URL}/ai/propose`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, symbol, budget }),
      },
      30000 // الـ AI يحتاج وقت أطول
    );
    if (!res.ok) throw new Error('فشل طلب الاقتراح');
    return res.json();
  },

  getProposals: async (userId: string) => {
    return fetchWithRetry(() =>
      cachedFetch(`${BASE_URL}/ai/proposals/${userId}`, 10000)
    );
  },

  approveProposal: async (proposalId: string, userId: string) => {
    cache.forEach((_, key) => {
      if (key.includes(userId)) cache.delete(key);
    });

    const res = await fetchWithTimeout(
      `${BASE_URL}/ai/proposal/${proposalId}/approve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      },
      20000
    );
    if (!res.ok) throw new Error('فشل قبول الاقتراح');
    return res.json();
  },

  rejectProposal: async (proposalId: string, userId: string) => {
    cache.forEach((_, key) => {
      if (key.includes(userId)) cache.delete(key);
    });

    const res = await fetchWithTimeout(
      `${BASE_URL}/ai/proposal/${proposalId}/reject`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      },
      20000
    );
    if (!res.ok) throw new Error('فشل رفض الاقتراح');
    return res.json();
  },

  // ── AI Execute ───────────────────────────────────────────────────────────
  executePlan: async (userId: string, plan: any) => {
    cache.forEach((_, key) => {
      if (key.includes(userId)) cache.delete(key);
    });

    const res = await fetchWithTimeout(
      `${BASE_URL}/ai-analysis/execute`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, plan }),
      },
      60000
    );
    const execData = await res.json();
    if (!res.ok) throw new Error(execData.detail || 'فشل تنفيذ الخطة');
    return execData;
  },

  // ── Cache Utils ───────────────────────────────────────────────────────────
  clearCache: () => cache.clear(),
  clearUserCache: (userId: string) => {
    cache.forEach((_, key) => {
      if (key.includes(userId)) cache.delete(key);
    });
  },
};