import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { API } from '../services/api';
import { useAuth } from '../context/AppContext';

interface PortfolioAnalysisScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

const COMPANY_NAMES: Record<string, string> = {
  '2222': 'Saudi Aramco', '2010': 'Saudi Basic Industries', '1120': 'Al Rajhi Bank',
  '1180': 'Saudi National Bank', '1150': 'Alinma Bank', '7010': 'Saudi Telecom Company',
  '7020': 'Mobily', '7030': 'Zain Saudi Arabia', '4002': 'Saudi Healthcare Holding',
  '4004': 'Mouwasat Medical Services', '4020': 'Emaar Economic City',
  '2060': 'Yanbu National Petrochemical', '2082': 'ACWA Power',
  '4030': 'Saudi Electricity Company',
  'AAPL': 'Apple', 'MSFT': 'Microsoft', 'NVDA': 'NVIDIA', 'TSLA': 'Tesla',
  'JPM': 'JPMorgan Chase', 'BAC': 'Bank of America', 'WFC': 'Wells Fargo',
  'GS': 'Goldman Sachs', 'JNJ': 'Johnson and Johnson', 'UNH': 'UnitedHealth Group',
  'PFE': 'Pfizer', 'ABBV': 'AbbVie', 'XOM': 'ExxonMobil', 'CVX': 'Chevron',
  'COP': 'ConocoPhillips', 'SLB': 'Schlumberger', 'T': 'AT&T',
  'VZ': 'Verizon Communications', 'TMUS': 'T-Mobile',
};

function RingProgress({ percent, size = 48, strokeWidth = 4, ringColor = colors.green }: {
  percent: number; size?: number; strokeWidth?: number; ringColor?: string;
}) {
  const r = size / 2;
  const rightRotation = 180 - (Math.min(percent, 0.5) / 0.5) * 180;
  const leftRotation = percent > 0.5 ? 180 - ((percent - 0.5) / 0.5) * 180 : 180;
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: r, borderWidth: strokeWidth, borderColor: 'rgba(255,255,255,0.12)' }} />
      <View style={{ position: 'absolute', left: r, top: 0, width: r, height: size, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: -r, top: 0, width: size, height: size, borderRadius: r, borderWidth: strokeWidth, borderColor: ringColor, transform: [{ rotate: `${rightRotation}deg` }] }} />
      </View>
      <View style={{ position: 'absolute', left: 0, top: 0, width: r, height: size, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, borderRadius: r, borderWidth: strokeWidth, borderColor: ringColor, transform: [{ rotate: `${leftRotation}deg` }] }} />
      </View>
    </View>
  );
}

export default function PortfolioAnalysisScreen({ navigation }: PortfolioAnalysisScreenProps) {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [quotes, setQuotes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await API.getPortfolio(userId ?? '');
        setPortfolio(data);

        const symbols = (data.positions ?? []).map((p: any) => p.symbol);
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
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const positions = useMemo(() => {
    if (!portfolio?.positions) return [];
    const totalValue = portfolio.positions.reduce((sum: number, p: any) => {
      const price = quotes[p.symbol] ?? p.avg_price;
      return sum + p.quantity * price;
    }, 0);

    return portfolio.positions.map((p: any) => {
      const currentPrice = quotes[p.symbol] ?? p.avg_price;
      const value = p.quantity * currentPrice;
      const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;
      const change = p.avg_price ? ((currentPrice - p.avg_price) / p.avg_price) * 100 : 0;
      const positive = change >= 0;

      return {
        ticker: p.symbol,
        name: COMPANY_NAMES[p.symbol] ?? p.symbol,
        weight: `${weight.toFixed(1)}%`,
        signal: positive ? 'Rising steadily — positive momentum' : 'Slight dip — watch for reversal',
        tag: positive ? 'Positive' : 'Watch',
        tagColor: positive ? colors.green : colors.amber,
        iconGlyph: positive ? '↗' : '↘',
        iconBg: positive ? `${colors.green}20` : `${colors.amber}20`,
        iconColor: positive ? colors.green : colors.amber,
        change,
        value,
        weightNum: weight,
      };
    });
  }, [portfolio, quotes]);

  const totalValue = useMemo(() => {
    if (!portfolio) return 0;
    const posVal = positions.reduce((sum, p) => sum + p.value, 0);
    return (portfolio.cash_balance ?? 0) + posVal;
  }, [portfolio, positions]);

  const largestPosition = useMemo(() => {
    if (!positions.length) return null;
    return positions.reduce((max, p) => p.weightNum > max.weightNum ? p : max, positions[0]);
  }, [positions]);

  const healthScore = useMemo(() => {
    if (!positions.length) return 50;
    const positiveCount = positions.filter(p => p.change >= 0).length;
    const diversification = Math.min(positions.length / 5, 1);
    return Math.round((positiveCount / positions.length * 0.6 + diversification * 0.4) * 100);
  }, [positions]);

  const recommendations = useMemo(() => {
    const recs = [];
    if (largestPosition && largestPosition.weightNum > 50) {
      recs.push({
        label: `Rebalance ${largestPosition.name}`,
        detail: `${largestPosition.name} makes up ${largestPosition.weight} of your portfolio. Consider diversifying to reduce concentration risk.`,
        tag: 'Action', tagColor: colors.amber,
      });
    }
    const declining = positions.filter(p => p.change < 0);
    if (declining.length > 0) {
      recs.push({
        label: `Watch ${declining[0].name}`,
        detail: `${declining[0].name} is down ${Math.abs(declining[0].change).toFixed(1)}%. Monitor closely for continued decline.`,
        tag: 'Watch', tagColor: colors.amber,
      });
    }
    if (positions.length < 4) {
      recs.push({
        label: 'Diversify further',
        detail: `You hold ${positions.length} position${positions.length > 1 ? 's' : ''}. Adding more could reduce concentration risk.`,
        tag: 'Consider', tagColor: colors.accent,
      });
    }
    const positive = positions.filter(p => p.change > 0);
    if (positive.length > 0) {
      recs.push({
        label: `Hold ${positive[0].name}`,
        detail: `${positive[0].name} is showing positive momentum. No action needed at this time.`,
        tag: 'Hold', tagColor: colors.green,
      });
    }
    return recs.slice(0, 3);
  }, [positions, largestPosition]);

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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.screenTitle}>Portfolio Analysis</Text>
          <Text style={styles.screenSubtitle}>Updated just now</Text>
        </View>
        <View style={[styles.healthPill, { backgroundColor: healthScore >= 60 ? `${colors.green}1A` : `${colors.amber}1A` }]}>
          <Text style={[styles.healthPillText, { color: healthScore >= 60 ? colors.green : colors.amber }]}>
            {healthScore >= 60 ? 'Healthy' : 'Review'}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewLeft}>
            <Text style={styles.overviewValueLabel}>Total value</Text>
            <Text style={styles.overviewValue}>{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</Text>
            <View style={styles.overviewGainRow}>
              <View style={styles.overviewGainBadge}>
                <Text style={styles.overviewGainText}>Live</Text>
              </View>
              <Text style={styles.overviewGainSub}>Cash + positions</Text>
            </View>
          </View>
          <View style={styles.overviewRight}>
            <RingProgress percent={healthScore / 100} size={72} strokeWidth={6} ringColor={healthScore >= 60 ? colors.green : colors.amber} />
            <Text style={styles.overviewScoreLabel}>Health score</Text>
            <Text style={[styles.overviewScore, { color: healthScore >= 60 ? colors.green : colors.amber }]}>{healthScore}</Text>
          </View>
        </View>

        {/* What we found */}
        <Text style={styles.sectionTitle}>What we found</Text>
        <View style={styles.glassCard}>
          <View style={styles.tabRow}>
            {['Summary', 'Risk', 'Momentum'].map((t, i) => (
              <TouchableOpacity key={i} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)} activeOpacity={0.8}>
                <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {activeTab === 0 && (
            <Text style={styles.findingText}>
              You hold <Text style={styles.findingBold}>{positions.length} position{positions.length !== 1 ? 's' : ''}</Text> with a total value of <Text style={styles.findingBold}>{totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} SAR</Text>.{' '}
              {positions.filter(p => p.change >= 0).length > 0
                ? `${positions.filter(p => p.change >= 0).map(p => p.name).join(', ')} ${positions.filter(p => p.change >= 0).length === 1 ? 'is' : 'are'} showing positive momentum.`
                : 'All positions are currently showing declines — monitor closely.'}
            </Text>
          )}
          {activeTab === 1 && (
            <Text style={styles.findingText}>
              {positions.length < 3
                ? <><Text style={styles.findingBold}>High concentration risk</Text> — with only {positions.length} holding{positions.length !== 1 ? 's' : ''}, consider diversifying.</>
                : largestPosition && largestPosition.weightNum > 50
                  ? <><Text style={styles.findingBold}>{largestPosition.name}</Text> makes up {largestPosition.weight} of your portfolio — this creates concentration risk.</>
                  : <>Your portfolio has <Text style={styles.findingBold}>moderate concentration risk</Text>. Consider adding more positions to improve stability.</>
              }
            </Text>
          )}
          {activeTab === 2 && (
            <Text style={styles.findingText}>
              {positions.filter(p => p.change >= 0).length >= positions.length / 2
                ? <>Overall portfolio momentum is <Text style={styles.findingBold}>positive</Text>. {positions.filter(p => p.change >= 0).length} of {positions.length} positions are trending upward.</>
                : <>Portfolio momentum is <Text style={styles.findingBold}>mixed</Text>. Monitor declining positions closely.</>
              }
            </Text>
          )}
        </View>

        {/* Position signals */}
        <Text style={styles.sectionTitle}>Position signals</Text>
        {positions.map((pos) => (
          <View key={pos.ticker} style={[styles.glassCard, styles.driverCard]}>
            <View style={[styles.driverIcon, { backgroundColor: pos.iconBg }]}>
              <Text style={[styles.driverIconGlyph, { color: pos.iconColor }]}>{pos.iconGlyph}</Text>
            </View>
            <View style={styles.driverContent}>
              <View style={styles.driverTitleRow}>
                <Text style={styles.driverTicker}>{pos.name}</Text>
                <Text style={styles.driverWeight}>{pos.weight}</Text>
              </View>
              <Text style={styles.driverSignal}>{pos.signal}</Text>
            </View>
            <View style={[styles.tagPill, { backgroundColor: `${pos.tagColor}1A` }]}>
              <Text style={[styles.tagPillText, { color: pos.tagColor }]}>{pos.tag}</Text>
            </View>
          </View>
        ))}

        {/* Risk */}
        <Text style={styles.sectionTitle}>Risk & diversification</Text>
        <View style={styles.glassCard}>
          <View style={styles.riskTopRow}>
            <Text style={styles.riskBasedText}>Based on your profile and holdings</Text>
            <View style={[styles.tagPill, { backgroundColor: `${colors.amber}1A` }]}>
              <Text style={[styles.tagPillText, { color: colors.amber }]}>Medium</Text>
            </View>
          </View>
          <View style={styles.riskSegmentsRow}>
            <View style={[styles.riskSegment, { backgroundColor: colors.green }]} />
            <View style={[styles.riskSegment, { backgroundColor: colors.amber }]} />
            <View style={[styles.riskSegment, { backgroundColor: 'rgba(255,255,255,0.10)' }]} />
            <View style={[styles.riskSegment, { backgroundColor: 'rgba(255,255,255,0.10)' }]} />
            <View style={[styles.riskSegment, { backgroundColor: 'rgba(255,255,255,0.10)' }]} />
          </View>
          <View style={styles.riskBarLabels}>
            <Text style={styles.riskBarLabel}>Low</Text>
            <Text style={styles.riskBarLabel}>Medium</Text>
            <Text style={styles.riskBarLabel}>High</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Holdings</Text>
            <Text style={styles.statValue}>{positions.length}</Text>
          </View>
          {largestPosition && (
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Largest position</Text>
              <Text style={styles.statValue}>{largestPosition.name} — {largestPosition.weight}</Text>
            </View>
          )}
          <View style={[styles.statRow, { marginBottom: 0 }]}>
            <Text style={styles.statLabel}>Available cash</Text>
            <Text style={styles.statValue}>{(portfolio?.cash_balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</Text>
          </View>
        </View>

        {/* Recommendations */}
        <Text style={styles.sectionTitle}>Recommendations</Text>
        {recommendations.map((rec, i) => (
          <View key={i} style={[styles.glassCard, styles.recCard]}>
            <View style={styles.recTop}>
              <Text style={styles.recLabel}>{rec.label}</Text>
              <View style={[styles.tagPill, { backgroundColor: `${rec.tagColor}1A` }]}>
                <Text style={[styles.tagPillText, { color: rec.tagColor }]}>{rec.tag}</Text>
              </View>
            </View>
            <Text style={styles.recDetail}>{rec.detail}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerGhostBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.footerGhostBtnText}>Go back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerPrimaryBtn}
          onPress={() => navigation.navigate('Trade')}
          activeOpacity={0.85}
        >
          <Text style={styles.footerPrimaryBtnText}>Go to trade</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  backBtn: { width: 64 },
  backText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  topBarCenter: { flex: 1, alignItems: 'center' },
  screenTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },
  screenSubtitle: { color: colors.gray500, fontSize: 12, marginTop: 1 },
  healthPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  healthPillText: { fontSize: 11, fontWeight: '600' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 },
  overviewCard: { backgroundColor: colors.bgSecondary, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  overviewLeft: { flex: 1 },
  overviewValueLabel: { color: colors.gray500, fontSize: 13, marginBottom: 4 },
  overviewValue: { color: colors.white, fontSize: 26, fontWeight: '700', letterSpacing: -0.5, marginBottom: 8 },
  overviewGainRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  overviewGainBadge: { backgroundColor: `${colors.green}1A`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  overviewGainText: { color: colors.green, fontSize: 13, fontWeight: '700' },
  overviewGainSub: { color: colors.gray500, fontSize: 12 },
  overviewRight: { alignItems: 'center', gap: 4 },
  overviewScoreLabel: { color: colors.gray500, fontSize: 11, marginTop: 6 },
  overviewScore: { fontSize: 20, fontWeight: '700' },
  sectionTitle: { color: colors.white, fontSize: 14, fontWeight: '700', marginBottom: 10, marginTop: 4 },
  glassCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, marginBottom: 12 },
  tagPill: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start' },
  tagPillText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 12 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: { flex: 1, height: 30, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  tabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText: { color: colors.gray400, fontSize: 12, fontWeight: '500' },
  tabTextActive: { color: colors.bg, fontWeight: '700' },
  findingText: { color: colors.gray400, fontSize: 13, lineHeight: 22 },
  findingBold: { color: colors.white, fontWeight: '700' },
  driverCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  driverIconGlyph: { fontSize: 16, fontWeight: '700' },
  driverContent: { flex: 1 },
  driverTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  driverTicker: { color: colors.white, fontSize: 14, fontWeight: '700' },
  driverWeight: { color: colors.gray500, fontSize: 12 },
  driverSignal: { color: colors.gray400, fontSize: 12 },
  riskTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  riskBasedText: { color: colors.gray500, fontSize: 12 },
  riskSegmentsRow: { flexDirection: 'row', gap: 3, marginBottom: 6 },
  riskSegment: { flex: 1, height: 6, borderRadius: 2 },
  riskBarLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  riskBarLabel: { color: colors.gray500, fontSize: 10 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statLabel: { color: colors.gray500, fontSize: 13 },
  statValue: { color: colors.white, fontSize: 13, fontWeight: '700', flexShrink: 1, textAlign: 'right', marginLeft: 8 },
  recCard: { gap: 8 },
  recTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recLabel: { color: colors.white, fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  recDetail: { color: colors.gray400, fontSize: 13, lineHeight: 20 },
  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'rgba(10,11,15,0.96)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.10)' },
  footerGhostBtn: { height: 52, paddingHorizontal: 20, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  footerGhostBtnText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  footerPrimaryBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  footerPrimaryBtnText: { color: colors.bg, fontSize: 15, fontWeight: '700' },
});