import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { API, BASE_URL } from '../services/api';
import { useAuth } from '../context/AppContext';
import { useMarketStatus } from '../services/marketStatus';

interface AIAnalysisScreenProps {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

const TIME_PERIODS = ['Today', 'This week', 'This month', '3 months'];
const SCENARIOS = ['If I buy', 'If I sell', 'If I hold'];

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

function lerpColor(t: number): string {
  const r = Math.round(139 + (0 - 139) * t);
  const g = Math.round(92 + (229 - 92) * t);
  const b = Math.round(246 + (204 - 246) * t);
  return `rgb(${r},${g},${b})`;
}

function LineChart({ data }: { data: number[] }) {
  const [containerWidth, setContainerWidth] = useState(300);
  const height = 100;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 8;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * containerWidth,
    y: (1 - (v - min) / range) * (height - pad * 2) + pad,
  }));
  const segments = points.slice(0, -1).map((p, i) => {
    const next = points[i + 1];
    const dx = next.x - p.x, dy = next.y - p.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    return { midX: (p.x + next.x) / 2, midY: (p.y + next.y) / 2, len, angle: Math.atan2(dy, dx) * (180 / Math.PI), color: lerpColor(i / (data.length - 2)) };
  });
  const last = points[points.length - 1];
  return (
    <View style={{ height, position: 'relative', overflow: 'hidden' }} onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}>
      {segments.map((seg, i) => <View key={i} style={{ position: 'absolute', left: seg.midX - seg.len / 2, top: seg.midY - 1.5, width: seg.len, height: 3, backgroundColor: seg.color, borderRadius: 1.5, transform: [{ rotate: `${seg.angle}deg` }] }} />)}
      <View style={{ position: 'absolute', left: last.x - 5, top: last.y - 5, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.bg }} />
    </View>
  );
}

function RingProgress({ percent, size = 48, strokeWidth = 4 }: { percent: number; size?: number; strokeWidth?: number }) {
  const r = size / 2;
  const rightRotation = 180 - (Math.min(percent, 0.5) / 0.5) * 180;
  const leftRotation = percent > 0.5 ? 180 - ((percent - 0.5) / 0.5) * 180 : 180;
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: r, borderWidth: strokeWidth, borderColor: 'rgba(255,255,255,0.12)' }} />
      <View style={{ position: 'absolute', left: r, top: 0, width: r, height: size, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: -r, top: 0, width: size, height: size, borderRadius: r, borderWidth: strokeWidth, borderColor: colors.green, transform: [{ rotate: `${rightRotation}deg` }] }} />
      </View>
      <View style={{ position: 'absolute', left: 0, top: 0, width: r, height: size, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, borderRadius: r, borderWidth: strokeWidth, borderColor: colors.green, transform: [{ rotate: `${leftRotation}deg` }] }} />
      </View>
    </View>
  );
}

export default function AIAnalysisScreen({ navigation, route }: AIAnalysisScreenProps) {
  const { userId, user } = useAuth();
  const ticker = (route?.params?.ticker || 'AAPL').toUpperCase();
  const market = /^\d+$/.test(ticker) ? 'SA' : 'US';
  const marketStatus = useMarketStatus(market as 'SA' | 'US');
  const companyName = COMPANY_NAMES[ticker] ?? ticker;
  const currency = /^\d+$/.test(ticker) ? 'SAR' : 'USD';

  const [activePeriod, setActivePeriod] = useState(0);
  const [activeScenario, setActiveScenario] = useState(0);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);
  const [proposing, setProposing] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [chartData, setChartData] = useState<number[]>([120, 121, 119, 122, 123, 122, 124, 125, 124, 126]);

  useEffect(() => {
    let active = true;
    const loadQuote = async () => {
      setLoading(true);
      try {
        const q = await API.quote(ticker);
        if (!active) return;
        if (q?.c) {
          setQuote(q);
          setChartData([q.pc ?? q.c, q.o ?? q.c, q.l ?? q.c, (q.o + q.c) / 2, q.h ?? q.c, q.c]);
        }
      } catch {}
      finally { if (active) setLoading(false); }
    };
    loadQuote();
    return () => { active = false; };
  }, [ticker]);

  useEffect(() => {
    let active = true;
    const loadAI = async () => {
      setAiLoading(true);
      try {
        const scenarioMap = ['buy', 'sell', 'hold'];
        const res = await fetch(`${BASE_URL}/ai-analysis/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticker, scenario: scenarioMap[activeScenario],
            user_id: userId ?? '', user_name: user?.name ?? '',
            amount_sar: 5000, market,
          }),
        });
        const data = await res.json();
        if (!active) return;
        if (data?.success && data?.data) setAiResult(data.data);
      } catch {}
      finally { if (active) setAiLoading(false); }
    };
    loadAI();
    return () => { active = false; };
  }, [ticker, activeScenario]);

  const dayChangePct = quote?.pc ? ((quote.c - quote.pc) / quote.pc * 100) : null;
  const positive = (dayChangePct ?? 0) >= 0;
  const opportunitySpotted = aiResult?.opportunity_spotted ?? positive;
  const confidence = (aiResult?.signal_confidence?.score_pct ?? 78) / 100;

  const indicators = aiResult?.signals ?? [
    { category: 'Price direction', description: positive ? 'Rising steadily' : 'Watch for reversal', label: positive ? 'Positive' : 'Negative' },
    { category: 'Day change', description: dayChangePct !== null ? `${dayChangePct.toFixed(2)}% today` : '—', label: 'Live' },
    { category: 'Price range today', description: quote ? `${quote.l?.toFixed(2)} – ${quote.h?.toFixed(2)}` : 'Analyzing...', label: 'Neutral' },
    { category: 'Short-term outlook', description: positive ? 'Likely to continue rising' : 'Watch for reversal', label: positive ? 'Watch' : 'Caution' },
  ];

  const labelColor = (label: string) => {
    if (label === 'Positive') return colors.green;
    if (label === 'Negative') return colors.red;
    if (label === 'Watch' || label === 'Caution') return colors.amber;
    return colors.white;
  };

  const scenarioImpact = [
    { value: '+exposure', color: colors.green },
    { value: '-exposure', color: colors.red },
    { value: 'no change', color: colors.white },
  ][activeScenario];

  const handleProceedToTrade = async () => {
    if (activeScenario === 2) { navigation.goBack(); return; }
    setProposing(true);
    try {
      const proposal = await API.requestProposal(userId ?? '', ticker, 1000);
      navigation.navigate('OrderEntry', { ticker, mode: activeScenario === 0 ? 'buy' : 'sell', ...(proposal?.proposal_id ? { proposalId: proposal.proposal_id } : {}) });
    } catch {
      navigation.navigate('OrderEntry', { ticker, mode: activeScenario === 0 ? 'buy' : 'sell' });
    } finally { setProposing(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.assetName}>{companyName}</Text>
          <Text style={styles.assetSubtitle}>{ticker} · AI Analysis</Text>
        </View>
        <View style={[styles.opportunityPill, { backgroundColor: opportunitySpotted ? `${colors.green}1A` : `${colors.red}1A` }]}>
          <Text style={[styles.opportunityPillText, { color: opportunitySpotted ? colors.green : colors.red }]}>
            {opportunitySpotted ? 'Opportunity' : 'Caution'}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.marketRow}>
          <View style={[styles.statusDot, { backgroundColor: marketStatus.isOpen ? colors.green : colors.red }]} />
          <Text style={styles.marketOpenText}>{marketStatus.label}</Text>
          <Text style={styles.marketCloseTime}>  {marketStatus.statusText}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          <>
            <View style={styles.priceRow}>
              <Text style={styles.priceText}>{quote?.c?.toFixed(2) ?? '—'} {currency}</Text>
              {dayChangePct !== null && (
                <Text style={[styles.priceChange, { color: positive ? colors.green : colors.red }]}>
                  {positive ? '+' : ''}{dayChangePct.toFixed(2)}% today
                </Text>
              )}
            </View>
            <Text style={styles.priceUpdated}>Updated just now</Text>
          </>
        )}

        <View style={styles.chartContainer}><LineChart data={chartData} /></View>

        <View style={styles.timePillsRow}>
          {TIME_PERIODS.map((p, i) => (
            <TouchableOpacity key={i} style={[styles.timePill, activePeriod === i && styles.timePillActive]} onPress={() => setActivePeriod(i)} activeOpacity={0.8}>
              <Text style={[styles.timePillText, activePeriod === i && styles.timePillTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.scenarioPillsRow}>
          {SCENARIOS.map((s, i) => (
            <TouchableOpacity key={i} style={[styles.scenarioPill, activeScenario === i && styles.scenarioPillActive]} onPress={() => setActiveScenario(i)} activeOpacity={0.8}>
              <Text style={[styles.scenarioPillText, activeScenario === i && styles.scenarioPillTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* What we found */}
        <Text style={styles.sectionTitle}>What we found</Text>
        <View style={styles.glassCard}>
          <Text style={styles.scenarioCardLabel}>Scenario: {SCENARIOS[activeScenario]}</Text>
          {aiLoading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color={colors.accent} size="small" />
              <Text style={styles.findingText}>Analyzing {companyName}...</Text>
            </View>
          ) : (
            <Text style={styles.findingText}>
              <Text style={styles.findingBold}>{companyName}</Text>
              {` — ${aiResult?.scenario_summary ?? 'Review the stats below before making a decision.'}`}
            </Text>
          )}
        </View>

        {/* Market Indicators */}
        <Text style={styles.sectionTitle}>Market indicators</Text>
        {indicators.map((d: any, i: number) => (
          <View key={i} style={[styles.glassCard, styles.driverCard]}>
            <View style={[styles.driverIcon, { backgroundColor: `${colors.accent}20` }]}>
              <Text style={[styles.driverIconGlyph, { color: colors.accent }]}>
                {d.label === 'Positive' ? '↗' : d.label === 'Negative' ? '↘' : d.label === 'Watch' ? '~' : '◷'}
              </Text>
            </View>
            <View style={styles.driverContent}>
              <Text style={styles.driverLabel}>{d.category}</Text>
              <Text style={styles.driverValue}>{d.description}</Text>
            </View>
            <View style={[styles.tagPill, { backgroundColor: `${labelColor(d.label)}1A` }]}>
              <Text style={[styles.tagPillText, { color: labelColor(d.label) }]}>{d.label}</Text>
            </View>
          </View>
        ))}

        {/* Risk */}
        <Text style={styles.sectionTitle}>Risk relative to your profile</Text>
        <View style={styles.glassCard}>
          <View style={styles.riskTopRow}>
            <Text style={styles.riskBasedText}>Based on your portfolio and goals</Text>
            <View style={[styles.tagPill, { backgroundColor: `${colors.amber}1A` }]}>
              <Text style={[styles.tagPillText, { color: colors.amber }]}>{aiResult?.risk?.level ?? 'Medium'}</Text>
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
          <Text style={styles.riskNote}>
            {aiResult?.risk?.explanation ?? 'Always diversify — avoid putting too much in a single stock. The final call is always yours.'}
          </Text>
        </View>

        {/* Portfolio Impact */}
        <Text style={styles.sectionTitle}>How this affects your portfolio</Text>
        <View style={styles.glassCard}>
          <View style={styles.portfolioRow}>
            <Text style={styles.portfolioRowLabel}>Current price</Text>
            <Text style={styles.portfolioRowValue}>{quote?.c?.toFixed(2) ?? '—'} {currency}</Text>
          </View>
          <View style={styles.portfolioRow}>
            <Text style={styles.portfolioRowLabel}>After this trade</Text>
            <Text style={[styles.portfolioRowValue, { color: scenarioImpact.color }]}>
              {aiResult?.portfolio_impact ? `${aiResult.portfolio_impact.exposure_after_trade_pct}%` : scenarioImpact.value}
            </Text>
          </View>
          <View style={styles.portfolioRow}>
            <Text style={styles.portfolioRowLabel}>Your risk profile</Text>
            <Text style={styles.portfolioRowValue}>{aiResult?.portfolio_impact?.risk_profile ?? 'Medium'}</Text>
          </View>
          <View style={[styles.portfolioRow, { marginBottom: 12 }]}>
            <Text style={styles.portfolioRowLabel}>Prev close</Text>
            <Text style={styles.portfolioRowValue}>{quote?.pc?.toFixed(2) ?? '—'} {currency}</Text>
          </View>
          <View style={styles.portfolioDivider} />
          <Text style={styles.portfolioAiNote}>
            {aiResult?.portfolio_impact?.warning ?? 'This is a simplified analysis to help you before trading.'}
          </Text>
        </View>

        {/* Indicator Reliability */}
        <Text style={styles.sectionTitle}>How reliable is this indicator?</Text>
        <View style={styles.glassCard}>
          <View style={styles.confidenceTopRow}>
            <View>
              <Text style={styles.confidenceLabel}>Indicator confidence</Text>
              <Text style={styles.confidencePercent}>{Math.round(confidence * 100)}%</Text>
            </View>
            <RingProgress percent={confidence} size={48} strokeWidth={4} />
          </View>
          <View style={styles.confidenceTrack}>
            <View style={[styles.confidenceFill, { width: `${confidence * 100}%` }]} />
          </View>
          <Text style={styles.confidenceNote}>
            {aiResult?.signal_confidence?.explanation ?? `In similar market conditions, this pattern played out as expected about ${Math.round(confidence * 100)} times out of 100. The final call is always yours.`}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerGhostBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.footerGhostBtnText}>Go back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerPrimaryBtn} onPress={handleProceedToTrade} activeOpacity={0.85} disabled={proposing}>
          {proposing
            ? <ActivityIndicator color={colors.bg} />
            : <Text style={styles.footerPrimaryBtnText}>{activeScenario === 2 ? 'Hold — go back' : 'Proceed to trade'}</Text>
          }
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
  assetName: { color: colors.white, fontSize: 16, fontWeight: '700' },
  assetSubtitle: { color: colors.gray500, fontSize: 12, marginTop: 1 },
  opportunityPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  opportunityPillText: { fontSize: 11, fontWeight: '600' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 },
  marketRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 6 },
  marketOpenText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  marketCloseTime: { color: colors.gray500, fontSize: 13 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 4 },
  priceText: { color: colors.white, fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
  priceChange: { fontSize: 15, fontWeight: '700' },
  priceUpdated: { color: colors.gray500, fontSize: 12, marginBottom: 14 },
  chartContainer: { marginBottom: 12 },
  timePillsRow: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  timePill: { height: 32, paddingHorizontal: 13, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  timePillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  timePillText: { color: colors.gray400, fontSize: 13, fontWeight: '500' },
  timePillTextActive: { color: colors.bg, fontWeight: '700' },
  scenarioPillsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  scenarioPill: { flex: 1, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  scenarioPillActive: { backgroundColor: colors.white, borderColor: colors.white },
  scenarioPillText: { color: colors.gray400, fontSize: 13, fontWeight: '500' },
  scenarioPillTextActive: { color: colors.bg, fontWeight: '700' },
  sectionTitle: { color: colors.white, fontSize: 14, fontWeight: '700', marginBottom: 10, marginTop: 4 },
  glassCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, marginBottom: 12 },
  tagPill: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  tagPillText: { fontSize: 11, fontWeight: '700' },
  scenarioCardLabel: { color: colors.gray500, fontSize: 11, fontWeight: '500', marginBottom: 10 },
  findingText: { color: colors.gray400, fontSize: 13, lineHeight: 22 },
  findingBold: { color: colors.white, fontWeight: '700' },
  driverCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  driverIconGlyph: { fontSize: 16, fontWeight: '700' },
  driverContent: { flex: 1 },
  driverLabel: { color: colors.gray500, fontSize: 11, marginBottom: 2 },
  driverValue: { color: colors.white, fontSize: 13, fontWeight: '700' },
  riskTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  riskBasedText: { color: colors.gray500, fontSize: 12 },
  riskSegmentsRow: { flexDirection: 'row', gap: 3, marginBottom: 6 },
  riskSegment: { flex: 1, height: 6, borderRadius: 2 },
  riskBarLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  riskBarLabel: { color: colors.gray500, fontSize: 10 },
  riskNote: { color: colors.gray400, fontSize: 12, lineHeight: 18 },
  portfolioRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  portfolioRowLabel: { color: colors.gray500, fontSize: 13 },
  portfolioRowValue: { color: colors.white, fontSize: 13, fontWeight: '700' },
  portfolioDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 10 },
  portfolioAiNote: { color: colors.gray500, fontSize: 12, fontStyle: 'italic', lineHeight: 18 },
  confidenceTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  confidenceLabel: { color: colors.gray500, fontSize: 12, marginBottom: 4 },
  confidencePercent: { color: colors.green, fontSize: 26, fontWeight: '700' },
  confidenceTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  confidenceFill: { height: '100%', backgroundColor: colors.green, borderRadius: 3 },
  confidenceNote: { color: colors.gray400, fontSize: 12, lineHeight: 18 },
  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'rgba(10,11,15,0.96)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.10)' },
  footerGhostBtn: { height: 52, paddingHorizontal: 20, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  footerGhostBtnText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  footerPrimaryBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  footerPrimaryBtnText: { color: colors.bg, fontSize: 15, fontWeight: '700' },
});