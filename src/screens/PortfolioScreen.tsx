import React, { useEffect, useMemo, useRef, useState } from 'react';
import { API } from '../services/api';
import { useAuth } from '../context/AppContext';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';

interface PortfolioScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

interface PositionItem {
  symbol: string;
  quantity: number;
  avg_price: number;
  market_value?: number;
  change_percent?: number;
  is_positive?: boolean;
}

interface TransactionItem {
  symbol: string;
  action: string;
  price: number;
  quantity: number;
}

interface PortfolioResponse {
  id: number;
  user_id: string;
  cash_balance: number;
  positions: PositionItem[];
  transactions: TransactionItem[];
}

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

const ASSET_COLORS: Record<string, string> = {
  SABIC: '#852EC6', STC: '#00E8FF', Aramco: '#EF9F27',
  'Al Rajhi': '#3B82F6', Maaden: '#EF4444', AAPL: '#10B981', TSLA: '#F97316',
};

const FALLBACK_COLORS = ['#852EC6', '#00E8FF', '#EF9F27', '#3B82F6', '#EF4444', '#10B981', '#F97316'];

function assetColor(name: string, index: number): string {
  return ASSET_COLORS[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function formatSar(value: number | undefined) {
  if (value === undefined || value === null) return '0.00 SAR';
  return `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;
}

function SimpleDonut({ positions }: { positions: Array<{ name: string; pctNumber: number; pct: string; color: string }> }) {
  if (!positions.length) {
    return <View style={donutStyles.emptyWrap}><Text style={donutStyles.emptyText}>No positions yet</Text></View>;
  }

  const size = 96;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <View style={donutStyles.container}>
      <View style={donutStyles.chartWrap}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.gray800} strokeWidth={strokeWidth} fill="none" />
          {positions.map((item, index) => {
            const dashLength = (item.pctNumber / 100) * circumference;
            const dashOffset = -cumulativeOffset;
            cumulativeOffset += dashLength;
            return (
              <Circle
                key={`${item.name}-${index}`}
                cx={size / 2} cy={size / 2} r={radius}
                stroke={item.color} strokeWidth={strokeWidth} fill="none"
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap={positions.length === 1 ? 'butt' : 'round'}
                rotation="-90" origin={`${size / 2}, ${size / 2}`}
              />
            );
          })}
        </Svg>
        <View style={donutStyles.hole} />
      </View>
      <View style={donutStyles.legend}>
        {positions.map((item) => (
          <View key={item.name} style={donutStyles.legendRow}>
            <View style={[donutStyles.legendDot, { backgroundColor: item.color }]} />
            <Text style={donutStyles.legendName}>{COMPANY_NAMES[item.name] ?? item.name}</Text>
            <Text style={donutStyles.legendPct}>{item.pct}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const donutStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 18 },
  chartWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  hole: { position: 'absolute', width: 54, height: 54, borderRadius: 27, backgroundColor: colors.bgSecondary },
  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { color: colors.gray400, fontSize: 12, fontWeight: '500', flex: 1 },
  legendPct: { color: colors.gray400, fontSize: 12, fontWeight: '600' },
  emptyWrap: { marginTop: 16, paddingVertical: 16 },
  emptyText: { color: colors.gray500, fontSize: 14 },
});

export default function PortfolioScreen({ navigation }: PortfolioScreenProps) {
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useAuth();
  const userIdRef = useRef(userId);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const fetchPortfolio = async (uid?: string) => {
    const id = uid ?? userIdRef.current ?? '';
    if (!id) return;
    try {
      setLoading(true);
      const data = await API.getPortfolio(id);
      setPortfolio(data);
      setError(null);
    } catch (err) {
      setError('Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    const id = userIdRef.current ?? '';
    if (!id) return;
    setRefreshing(true);
    API.clearUserCache(id);
    try {
      const data = await API.getPortfolio(id);
      setPortfolio(data);
      setError(null);
    } catch {
      setError('Failed to load portfolio');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    API.clearUserCache(userId);
    fetchPortfolio(userId);
  }, [userId]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      const id = userIdRef.current;
      if (!id) return;
      API.clearUserCache(id);
      fetchPortfolio(id);
    });
    return unsub;
  }, [navigation]);

  const positionsData = useMemo(() => {
    if (!portfolio?.positions) return [];
    return portfolio.positions.map((p, index) => {
      const fallbackValue = p.quantity * p.avg_price;
      const changePercent = p.change_percent ?? 0;
      return {
        ticker: p.symbol,
        name: COMPANY_NAMES[p.symbol] ?? p.symbol,
        shares: Number(p.quantity.toFixed(4)),
        value: p.market_value ?? fallbackValue,
        avgPrice: p.avg_price,
        color: assetColor(p.symbol, index),
        positive: p.is_positive ?? changePercent >= 0,
        change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`,
      };
    });
  }, [portfolio]);

  const totalPositionsValue = useMemo(() => positionsData.reduce((sum, item) => sum + item.value, 0), [positionsData]);
  const totalPortfolioValue = useMemo(() => (portfolio?.cash_balance ?? 0) + totalPositionsValue, [portfolio, totalPositionsValue]);

  const donutData = useMemo(() => {
    if (!positionsData.length || totalPositionsValue <= 0) return [];
    return positionsData.map((item) => {
      const pctNumber = (item.value / totalPositionsValue) * 100;
      return { name: item.ticker, pctNumber, pct: `${pctNumber.toFixed(1)}%`, color: item.color };
    });
  }, [positionsData, totalPositionsValue]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading portfolio...</Text>
      </SafeAreaView>
    );
  }

  if (error || !portfolio) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error ?? 'Something went wrong'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchPortfolio()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <Text style={styles.title}>Portfolio</Text>

        <View style={styles.valueCard}>
          <Text style={styles.valueLabel}>Total Portfolio Value</Text>
          <Text style={styles.totalValue}>{formatSar(totalPortfolioValue)}</Text>
          <View style={styles.gainRow}>
            <View style={styles.gainBadge}><Text style={styles.gainText}>Live</Text></View>
            <Text style={styles.gainSub}>Assets + Cash combined</Text>
          </View>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownBox}>
              <Text style={styles.breakdownLabel}>Invested Assets</Text>
              <Text style={styles.breakdownValue}>{formatSar(totalPositionsValue)}</Text>
              <Text style={styles.breakdownSub}>Stocks & holdings</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownBox}>
              <Text style={styles.breakdownLabel}>Available Cash</Text>
              <Text style={styles.breakdownValue}>{formatSar(portfolio?.cash_balance)}</Text>
              <Text style={styles.breakdownSub}>Ready to invest</Text>
            </View>
          </View>
          <SimpleDonut positions={donutData} />
        </View>

        <View style={styles.narrativeCard}>
          <Text style={styles.narrativeTitle}>Portfolio snapshot</Text>
          <Text style={styles.narrativeText}>
            Available cash: {formatSar(portfolio?.cash_balance)}. You currently hold{' '}
            {(portfolio?.positions ?? []).length} position{(portfolio?.positions ?? []).length === 1 ? '' : 's'} and
            have {(portfolio?.transactions ?? []).length} recorded transaction
            {(portfolio?.transactions ?? []).length === 1 ? '' : 's'}.
          </Text>
          <TouchableOpacity style={styles.analysisLink} onPress={() => navigation.navigate('PortfolioAnalysis')}>
            <Text style={styles.analysisLinkText}>View AI analysis →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All positions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PerformanceHistory')}>
            <Text style={styles.sectionLink}>View performance</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.positionsCard}>
          {positionsData.length === 0 ? (
            <Text style={styles.emptyStateText}>No positions yet</Text>
          ) : (
            positionsData.map((pos, i) => (
              <View key={pos.ticker}>
                <View style={styles.posRow}>
                  <View style={styles.posLeft}>
                    <View style={[styles.posDot, { backgroundColor: pos.color }]} />
                    <View>
                      <Text style={styles.posTicker}>{pos.name}</Text>
                      <Text style={styles.posTickerSub}>{pos.ticker} · {pos.shares} shares</Text>
                    </View>
                  </View>
                  <View style={styles.posRight}>
                    <Text style={styles.posValue}>{formatSar(pos.value)}</Text>
                    <Text style={[styles.posChange, { color: pos.positive ? colors.green : colors.red }]}>{pos.change}</Text>
                    <Text style={styles.posAvg}>Avg: {pos.avgPrice.toFixed(2)}</Text>
                  </View>
                </View>
                {i < positionsData.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('TradeHistory')} activeOpacity={0.7}>
          <View style={styles.historyBtnLeft}>
            <Text style={styles.historyIcon}>↺</Text>
            <Text style={styles.historyBtnText}>Trade history</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.safetyLink} onPress={() => navigation.navigate('SafetyLimits')} activeOpacity={0.7}>
          <Text style={styles.safetyLinkText}>Manage safety limits →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centeredContainer: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  loadingText: { color: colors.white, marginTop: 12, fontSize: 15 },
  errorText: { color: colors.red, fontSize: 15, marginBottom: 16, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  retryBtnText: { color: colors.white, fontWeight: '700' },
  scroll: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32 },
  title: { color: colors.white, fontSize: 32, fontWeight: '700', marginBottom: 24 },
  valueCard: { backgroundColor: colors.bgSecondary, borderRadius: 20, padding: 24, marginBottom: 16 },
  valueLabel: { color: colors.gray400, fontSize: 14, fontWeight: '500', marginBottom: 8 },
  totalValue: { color: colors.white, fontSize: 36, fontWeight: '700', letterSpacing: -1, marginBottom: 12 },
  gainRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownRow: { flexDirection: 'row', marginTop: 16, marginBottom: 4, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, overflow: 'hidden' },
  breakdownBox: { flex: 1, padding: 12 },
  breakdownDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 8 },
  breakdownLabel: { color: colors.gray500, fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  breakdownValue: { color: colors.white, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  breakdownSub: { color: colors.gray600, fontSize: 11 },
  gainBadge: { backgroundColor: `${colors.green}1A`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  gainText: { color: colors.green, fontSize: 14, fontWeight: '700' },
  gainSub: { color: colors.gray500, fontSize: 13 },
  narrativeCard: { backgroundColor: colors.bgSecondary, borderRadius: 16, padding: 20, marginBottom: 24 },
  narrativeTitle: { color: colors.white, fontSize: 17, fontWeight: '700', marginBottom: 8 },
  narrativeText: { color: colors.gray400, fontSize: 14, lineHeight: 22, marginBottom: 16 },
  analysisLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  analysisLinkText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  sectionLink: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  positionsCard: { backgroundColor: colors.bgSecondary, borderRadius: 16, padding: 16, marginBottom: 24 },
  emptyStateText: { color: colors.gray500, fontSize: 14, textAlign: 'center', paddingVertical: 12 },
  posRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  posLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  posDot: { width: 10, height: 10, borderRadius: 5 },
  posTicker: { color: colors.white, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  posTickerSub: { color: colors.gray500, fontSize: 11 },
  posRight: { alignItems: 'flex-end' },
  posValue: { color: colors.white, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  posChange: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  posAvg: { color: colors.gray400, fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.gray800 },
  historyBtn: { height: 52, backgroundColor: colors.bgSecondary, borderRadius: 14, borderLeftWidth: 2, borderLeftColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  historyBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyIcon: { color: colors.accent, fontSize: 18, fontWeight: '600' },
  historyBtnText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  chevron: { color: colors.gray500, fontSize: 22, fontWeight: '400' },
  safetyLink: { paddingVertical: 4, marginBottom: 16 },
  safetyLinkText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
});