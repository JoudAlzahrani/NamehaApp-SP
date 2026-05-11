import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { API } from '../services/api';
import { useAuth } from '../context/AppContext';
import { useMarketStatus } from '../services/marketStatus';

interface DashboardScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

interface PositionItem {
  symbol: string;
  quantity: number;
  avg_price: number;
}

interface PortfolioData {
  cash_balance: number;
  positions: PositionItem[];
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
  'COP': 'ConocoPhillips', 'SLB': 'Schlumberger', 'T': 'AT&T',
  'VZ': 'Verizon Communications', 'TMUS': 'T-Mobile', 'AMT': 'American Tower',
  'PLD': 'Prologis', 'EQIX': 'Equinix', 'NEE': 'NextEra Energy',
  'DUK': 'Duke Energy', 'SO': 'Southern Company',
};

const ASSET_COLORS: Record<string, string> = {
  SABIC: '#8B5CF6', STC: '#10B981', Aramco: '#EF9F27',
  'Al Rajhi': '#3B82F6', Maaden: '#EF4444', AAPL: '#10B981', TSLA: '#F97316',
};
const FALLBACK_COLORS = ['#8B5CF6', '#00E8FF', '#EF9F27', '#3B82F6', '#EF4444', '#10B981'];

function assetColor(name: string, index: number): string {
  return ASSET_COLORS[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function SimpleSparkline({ values }: { values: number[] }) {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return (
    <View style={sparkStyles.container}>
      {values.map((val, i) => {
        const h = ((val - min) / range) * 50 + 10;
        return <View key={i} style={[sparkStyles.bar, { height: h }]} />;
      })}
    </View>
  );
}

const sparkStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', height: 60, gap: 4, marginTop: 12 },
  bar: { flex: 1, backgroundColor: colors.accent, borderRadius: 3, opacity: 0.8 },
});

const ACTIVE_ALERTS = [
  {
    id: 'a1', color: colors.red, bgColor: `${colors.red}15`, icon: '△',
    title: 'Loss cap reached', body: 'One of your positions is approaching your max loss limit.', time: 'Just now',
  },
  {
    id: 'a2', color: colors.amber, bgColor: `${colors.amber}15`, icon: '◈',
    title: 'Daily limit at 80%', body: 'You have used 80% of your daily trading limit.', time: '14 min ago',
  },
];

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { userId, user } = useAuth();
  const userIdRef = useRef(userId);
  const market = useMarketStatus('SA');
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [quotes, setQuotes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const fetchData = async (uid?: string) => {
    const id = uid ?? userIdRef.current ?? '';
    if (!id) return;
    try {
      const data = await API.getPortfolio(id);
      setPortfolio(data);
      const symbols = (data.positions ?? []).map((p: PositionItem) => p.symbol);
      const quoteResults: Record<string, number> = {};
      await Promise.all(
        symbols.map(async (symbol: string) => {
          try {
            const q = await API.quote(symbol);
            if (q?.c) quoteResults[symbol] = q.c;
          } catch {}
        })
      );
      setQuotes(quoteResults);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    API.clearUserCache(userId);
    fetchData(userId);
  }, [userId]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      const id = userIdRef.current;
      if (!id) return;
      API.clearUserCache(id);
      fetchData(id);
    });
    return unsub;
  }, [navigation]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const positions = portfolio?.positions ?? [];

  const holdingsWithValue = positions.map((p, i) => {
    const currentPrice = quotes[p.symbol] ?? p.avg_price;
    const value = p.quantity * currentPrice;
    const change = p.avg_price ? ((currentPrice - p.avg_price) / p.avg_price) * 100 : 0;
    return {
      ticker: p.symbol,
      name: COMPANY_NAMES[p.symbol] ?? p.symbol,
      shares: Number(p.quantity.toFixed(4)),
      value,
      change,
      positive: change >= 0,
      dotColor: assetColor(p.symbol, i),
    };
  });

  const totalPositionsValue = holdingsWithValue.reduce((sum, h) => sum + h.value, 0);
  const totalValue = (portfolio?.cash_balance ?? 0) + totalPositionsValue;
  const sparkValues = holdingsWithValue.length ? holdingsWithValue.map(h => h.value) : [0];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.logoBox}>
          <Image source={require('../imports/nameha_logo.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
            <Text style={styles.bellIcon}>◉</Text>
            <View style={styles.bellDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.avatarText}>
              {user?.name
                ? user.name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('')
                : '?'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <View style={styles.marketStatusRow}>
          <View style={[styles.marketDotOpen, { backgroundColor: market.isOpen ? colors.green : colors.red }]} />
          <Text style={styles.marketStatusLabel}>{market.label}</Text>
          <Text style={styles.marketStatusTime}>{market.statusText}</Text>
        </View>

        <View style={styles.portfolioCard}>
          <Text style={styles.greeting}>{greeting()}{user?.name ? `, ${user.name}` : ''}</Text>
          <Text style={styles.portfolioValue}>
            {totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
          </Text>
          <View style={styles.changeRow}>
            <View style={styles.changeBadge}><Text style={styles.changeText}>Live</Text></View>
            <Text style={styles.changeSub}>
              Cash: {(portfolio?.cash_balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
            </Text>
          </View>
          <SimpleSparkline values={sparkValues} />
          <View style={styles.narrativeSeparator} />
          <Text style={styles.narrativeText}>
            {holdingsWithValue.length > 0
              ? `You hold ${holdingsWithValue.length} position${holdingsWithValue.length > 1 ? 's' : ''}. Pull down to refresh.`
              : 'No positions yet — start trading to build your portfolio.'}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active alerts</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SafetyLimits')}>
            <Text style={styles.seeAll}>Manage limits</Text>
          </TouchableOpacity>
        </View>
        {ACTIVE_ALERTS.map(alert => (
          <View key={alert.id} style={[styles.alertCard, { backgroundColor: alert.bgColor }]}>
            <View style={styles.alertHeader}>
              <View style={styles.alertLeft}>
                <Text style={[styles.alertIcon, { color: alert.color }]}>{alert.icon}</Text>
                <Text style={[styles.alertTitle, { color: alert.color }]}>{alert.title}</Text>
              </View>
              <Text style={styles.alertTime}>{alert.time}</Text>
            </View>
            <Text style={styles.alertBody}>{alert.body}</Text>
          </View>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My holdings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Portfolio')}>
            <Text style={styles.seeAll}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.holdingsCard}>
          {holdingsWithValue.length === 0 ? (
            <Text style={styles.emptyText}>No holdings yet</Text>
          ) : (
            holdingsWithValue.map((h, i) => (
              <View key={h.ticker}>
                <View style={styles.holdingRow}>
                  <View style={styles.holdingLeft}>
                    <View style={[styles.holdingDot, { backgroundColor: h.dotColor }]} />
                    <View>
                      <Text style={styles.holdingName}>{h.name}</Text>
                      <Text style={styles.holdingShares}>{h.ticker} · {h.shares} shares</Text>
                    </View>
                  </View>
                  <View style={styles.holdingRight}>
                    <Text style={styles.holdingValue}>
                      {h.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </Text>
                    <Text style={[styles.holdingChange, { color: h.positive ? colors.green : colors.red }]}>
                      {h.positive ? '+' : ''}{h.change.toFixed(1)}%
                    </Text>
                  </View>
                </View>
                {i < holdingsWithValue.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Insights for you</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllInsights')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.insightPlaceholder}>
          <Text style={styles.insightPlaceholderText}>✦ AI insights coming soon</Text>
          <Text style={styles.insightPlaceholderSub}>NAMEHA is analyzing your portfolio</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  logoBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  topBarRight: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  bellBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bellIcon: { fontSize: 16, color: colors.gray400 },
  bellDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  avatarBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  scroll: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8 },
  marketStatusRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8, gap: 6 },
  marketDotOpen: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.green },
  marketStatusLabel: { color: colors.white, fontSize: 13, fontWeight: '700' },
  marketStatusTime: { color: colors.gray500, fontSize: 12, flex: 1, textAlign: 'right' },
  portfolioCard: { backgroundColor: colors.bgSecondary, borderRadius: 20, padding: 24, marginBottom: 24, overflow: 'hidden' },
  greeting: { color: colors.gray400, fontSize: 14, fontWeight: '500', marginBottom: 8 },
  portfolioValue: { color: colors.white, fontSize: 40, fontWeight: '700', letterSpacing: -1, marginBottom: 12 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  changeBadge: { backgroundColor: `${colors.green}1A`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  changeText: { color: colors.green, fontSize: 14, fontWeight: '700' },
  changeSub: { color: colors.gray500, fontSize: 14 },
  narrativeSeparator: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', marginTop: 12 },
  narrativeText: { color: colors.gray500, fontSize: 12, fontStyle: 'italic', paddingTop: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  seeAll: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  alertCard: { borderRadius: 14, padding: 16, marginBottom: 10 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  alertLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertIcon: { fontSize: 14, fontWeight: '700' },
  alertTitle: { fontSize: 14, fontWeight: '700' },
  alertTime: { color: colors.gray500, fontSize: 12 },
  alertBody: { color: colors.gray300, fontSize: 13, lineHeight: 20 },
  holdingsCard: { backgroundColor: colors.bgSecondary, borderRadius: 16, padding: 16, marginBottom: 24 },
  holdingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  holdingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  holdingDot: { width: 10, height: 10, borderRadius: 5 },
  holdingName: { color: colors.white, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  holdingShares: { color: colors.gray500, fontSize: 11 },
  holdingRight: { alignItems: 'flex-end' },
  holdingValue: { color: colors.white, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  holdingChange: { fontSize: 13, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.gray800 },
  emptyText: { color: colors.gray500, fontSize: 14, textAlign: 'center', paddingVertical: 12 },
  insightPlaceholder: { backgroundColor: colors.bgSecondary, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24 },
  insightPlaceholderText: { color: colors.accent, fontSize: 15, fontWeight: '700', marginBottom: 8 },
  insightPlaceholderSub: { color: colors.gray500, fontSize: 13 },
});