import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { API, BASE_URL } from '../services/api';
import { useAuth } from '../context/AppContext';

interface InvestmentDetailScreenProps {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

const SECTOR_COLORS: Record<string, string> = {
  Energy: colors.amber, Finance: '#3B82F6',
  Technology: '#8B5CF6', Healthcare: colors.green,
  'Real Estate': colors.accent, Materials: '#F97316',
  Telecom: '#EC4899', Utilities: '#14B8A6',
};

const SYMBOL_SECTORS: Record<string, string> = {
  '2222': 'Energy', '2060': 'Energy', 'XOM': 'Energy', 'CVX': 'Energy', 'COP': 'Energy', 'SLB': 'Energy',
  '2010': 'Materials',
  '1120': 'Finance', '1180': 'Finance', '1150': 'Finance', 'JPM': 'Finance', 'BAC': 'Finance', 'WFC': 'Finance', 'GS': 'Finance',
  '7010': 'Telecom', '7020': 'Telecom', '7030': 'Telecom', 'T': 'Telecom', 'VZ': 'Telecom', 'TMUS': 'Telecom',
  '2082': 'Utilities', '4030': 'Utilities', 'NEE': 'Utilities', 'DUK': 'Utilities', 'SO': 'Utilities',
  '4002': 'Healthcare', '4004': 'Healthcare', 'JNJ': 'Healthcare', 'UNH': 'Healthcare', 'PFE': 'Healthcare', 'ABBV': 'Healthcare',
  '4020': 'Real Estate', 'AMT': 'Real Estate', 'PLD': 'Real Estate',
  'AAPL': 'Technology', 'MSFT': 'Technology', 'NVDA': 'Technology', 'TSLA': 'Technology', 'GOOGL': 'Technology', 'AMZN': 'Technology', 'EQIX': 'Technology',
};

function calcSectorAllocation(positions: { symbol: string; quantity: number; avg_price: number }[]) {
  const sectorValues: Record<string, number> = {};
  let total = 0;
  for (const p of positions) {
    const sector = SYMBOL_SECTORS[p.symbol] ?? 'Other';
    const val = p.quantity * p.avg_price;
    sectorValues[sector] = (sectorValues[sector] ?? 0) + val;
    total += val;
  }
  if (total === 0) return null;
  return Object.entries(sectorValues)
    .map(([sector, val]) => ({ sector, allocation_pct: Math.round((val / total) * 100) }))
    .sort((a, b) => b.allocation_pct - a.allocation_pct);
}

const COMPANY_NAMES: Record<string, string> = {
  '2222': 'Saudi Aramco', '2010': 'Saudi Basic Industries', '1120': 'Al Rajhi Bank',
  '1180': 'Saudi National Bank', '1150': 'Alinma Bank', '7010': 'Saudi Telecom Company',
  '7020': 'Mobily', 'AAPL': 'Apple', 'MSFT': 'Microsoft', 'NVDA': 'NVIDIA',
  'TSLA': 'Tesla', 'JPM': 'JPMorgan Chase', 'XOM': 'ExxonMobil',
};

function GrowthChart({ data }: { data: number[] }) {
  const [width, setWidth] = useState(280);
  const HEIGHT = 160, PAD_V = 12;
  const chartH = HEIGHT - PAD_V * 2;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: PAD_V + chartH - ((v - min) / range) * chartH,
  }));

  const segs = pts.slice(0, -1).map((p, i) => {
    const q = pts[i + 1];
    const dx = q.x - p.x, dy = q.y - p.y;
    return { mx: (p.x + q.x) / 2, my: (p.y + q.y) / 2, len: Math.sqrt(dx * dx + dy * dy), ang: Math.atan2(dy, dx) * 180 / Math.PI };
  });

  const last = pts[pts.length - 1];

  return (
    <View style={{ height: HEIGHT, position: 'relative', overflow: 'hidden' }} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {pts.slice(0, -1).map((p, i) => {
        const q = pts[i + 1];
        return <View key={`f${i}`} style={{ position: 'absolute', left: p.x, top: Math.min(p.y, q.y), width: q.x - p.x, height: HEIGHT - Math.min(p.y, q.y), backgroundColor: `${colors.green}18` }} />;
      })}
      {segs.map((s, i) => <View key={`s${i}`} style={{ position: 'absolute', left: s.mx - s.len / 2, top: s.my - 1.5, width: s.len, height: 3, backgroundColor: colors.green, borderRadius: 1.5, transform: [{ rotate: `${s.ang}deg` }] }} />)}
      <View style={{ position: 'absolute', left: last.x - 5, top: last.y - 5, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green, borderWidth: 2, borderColor: colors.bgSecondary }} />
    </View>
  );
}

export default function InvestmentDetailScreen({ navigation, route }: InvestmentDetailScreenProps) {
  const { userId } = useAuth();
  const investmentId = (route?.params?.investmentId as number) ?? 0;

  const [loading, setLoading] = useState(true);
  const [savedInv, setSavedInv]       = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paused, setPaused]           = useState(false);
  const [realAllocation, setRealAllocation] = useState<any[] | null>(null);

  const invStorageKey = `investments_${userId}`;

  const updateStatus = async (newStatus: 'active' | 'paused' | 'stopped') => {
    try {
      const saved = await AsyncStorage.getItem(invStorageKey);
      if (!saved) return;
      const list = JSON.parse(saved);
      const updated = list.map((i: any) => i.id === investmentId ? { ...i, status: newStatus } : i);
      await AsyncStorage.setItem(invStorageKey, JSON.stringify(updated));
    } catch {}
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [portfolio, savedStr] = await Promise.all([
          API.getPortfolio(userId ?? ''),
          AsyncStorage.getItem(invStorageKey),
        ]);
        setTransactions((portfolio?.transactions ?? []).slice(-3).reverse());

        const computed = calcSectorAllocation(portfolio?.positions ?? []);
        if (computed) setRealAllocation(computed);

        if (savedStr) {
          const list = JSON.parse(savedStr);
          const inv = list.find((i: any) => i.id === investmentId);
          if (inv) {
            setSavedInv(inv);
            if (inv.status === 'paused') setPaused(true);
          }
        }
      } catch {}
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  const rawAmount    = savedInv ? (parseInt(savedInv.amountText) || 5000) : 5000;
  const durationMonths = savedInv?.months ?? 6;
  const conservReturn = savedInv?.conservReturn ?? Math.round(rawAmount * 0.124);
  const optimReturn   = savedInv?.optimReturn   ?? Math.round(rawAmount * 0.178);
  const conservPct    = savedInv?.conservPct    ?? '12.4';
  const optimPct      = savedInv?.optimPct      ?? '17.8';
  const allocations   = savedInv?.aiPlan?.sector_allocation ?? realAllocation ?? [];

  const daysAgo      = savedInv ? Math.max(0, Math.floor((Date.now() - new Date(savedInv.createdAt).getTime()) / 86400000)) : 0;
  const durationDone = Math.min(Math.max(1, Math.floor(daysAgo / 30)), durationMonths);
  const progress     = durationMonths > 0 ? durationDone / durationMonths : 0;

  const sparkData = Array.from({ length: 14 }, (_, i) => {
    const growth = (conservReturn / rawAmount) * (i / 13);
    return rawAmount * (1 + growth) + (Math.random() * rawAmount * 0.01);
  });

  const handlePause = () => {
    if (paused) {
      Alert.alert('Resume investment', 'Your investment will resume and the AI will continue trading on your behalf.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Resume', onPress: () => { setPaused(false); updateStatus('active'); } },
      ]);
    } else {
      Alert.alert('Pause investment', 'Your investment will be paused. No new trades will be made until you resume.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pause', onPress: () => { setPaused(true); updateStatus('paused'); } },
      ]);
    }
  };

  const handleStop = () => {
    Alert.alert('Stop and withdraw', 'Are you sure? This will stop the investment and return your funds to your available balance.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Stop', style: 'destructive', onPress: async () => {
        await updateStatus('stopped');
        navigation.goBack();
      }},
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={[styles.statusPill, paused && styles.statusPillPaused]}>
          <View style={[styles.statusDot, paused && styles.statusDotPaused]} />
          <Text style={[styles.statusText, paused && styles.statusTextPaused]}>
            {paused ? 'Paused' : 'Active'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Investment #{investmentId}</Text>
        <Text style={styles.amount}>{rawAmount.toLocaleString('en-US')} SAR</Text>
        <Text style={styles.meta}>Started {daysAgo} days ago · {durationDone} of {durationMonths} months</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { flex: progress }]} />
          <View style={{ flex: 1 - progress }} />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartLabel}>PORTFOLIO GROWTH</Text>
          <GrowthChart data={sparkData} />
          <View style={styles.chartFooter}>
            <Text style={styles.chartFooterText}>Start</Text>
            <Text style={styles.chartFooterText}>Now</Text>
          </View>
        </View>

        <View style={styles.returnCard}>
          <Text style={styles.returnLabel}>ESTIMATED RETURN</Text>
          <Text style={styles.returnValue}>{conservReturn.toLocaleString('en-US')} – {optimReturn.toLocaleString('en-US')} SAR</Text>
          <View style={styles.returnBadgeRow}>
            <View style={styles.returnBadge}>
              <Text style={styles.returnBadgeText}>Conservative +{conservPct}%</Text>
            </View>
            <View style={[styles.returnBadge, styles.returnBadgeOpt]}>
              <Text style={[styles.returnBadgeText, styles.returnBadgeTextOpt]}>Optimistic +{optimPct}%</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Allocation breakdown</Text>
        <View style={styles.allocationCard}>
          {allocations.map((a: any) => {
            const color = SECTOR_COLORS[a.sector] ?? colors.accent;
            return (
              <View key={a.sector} style={styles.allocRow}>
                <View style={[styles.allocDot, { backgroundColor: color }]} />
                <Text style={styles.allocName}>{a.sector}</Text>
                <View style={styles.allocTrack}>
                  <View style={[styles.allocFill, { flex: a.allocation_pct, backgroundColor: color + '55' }]} />
                  <View style={{ flex: 100 - a.allocation_pct }} />
                </View>
                <Text style={styles.allocPct}>{a.allocation_pct}%</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Recent activity</Text>
        <View style={styles.activityCard}>
          {transactions.length === 0 ? (
            <View style={{ paddingVertical: 16 }}>
              <Text style={{ color: colors.gray500, fontSize: 14, textAlign: 'center' }}>No activity yet</Text>
            </View>
          ) : (
            transactions.map((t: any, i: number) => {
              const name = COMPANY_NAMES[t.symbol] ?? t.symbol;
              const total = (t.price * t.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return (
                <View key={i}>
                  <View style={styles.activityRow}>
                    <View style={[styles.activityDot, { backgroundColor: t.action === 'sell' ? colors.red : colors.green }]} />
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityLabel}>{t.action === 'sell' ? 'Sold' : 'Bought'} {name}</Text>
                      <Text style={styles.activityMeta}>{t.quantity} shares</Text>
                    </View>
                    <Text style={styles.activityAmount}>{total} SAR</Text>
                  </View>
                  {i < transactions.length - 1 && <View style={styles.activityDivider} />}
                </View>
              );
            })
          )}
        </View>

        <TouchableOpacity style={[styles.pauseBtn, paused && styles.resumeBtn]} onPress={handlePause} activeOpacity={0.8}>
          <Text style={[styles.pauseBtnText, paused && styles.resumeBtnText]}>
            {paused ? 'Resume investment' : 'Pause investment'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.stopBtn} onPress={handleStop} activeOpacity={0.8}>
          <Text style={styles.stopBtnText}>Stop and withdraw</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const GLASS_BG = 'rgba(255,255,255,0.04)';
const GLASS_BORDER = 'rgba(255,255,255,0.08)';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  backText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.green },
  statusText: { color: colors.green, fontSize: 13, fontWeight: '600' },
  scroll: { paddingHorizontal: 24, paddingBottom: 44 },
  title: { color: colors.white, fontSize: 28, fontWeight: '700', marginBottom: 6, marginTop: 4 },
  amount: { color: colors.white, fontSize: 32, fontWeight: '700', letterSpacing: -0.5, marginBottom: 6 },
  meta: { color: colors.gray500, fontSize: 13, marginBottom: 14 },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', overflow: 'hidden', marginBottom: 24 },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  chartCard: { backgroundColor: GLASS_BG, borderWidth: 1, borderColor: GLASS_BORDER, borderRadius: 16, padding: 16, marginBottom: 14 },
  chartLabel: { color: colors.gray500, fontSize: 11, fontWeight: '600', letterSpacing: 0.6, marginBottom: 12 },
  chartFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  chartFooterText: { color: colors.gray600, fontSize: 11 },
  returnCard: { backgroundColor: GLASS_BG, borderWidth: 1, borderColor: `${colors.green}30`, borderRadius: 16, padding: 16, marginBottom: 28 },
  returnLabel: { color: colors.gray500, fontSize: 11, fontWeight: '600', letterSpacing: 0.6, marginBottom: 8 },
  returnValue: { color: colors.white, fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginBottom: 12 },
  returnBadgeRow: { flexDirection: 'row', gap: 8 },
  returnBadge: { backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  returnBadgeText: { color: colors.green, fontSize: 12, fontWeight: '600' },
  returnBadgeOpt: { backgroundColor: `${colors.accent}12` },
  returnBadgeTextOpt: { color: colors.accent },
  sectionTitle: { color: colors.white, fontSize: 17, fontWeight: '700', marginBottom: 14 },
  allocationCard: { backgroundColor: GLASS_BG, borderWidth: 1, borderColor: GLASS_BORDER, borderRadius: 16, padding: 16, marginBottom: 28 },
  allocRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  allocDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  allocName: { color: colors.white, fontSize: 13, fontWeight: '500', width: 88 },
  allocTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', overflow: 'hidden' },
  allocFill: { height: '100%', borderRadius: 3 },
  allocPct: { color: colors.gray500, fontSize: 12, fontWeight: '500', width: 34, textAlign: 'right' },
  activityCard: { backgroundColor: GLASS_BG, borderWidth: 1, borderColor: GLASS_BORDER, borderRadius: 16, paddingHorizontal: 16, marginBottom: 32 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  activityDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  activityInfo: { flex: 1 },
  activityLabel: { color: colors.white, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  activityMeta: { color: colors.gray500, fontSize: 12 },
  activityAmount: { color: colors.white, fontSize: 14, fontWeight: '700' },
  activityDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  pauseBtn: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  pauseBtnText: { color: colors.white, fontSize: 15, fontWeight: '600', opacity: 0.85 },
  resumeBtn: { borderColor: `${colors.accent}60`, backgroundColor: `${colors.accent}12` },
  resumeBtnText: { color: colors.accent, opacity: 1 },
  statusPillPaused: { backgroundColor: 'rgba(245,158,11,0.15)' },
  statusDotPaused: { backgroundColor: colors.amber },
  statusTextPaused: { color: colors.amber },
  stopBtn: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: `${colors.red}40`, backgroundColor: `${colors.red}12`, alignItems: 'center', justifyContent: 'center' },
  stopBtnText: { color: colors.red, fontSize: 15, fontWeight: '600' },
});