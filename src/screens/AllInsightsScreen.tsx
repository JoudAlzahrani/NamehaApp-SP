import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { API } from '../services/api';
import { useAuth } from '../context/AppContext';

interface AllInsightsScreenProps {
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

export default function AllInsightsScreen({ navigation }: AllInsightsScreenProps) {
  const { userId } = useAuth();
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const portfolio = await API.getPortfolio(userId ?? '');
        const positions = portfolio?.positions ?? [];

        const insightList = await Promise.all(
          positions.map(async (p: any) => {
            try {
              const q = await API.quote(p.symbol);
              const currentPrice = q?.c ?? p.avg_price;
              const change = p.avg_price ? ((currentPrice - p.avg_price) / p.avg_price) * 100 : 0;
              const positive = change >= 0;

              return {
                ticker: p.symbol,
                name: COMPANY_NAMES[p.symbol] ?? p.symbol,
                color: positive ? colors.green : colors.amber,
                strength: Math.round(55 + Math.abs(change) * 3),
                title: positive ? 'Opportunity spotted' : 'Hold suggested',
                description: positive
                  ? `${COMPANY_NAMES[p.symbol] ?? p.symbol} is up ${change.toFixed(1)}% from your purchase price. Current momentum suggests continued growth.`
                  : `${COMPANY_NAMES[p.symbol] ?? p.symbol} is down ${Math.abs(change).toFixed(1)}% from your purchase price. Consider holding and monitoring closely.`,
                change,
              };
            } catch {
              return null;
            }
          })
        );

        setInsights(insightList.filter(Boolean));
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>All Insights</Text>
        <Text style={styles.subtitle}>{insights.length} opportunities and recommendations for you</Text>

        {insights.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No positions yet — start trading to get insights</Text>
          </View>
        ) : (
          insights.map((insight, i) => (
            <View key={i} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={styles.insightTickerRow}>
                  <View style={[styles.insightDot, { backgroundColor: insight.color }]} />
                  <Text style={[styles.insightTicker, { color: insight.color }]}>{insight.name}</Text>
                </View>
                <View style={[styles.insightTag, { backgroundColor: `${insight.color}1A` }]}>
                  <Text style={[styles.insightTagText, { color: insight.color }]}>{insight.title}</Text>
                </View>
              </View>
              <Text style={styles.insightDesc}>{insight.description}</Text>
              <View style={styles.strengthRow}>
                <Text style={styles.strengthLabel}>Signal strength</Text>
                <View style={styles.strengthTrack}>
                  <View style={[styles.strengthFill, { width: `${Math.min(insight.strength, 100)}%` as any, backgroundColor: insight.color }]} />
                </View>
                <Text style={styles.strengthValue}>{Math.min(insight.strength, 100)}%</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => navigation.navigate('AIAnalysis', { ticker: insight.ticker })}
                  activeOpacity={0.85}
                >
                  <Text style={styles.reviewBtnText}>Review</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dismissBtn} activeOpacity={0.7}>
                  <Text style={styles.dismissBtnText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { color: colors.white, fontSize: 30, fontWeight: '700', marginBottom: 8, marginTop: 8 },
  subtitle: { color: colors.gray400, fontSize: 15, marginBottom: 24 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.gray500, fontSize: 14, textAlign: 'center' },
  insightCard: { backgroundColor: colors.bgSecondary, borderRadius: 16, padding: 20, marginBottom: 16 },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  insightTickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  insightDot: { width: 8, height: 8, borderRadius: 4 },
  insightTicker: { fontSize: 16, fontWeight: '700', flex: 1 },
  insightTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  insightTagText: { fontSize: 12, fontWeight: '700' },
  insightDesc: { color: colors.gray400, fontSize: 14, lineHeight: 22, marginBottom: 16 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  strengthLabel: { color: colors.gray500, fontSize: 12, fontWeight: '500' },
  strengthTrack: { flex: 1, height: 6, backgroundColor: colors.gray700, borderRadius: 3, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 3 },
  strengthValue: { color: colors.gray400, fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
  reviewBtn: { flex: 1, height: 44, backgroundColor: colors.accent, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reviewBtnText: { color: colors.bg, fontSize: 14, fontWeight: '700' },
  dismissBtn: { height: 44, paddingHorizontal: 20, backgroundColor: colors.bgTertiary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dismissBtnText: { color: colors.gray300, fontSize: 14, fontWeight: '600' },
});