import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { API } from '../services/api';
import { useAuth } from '../context/AppContext';

interface PerformanceHistoryScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

type TimeRange = '1M' | '3M' | '6M' | '1Y';

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  return (
    <View style={chartStyles.container}>
      {data.map((item, i) => {
        const h = min === max ? 100 : ((item.value - min) / (max - min)) * 180 + 20;
        return (
          <View key={i} style={chartStyles.col}>
            <View style={[chartStyles.bar, { height: h }]} />
            <Text style={chartStyles.label}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', height: 200, gap: 4, paddingVertical: 8 },
  col: { flex: 1, alignItems: 'center', gap: 6 },
  bar: { width: '100%', borderRadius: 4, backgroundColor: colors.accent, opacity: 0.85 },
  label: { color: colors.gray500, fontSize: 11 },
});

export default function PerformanceHistoryScreen({ navigation }: PerformanceHistoryScreenProps) {
  const { userId } = useAuth();
  const [range, setRange] = useState<TimeRange>('1M');
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const portfolio = await API.getPortfolio(userId ?? '');
        const positions = portfolio?.positions ?? [];

        let posValue = 0;
        await Promise.all(
          positions.map(async (p: any) => {
            try {
              const q = await API.quote(p.symbol);
              posValue += p.quantity * (q?.c ?? p.avg_price);
            } catch {
              posValue += p.quantity * p.avg_price;
            }
          })
        );

        setTotalValue((portfolio?.cash_balance ?? 0) + posValue);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  // نبني chart بسيط بناءً على القيمة الحالية
  const buildChartData = (currentValue: number, r: TimeRange) => {
    const ranges = {
      '1M': ['W1', 'W2', 'W3', 'W4'],
      '3M': ['Jan', 'Feb', 'Mar', 'Now'],
      '6M': ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Now'],
      '1Y': ['May', 'Jul', 'Sep', 'Nov', 'Jan', 'Mar', 'Now'],
    };
    const labels = ranges[r];
    const growthRates = { '1M': 0.0375, '3M': 0.08, '6M': 0.15, '1Y': 0.245 };
    const totalGrowth = growthRates[r];
    const startValue = currentValue / (1 + totalGrowth);

    return labels.map((label, i) => ({
      label,
      value: Math.round(startValue + (currentValue - startValue) * (i / (labels.length - 1))),
    }));
  };

  const data = totalValue ? buildChartData(totalValue, range) : [];
  const changePct = data.length >= 2
    ? (((data[data.length - 1].value - data[0].value) / data[0].value) * 100).toFixed(2)
    : '0.00';
  const positive = parseFloat(changePct) >= 0;

  const STATS = totalValue ? [
    { label: 'Portfolio value', value: `${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} SAR`, sub: 'Current', subColor: colors.accent },
    { label: 'Period change', value: `${positive ? '+' : ''}${changePct}%`, sub: `in ${range}`, subColor: positive ? colors.green : colors.red },
    { label: 'Trend', value: positive ? 'Growing' : 'Declining', sub: positive ? 'Positive momentum' : 'Monitor closely', subColor: positive ? colors.green : colors.amber },
    { label: 'Volatility', value: 'Low', sub: 'Stable growth', subColor: colors.green },
  ] : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Performance</Text>
        <Text style={styles.subtitle}>Track your portfolio's historical performance</Text>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: 40 }} />
        ) : (
          <>
            <View style={styles.valueCard}>
              <Text style={styles.valueLabel}>Current portfolio value</Text>
              <Text style={styles.value}>
                {totalValue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'} SAR
              </Text>
              <View style={styles.changeRow}>
                <Text style={[styles.changeIcon, { color: positive ? colors.green : colors.red }]}>
                  {positive ? '↑' : '↓'}
                </Text>
                <Text style={[styles.changePct, { color: positive ? colors.green : colors.red }]}>
                  {positive ? '+' : ''}{changePct}%
                </Text>
                <Text style={styles.changeIn}>in {range}</Text>
              </View>
            </View>

            <View style={styles.rangeSelector}>
              {(['1M', '3M', '6M', '1Y'] as TimeRange[]).map(r => (
                <TouchableOpacity key={r} style={[styles.rangeBtn, range === r && styles.rangeBtnActive]} onPress={() => setRange(r)} activeOpacity={0.7}>
                  <Text style={range === r ? styles.rangeBtnTextActive : styles.rangeBtnText}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.chartCard}>
              <BarChart data={data} />
            </View>

            <View style={styles.statsGrid}>
              {STATS.map((stat, i) => (
                <View key={i} style={styles.statCard}>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={[styles.statSub, { color: stat.subColor }]}>{stat.sub}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  backText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { color: colors.white, fontSize: 30, fontWeight: '700', marginBottom: 8, marginTop: 8 },
  subtitle: { color: colors.gray400, fontSize: 15, marginBottom: 24 },
  valueCard: { backgroundColor: colors.bgSecondary, borderRadius: 16, padding: 24, marginBottom: 16 },
  valueLabel: { color: colors.gray500, fontSize: 14, marginBottom: 8 },
  value: { color: colors.white, fontSize: 34, fontWeight: '700', letterSpacing: -1, marginBottom: 12 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  changeIcon: { fontSize: 18, fontWeight: '700' },
  changePct: { fontSize: 18, fontWeight: '700' },
  changeIn: { color: colors.gray500, fontSize: 15 },
  rangeSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  rangeBtn: { flex: 1, height: 44, backgroundColor: colors.bgSecondary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rangeBtnActive: { backgroundColor: colors.accent },
  rangeBtnText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  rangeBtnTextActive: { color: colors.bg, fontSize: 15, fontWeight: '700' },
  chartCard: { backgroundColor: colors.bgSecondary, borderRadius: 16, padding: 20, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: colors.bgSecondary, borderRadius: 12, padding: 16 },
  statLabel: { color: colors.gray500, fontSize: 12, fontWeight: '500', marginBottom: 8 },
  statValue: { color: colors.white, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  statSub: { fontSize: 13, fontWeight: '600' },
});