import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  ActivityIndicator, LayoutAnimation, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, UIManager, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { API } from '../services/api';
import { useAuth } from '../context/AppContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TradeHistoryScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

interface TransactionItem {
  symbol: string;
  action: string;
  price: number;
  quantity: number;
  created_at?: string;
}

interface PortfolioResponse {
  id: number;
  user_id: string;
  cash_balance: number;
  positions: any[];
  transactions: TransactionItem[];
}

type Trade = {
  id: string;
  ticker: string;
  companyName: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  total: number;
  date: string;
  time: string;
  orderType: string;
};

const COMPANY_NAMES: Record<string, string> = {
  '2222': 'Saudi Aramco', '2010': 'Saudi Basic Industries', '1120': 'Al Rajhi Bank',
  '1180': 'Saudi National Bank', '1150': 'Alinma Bank', '7010': 'Saudi Telecom Company',
  '7020': 'Mobily', '7030': 'Zain Saudi Arabia', '7040': 'Saudi Telecom Towers',
  '4002': 'Saudi Healthcare Holding', '4004': 'Mouwasat Medical Services',
  '4020': 'Emaar Economic City', '2060': 'Yanbu National Petrochemical',
  '2082': 'ACWA Power', '4030': 'Saudi Electricity Company',
  'AAPL': 'Apple', 'MSFT': 'Microsoft', 'NVDA': 'NVIDIA', 'TSLA': 'Tesla',
  'JPM': 'JPMorgan Chase', 'BAC': 'Bank of America', 'WFC': 'Wells Fargo',
  'GS': 'Goldman Sachs', 'JNJ': 'Johnson and Johnson', 'UNH': 'UnitedHealth Group',
  'PFE': 'Pfizer', 'ABBV': 'AbbVie', 'XOM': 'ExxonMobil', 'CVX': 'Chevron',
  'COP': 'ConocoPhillips', 'SLB': 'Schlumberger', 'LIN': 'Linde',
  'APD': 'Air Products and Chemicals', 'ECL': 'Ecolab', 'T': 'AT&T',
  'VZ': 'Verizon Communications', 'TMUS': 'T-Mobile', 'AMT': 'American Tower',
  'PLD': 'Prologis', 'EQIX': 'Equinix', 'NEE': 'NextEra Energy',
  'DUK': 'Duke Energy', 'SO': 'Southern Company',
};

// ── Helpers ────────────────────────────────────────────────────────────────
const formatSar = (value: number) =>
  `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;

const formatDate = (dateValue?: string) => {
  if (!dateValue) return 'Today';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Today';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateValue?: string) => {
  if (!dateValue) return '--';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// ── Detail Row ─────────────────────────────────────────────────────────────
const DetailRow = React.memo(({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
  <View style={detail.row}>
    <Text style={detail.label}>{label}</Text>
    <Text style={[detail.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
  </View>
));

const detail = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
  label: { color: colors.gray500, fontSize: 13 },
  value: { color: colors.white, fontSize: 13, fontWeight: '600' },
});

const BUY_BG   = 'rgba(29,158,117,0.2)';
const BUY_TEXT = '#1D9E75';
const SELL_BG  = 'rgba(226,75,74,0.2)';
const SELL_TEXT = '#E24B4A';

// ── Trade Card ─────────────────────────────────────────────────────────────
const TradeCard = React.memo(({ trade }: { trade: Trade }) => {
  const [expanded, setExpanded] = useState(false);
  const isBuy      = trade.type === 'buy';
  const typeColor  = isBuy ? BUY_TEXT : SELL_TEXT;
  const typeBg     = isBuy ? BUY_BG : SELL_BG;

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(v => !v);
  }, []);

  return (
    <TouchableOpacity style={[card.wrap, expanded && card.wrapExpanded]} onPress={toggle} activeOpacity={0.85}>
      <View style={card.topRow}>
        <View style={[card.typeCircle, { backgroundColor: typeBg }]}>
          <Text style={[card.typeText, { color: typeColor }]}>{trade.type.toUpperCase()}</Text>
        </View>
        <View style={card.nameCol}>
          <Text style={card.assetName} numberOfLines={1}>{trade.companyName}</Text>
          <Text style={card.assetTicker}>{trade.ticker}</Text>
        </View>
        <Text style={card.totalAmount}>{formatSar(trade.total)}</Text>
      </View>
      <View style={card.bottomRow}>
        <Text style={card.metaText}>{trade.date} · {trade.orderType}</Text>
        <Text style={card.metaText}>{Number(trade.shares.toFixed(4))} shares</Text>
      </View>
      {expanded && (
        <View style={card.expandedSection}>
          <View style={card.expandedDivider} />
          <DetailRow label="Price per share" value={formatSar(trade.price)} />
          <View style={card.innerDivider} />
          <DetailRow label="Total" value={formatSar(trade.total)} />
          <View style={card.innerDivider} />
          <DetailRow label="Status" value="Executed" valueColor={colors.green} />
          <View style={card.innerDivider} />
          <DetailRow label="Transaction ID" value={`#${trade.id}`} />
          <View style={card.innerDivider} />
          <DetailRow label="Time" value={trade.time} />
        </View>
      )}
    </TouchableOpacity>
  );
});

const card = StyleSheet.create({
  wrap:            { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10 },
  wrapExpanded:    { borderTopColor: colors.accent, borderTopWidth: 1 },
  topRow:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeCircle:      { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  typeText:        { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  nameCol:         { flex: 1 },
  assetName:       { color: colors.white, fontSize: 14, fontWeight: '700' },
  assetTicker:     { color: colors.gray500, fontSize: 11, marginTop: 1 },
  totalAmount:     { color: colors.white, fontSize: 15, fontWeight: '700', flexShrink: 0 },
  bottomRow:       { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingLeft: 46 },
  metaText:        { color: colors.gray500, fontSize: 12 },
  expandedSection: { marginTop: 4 },
  expandedDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginTop: 8, marginBottom: 2 },
  innerDivider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
});

// ── History Icon ───────────────────────────────────────────────────────────
const HistoryIcon = React.memo(({ size = 36, color = '#00E5CC' }: { size?: number; color?: string }) => {
  const stroke  = 2.5;
  const center  = size / 2;
  const hourH   = center * 0.55;
  const minW    = center * 0.55;
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: size / 2, borderWidth: stroke, borderColor: color }} />
      <View style={{ position: 'absolute', left: center - stroke / 2, top: center - hourH, width: stroke, height: hourH, backgroundColor: color, borderRadius: stroke / 2 }} />
      <View style={{ position: 'absolute', left: center, top: center - stroke / 2, width: minW, height: stroke, backgroundColor: color, borderRadius: stroke / 2 }} />
      <View style={{ position: 'absolute', left: center - stroke, top: center - stroke, width: stroke * 2, height: stroke * 2, borderRadius: stroke, backgroundColor: color }} />
    </View>
  );
});

// ══════════════════════════════════════════════════════════════════════════
export default function TradeHistoryScreen({ navigation }: TradeHistoryScreenProps) {
  const [filter, setFilter]     = useState<'all' | 'buy' | 'sell'>('all');
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const { userId }              = useAuth();
  const userIdRef               = useRef(userId);
  const isMounted               = useRef(true);
  const hasFetched              = useRef(false);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchPortfolio = useCallback(async (forceRefresh = false) => {
    const id = userIdRef.current ?? '';
    if (!id) return;
    try {
      if (!forceRefresh && hasFetched.current) return;
      setLoading(true);
      const data = await API.getPortfolio(id);
      if (!isMounted.current) return;
      setPortfolio(data);
      setError(null);
      hasFetched.current = true;
    } catch {
      if (isMounted.current) setError('Failed to load trade history');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    hasFetched.current = false;
    if (userId) API.clearUserCache(userId);
    fetchPortfolio();
  }, [userId, fetchPortfolio]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      const id = userIdRef.current;
      if (!id || !hasFetched.current) return;
      API.getPortfolio(id).then(data => {
        if (isMounted.current) setPortfolio(data);
      }).catch(() => {});
    });
    return unsub;
  }, [navigation]);

  const trades: Trade[] = useMemo(() => {
    return (portfolio?.transactions ?? []).map((t, index) => ({
      id:          `TXN-${index + 1}`,
      ticker:      t.symbol,
      companyName: COMPANY_NAMES[t.symbol] ?? t.symbol,
      type:        (t.action.toLowerCase() === 'sell' ? 'sell' : 'buy') as 'buy' | 'sell',
      shares:      t.quantity,
      price:       t.price,
      total:       t.price * t.quantity,
      date:        formatDate(t.created_at),
      time:        formatTime(t.created_at),
      orderType:   'Market order',
    })).reverse();
  }, [portfolio]);

  const visibleTrades = useMemo(
    () => filter === 'all' ? trades : trades.filter(t => t.type === filter),
    [filter, trades]
  );

  const totalVolume = useMemo(
    () => trades.reduce((sum, t) => sum + t.total, 0),
    [trades]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading trade history...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchPortfolio(true)}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Trade History</Text>
        <Text style={styles.subtitle}>Review all your past trades and transactions</Text>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total trades</Text>
            <Text style={styles.summaryValue}>{trades.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total volume</Text>
            <Text style={styles.summaryValue}>{formatSar(totalVolume)}</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {(['all', 'buy', 'sell'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterPillText, filter === f && styles.filterPillTextActive]}>
                {f === 'all' ? 'All' : f === 'buy' ? 'Buy' : 'Sell'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {visibleTrades.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <HistoryIcon size={36} color="#00E5CC" />
            </View>
            <Text style={styles.emptyTitle}>No trades yet</Text>
            <Text style={styles.emptyBody}>Your executed trades will appear here</Text>
          </View>
        ) : (
          visibleTrades.map(trade => <TradeCard key={trade.id} trade={trade} />)
        )}

        {visibleTrades.length > 0 && (
          <TouchableOpacity style={styles.loadMoreBtn} activeOpacity={0.7}>
            <Text style={styles.loadMoreText}>Load more trades</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.bg },
  centeredContainer:  { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  loadingText:        { color: colors.white, marginTop: 12, fontSize: 15 },
  errorText:          { color: colors.red, fontSize: 15, marginBottom: 16, textAlign: 'center' },
  retryBtn:           { backgroundColor: colors.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  retryBtnText:       { color: colors.bg, fontSize: 14, fontWeight: '700' },
  header:             { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  backText:           { color: colors.accent, fontSize: 15, fontWeight: '600' },
  scroll:             { paddingHorizontal: 24, paddingBottom: 40 },
  title:              { color: colors.white, fontSize: 30, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  subtitle:           { color: colors.gray400, fontSize: 15, marginBottom: 24 },
  summaryGrid:        { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard:        { flex: 1, backgroundColor: colors.bgSecondary, borderRadius: 12, padding: 16 },
  summaryLabel:       { color: colors.gray500, fontSize: 12, fontWeight: '500', marginBottom: 8 },
  summaryValue:       { color: colors.white, fontSize: 22, fontWeight: '700' },
  filterRow:          { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterPill:         { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' },
  filterPillActive:   { backgroundColor: colors.accent, borderColor: colors.accent },
  filterPillText:     { color: colors.gray400, fontSize: 13, fontWeight: '600' },
  filterPillTextActive: { color: colors.bg },
  loadMoreBtn:        { height: 48, backgroundColor: colors.bgSecondary, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  loadMoreText:       { color: colors.white, fontSize: 15, fontWeight: '600' },
  emptyState:         { alignItems: 'center', paddingVertical: 40 },
  emptyIconCircle:    { width: 80, height: 80, borderRadius: 40, backgroundColor: `${colors.accent}18`, borderWidth: 1, borderColor: `${colors.accent}30`, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle:         { color: colors.white, fontSize: 17, fontWeight: '700', marginBottom: 8 },
  emptyBody:          { color: colors.gray500, fontSize: 14, textAlign: 'center' },
});