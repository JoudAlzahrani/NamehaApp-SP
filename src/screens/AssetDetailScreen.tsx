import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Star, Sparkles } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { API } from '../services/api';

interface AssetDetailScreenProps {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

// ── أسماء الشركات ─────────────────────────────────────────────────────────────
const COMPANY_NAMES: Record<string, string> = {
  // السوق السعودي
  '2222': 'Saudi Aramco',
  '2010': 'Saudi Basic Industries',
  '1120': 'Al Rajhi Bank',
  '1180': 'Saudi National Bank',
  '1150': 'Alinma Bank',
  '7010': 'Saudi Telecom Company',
  '7020': 'Mobily',
  '7030': 'Zain Saudi Arabia',
  '7040': 'Saudi Telecom Towers',
  '4002': 'Saudi Healthcare Holding',
  '4004': 'Mouwasat Medical Services',
  '4020': 'Emaar Economic City',
  '2060': 'Yanbu National Petrochemical',
  '2082': 'ACWA Power',
  '4030': 'Saudi Electricity Company',
  '2380': 'Petro Rabigh',
  '4300': 'Dar Al Arkan',
  // السوق الأمريكي
  'AAPL': 'Apple',
  'MSFT': 'Microsoft',
  'NVDA': 'NVIDIA',
  'TSLA': 'Tesla',
  'GOOGL': 'Alphabet',
  'AMZN': 'Amazon',
  'META': 'Meta Platforms',
  'JPM': 'JPMorgan Chase',
  'BAC': 'Bank of America',
  'WFC': 'Wells Fargo',
  'GS': 'Goldman Sachs',
  'JNJ': 'Johnson and Johnson',
  'UNH': 'UnitedHealth Group',
  'PFE': 'Pfizer',
  'ABBV': 'AbbVie',
  'XOM': 'ExxonMobil',
  'CVX': 'Chevron',
  'COP': 'ConocoPhillips',
  'SLB': 'Schlumberger',
  'LIN': 'Linde',
  'APD': 'Air Products and Chemicals',
  'ECL': 'Ecolab',
  'T': 'AT&T',
  'VZ': 'Verizon Communications',
  'TMUS': 'T-Mobile',
  'AMT': 'American Tower',
  'PLD': 'Prologis',
  'EQIX': 'Equinix',
  'NEE': 'NextEra Energy',
  'DUK': 'Duke Energy',
  'SO': 'Southern Company',
};

function SimpleLineChart({ values }: { values: number[] }) {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return (
    <View style={chartStyles.container}>
      {values.map((val, i) => {
        const height = ((val - min) / range) * 100 + 20;
        return (
          <View key={i} style={chartStyles.col}>
            <View style={[chartStyles.bar, { height: height }]} />
          </View>
        );
      })}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 4, marginVertical: 8 },
  col: { flex: 1, alignItems: 'center' },
  bar: { width: '100%', backgroundColor: colors.accent, borderRadius: 4, opacity: 0.85 },
});

export default function AssetDetailScreen({ navigation, route }: AssetDetailScreenProps) {
  const ticker = (route?.params?.ticker || 'AAPL').toUpperCase();
  const companyName = COMPANY_NAMES[ticker] ?? ticker;
  const currency = /^\d+$/.test(ticker) ? 'SAR' : 'USD';

  const [quote, setQuote] = useState<any>(null);
  const [candles, setCandles] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const quoteData = await API.quote(ticker);
        if (!active) return;
        if (quoteData?.c && quoteData.c > 0) {
          setQuote(quoteData);
          setCandles([quoteData.o, quoteData.l, (quoteData.o + quoteData.c) / 2, quoteData.h, quoteData.c]);
        }
      } catch {
        // نتجاهل الخطأ
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [ticker]);

  const dayChangePercent = quote?.pc ? ((quote.c - quote.pc) / quote.pc * 100) : null;
  const isPositive = (dayChangePercent ?? 0) >= 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.starBtn}>
          <Star size={22} color={colors.gray400} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.assetHeader}>
          <Text style={styles.companyName}>{companyName}</Text>
          <Text style={styles.tickerLabel}>{ticker}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.priceRow}>
            <Text style={styles.price}>{quote?.c?.toFixed(2) ?? '—'} {currency}</Text>
            {dayChangePercent !== null && (
              <View style={[styles.changeBadge, { backgroundColor: isPositive ? `${colors.green}1A` : `${colors.red}1A` }]}>
                <Text style={[styles.changeText, { color: isPositive ? colors.green : colors.red }]}>
                  {isPositive ? '↑' : '↓'} {isPositive ? '+' : ''}{dayChangePercent.toFixed(2)}%
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.chartContainer}>
          {candles.length > 0
            ? <SimpleLineChart values={candles} />
            : !loading && <Text style={styles.noChartText}>Chart unavailable</Text>
          }
        </View>

        {quote && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Open</Text>
              <Text style={styles.statValue}>{quote.o?.toFixed(2) ?? '—'} {currency}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>High</Text>
              <Text style={styles.statValue}>{quote.h?.toFixed(2) ?? '—'} {currency}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Low</Text>
              <Text style={styles.statValue}>{quote.l?.toFixed(2) ?? '—'} {currency}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Previous Close</Text>
              <Text style={styles.statValue}>{quote.pc?.toFixed(2) ?? '—'} {currency}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.aiBtn} onPress={() => navigation.navigate('AIAnalysis', { ticker })} activeOpacity={0.75}>
        <Sparkles size={18} color={colors.accent} strokeWidth={1.5} />
        <Text style={styles.aiBtnText}>View AI analysis</Text>
      </TouchableOpacity>

      <View style={styles.tradeBtns}>
        <TouchableOpacity style={styles.buyBtn} onPress={() => navigation.navigate('OrderEntry', { ticker, mode: 'buy' })} activeOpacity={0.85}>
          <Text style={styles.buyBtnText}>Buy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sellBtn} onPress={() => navigation.navigate('OrderEntry', { ticker, mode: 'sell' })} activeOpacity={0.85}>
          <Text style={styles.sellBtnText}>Sell</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  backText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  starBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 24, paddingBottom: 24 },
  assetHeader: { marginBottom: 16, marginTop: 8 },
  companyName: { color: colors.white, fontSize: 26, fontWeight: '700', marginBottom: 4 },
  tickerLabel: { color: colors.gray500, fontSize: 14, fontWeight: '500' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  price: { color: colors.white, fontSize: 40, fontWeight: '700', letterSpacing: -1 },
  changeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  changeText: { fontSize: 16, fontWeight: '700' },
  chartContainer: { backgroundColor: colors.bgSecondary, borderRadius: 16, padding: 16, marginBottom: 16, minHeight: 80, alignItems: 'center', justifyContent: 'center' },
  noChartText: { color: colors.gray500, fontSize: 13 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: colors.bgSecondary, borderRadius: 12, padding: 16 },
  statLabel: { color: colors.gray500, fontSize: 12, fontWeight: '500', marginBottom: 6 },
  statValue: { color: colors.white, fontSize: 16, fontWeight: '700' },
  aiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, marginHorizontal: 24, marginBottom: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', gap: 8 },
  aiBtnText: { color: colors.white, fontSize: 15, fontWeight: '500', opacity: 0.85 },
  tradeBtns: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16 },
  buyBtn: { flex: 1, height: 56, backgroundColor: colors.accent, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  buyBtnText: { color: colors.bg, fontSize: 16, fontWeight: '700' },
  sellBtn: { flex: 1, height: 56, backgroundColor: `${colors.red}1A`, borderRadius: 14, borderWidth: 2, borderColor: `${colors.red}4D`, alignItems: 'center', justifyContent: 'center' },
  sellBtnText: { color: colors.red, fontSize: 16, fontWeight: '700' },
});