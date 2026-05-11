import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ──────────────────────────────────────────────────────────────────
interface User {
  name: string;
  email: string;
  initials: string;
  profileType: string;
  profileName: string;
}

interface Stock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  shares?: number;
}

interface Portfolio {
  totalValue: number;
  todayChange: number;
  todayChangePercent: number;
  allTimeChangePercent: number;
  holdings: Stock[];
}

// ── Initial Data ───────────────────────────────────────────────────────────
const initialPortfolio: Portfolio = {
  totalValue: 12450,
  todayChange: 172,
  todayChangePercent: 1.4,
  allTimeChangePercent: 8.2,
  holdings: [
    { ticker: 'SABIC',  name: 'Saudi Basic Industries', price: 130.20, change: 3.1,  shares: 40 },
    { ticker: 'STC',    name: 'Saudi Telecom Company',  price: 84.50,  change: 0.8,  shares: 25 },
    { ticker: 'Aramco', name: 'Saudi Aramco',           price: 26.55,  change: -1.2, shares: 15 },
  ],
};

const initialWatchlist: Stock[] = [
  { ticker: 'SABIC',  name: 'Saudi Basic Industries', price: 130.20, change: 2.4 },
  { ticker: 'Maaden', name: 'Saudi Arabian Mining',   price: 57.30,  change: 1.1 },
];

// ══════════════════════════════════════════════════════════════════════════
// Context 1 — Auth (User + UserId)
// يتغير فقط عند login / logout
// ══════════════════════════════════════════════════════════════════════════
interface AuthContextType {
  user: User | null;
  userId: string | null;
  setUser: (user: User) => void;
  setUserId: (id: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ══════════════════════════════════════════════════════════════════════════
// Context 2 — Portfolio
// يتغير فقط عند تحديث المحفظة
// ══════════════════════════════════════════════════════════════════════════
interface PortfolioContextType {
  portfolio: Portfolio;
  watchlist: Stock[];
  setPortfolio: (portfolio: Portfolio) => void;
  setWatchlist: (watchlist: Stock[]) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

// ══════════════════════════════════════════════════════════════════════════
// Context 3 — Quiz
// يتغير فقط أثناء الـ Quiz flow
// ══════════════════════════════════════════════════════════════════════════
interface QuizContextType {
  quizAnswers: number[];
  setQuizAnswer: (questionIndex: number, answer: number) => void;
  resetQuiz: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

// ══════════════════════════════════════════════════════════════════════════
// AppProvider — يجمع الثلاثة
// ══════════════════════════════════════════════════════════════════════════
export function AppProvider({ children }: { children: ReactNode }) {
  // ── Auth State ───────────────────────────────────────────────────────────
  const [user, setUserState] = useState<User | null>(null);
  const [userId, setUserIdState] = useState<string | null>(null);
  const manuallySet = useRef(false);

  // ── Portfolio State ──────────────────────────────────────────────────────
  const [portfolio, setPortfolioState] = useState<Portfolio>(initialPortfolio);
  const [watchlist, setWatchlistState] = useState<Stock[]>(initialWatchlist);

  // ── Quiz State ───────────────────────────────────────────────────────────
  const [quizAnswers, setQuizAnswers] = useState<number[]>([-1, -1, -1, -1]);

  // ── Load userId من AsyncStorage — لا تكتب فوق لو المستخدم سجّل دخول أسرع
  useEffect(() => {
    AsyncStorage.getItem('user_id').then(id => {
      if (id && !manuallySet.current) setUserIdState(id);
    });
  }, []);

  // ── Auth Actions ─────────────────────────────────────────────────────────
  const setUser = useCallback((u: User) => setUserState(u), []);

  const setUserId = useCallback((id: string | null) => {
    manuallySet.current = true;
    if (id) AsyncStorage.setItem('user_id', id);
    else AsyncStorage.removeItem('user_id');
    setUserIdState(id);
  }, []);

  const logout = useCallback(() => {
    AsyncStorage.removeItem('user_id');
    setUserIdState(null);
    setUserState(null);
  }, []);

  // ── Portfolio Actions ─────────────────────────────────────────────────────
  const setPortfolio = useCallback((p: Portfolio) => setPortfolioState(p), []);
  const setWatchlist = useCallback((w: Stock[]) => setWatchlistState(w), []);

  // ── Quiz Actions ──────────────────────────────────────────────────────────
  const setQuizAnswer = useCallback((questionIndex: number, answer: number) => {
    setQuizAnswers(prev => {
      const updated = [...prev];
      updated[questionIndex] = answer;
      return updated;
    });
  }, []);

  const resetQuiz = useCallback(() => {
    setQuizAnswers([-1, -1, -1, -1]);
  }, []);

  // ── Memoized Values ───────────────────────────────────────────────────────
  const authValue = useMemo(
    () => ({ user, userId, setUser, setUserId, logout }),
    [user, userId, setUser, setUserId, logout]
  );

  const portfolioValue = useMemo(
    () => ({ portfolio, watchlist, setPortfolio, setWatchlist }),
    [portfolio, watchlist, setPortfolio, setWatchlist]
  );

  const quizValue = useMemo(
    () => ({ quizAnswers, setQuizAnswer, resetQuiz }),
    [quizAnswers, setQuizAnswer, resetQuiz]
  );

  return (
    <AuthContext.Provider value={authValue}>
      <PortfolioContext.Provider value={portfolioValue}>
        <QuizContext.Provider value={quizValue}>
          {children}
        </QuizContext.Provider>
      </PortfolioContext.Provider>
    </AuthContext.Provider>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Hooks — استخدم اللي تحتاجه بس
// ══════════════════════════════════════════════════════════════════════════

// للشاشات اللي تحتاج بيانات المستخدم فقط
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AppProvider');
  return ctx;
}

// للشاشات اللي تحتاج المحفظة فقط
export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within AppProvider');
  return ctx;
}

// للشاشات اللي تحتاج الـ Quiz فقط
export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz must be used within AppProvider');
  return ctx;
}

// للتوافق مع الكود القديم — بس حاول تستبدله بالـ hooks الجديدة
export function useApp() {
  const auth = useAuth();
  const portfolio = usePortfolio();
  const quiz = useQuiz();
  return { ...auth, ...portfolio, ...quiz };
}