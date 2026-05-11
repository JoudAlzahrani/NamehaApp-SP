import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors } from '../theme/colors';
import RiskWarningModal from './RiskWarningScreen';
import { API } from '../services/api';
import { useAuth } from '../context/AppContext';

interface OrderEntryScreenProps {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

const COMPANY_NAMES: Record<string, string> = {
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
  'AAPL': 'Apple',
  'MSFT': 'Microsoft',
  'NVDA': 'NVIDIA',
  'TSLA': 'Tesla',
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

export default function OrderEntryScreen({ navigation, route }: OrderEntryScreenProps) {
  const { userId } = useAuth();
  const ticker = (route?.params?.ticker || 'AAPL').toUpperCase();
  const mode: 'buy' | 'sell' = route?.params?.mode || 'buy';
  const companyName = COMPANY_NAMES[ticker] ?? ticker;
  const currency = /^\d+$/.test(ticker) ? 'SAR' : 'USD';

  const [shares, setShares] = useState(1);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [riskModalVisible, setRiskModalVisible] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const total = currentPrice ? shares * currentPrice : 0;
  const canProceed = mode === 'buy'
    ? total > 0 && total <= availableBalance && !submitting
    : shares > 0 && !submitting;

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoadingQuote(true);
      try {
        const [quote, portfolio] = await Promise.all([
          API.quote(ticker),
          API.getPortfolio(userId ?? ''),
        ]);
        if (!active) return;
        setCurrentPrice(quote?.c ?? null);
        setQuoteData(quote);
        setLimitPrice((quote?.c ?? '').toString());
        setAvailableBalance(portfolio?.cash_balance ?? 0);
      } catch {
        Alert.alert('Error', 'Failed to load stock data');
      } finally {
        if (active) setLoadingQuote(false);
      }
    };
    load();
    return () => { active = false; };
  }, [ticker]);

  const handleConfirmTrade = async () => {
    if (!currentPrice) return;
    setSubmitting(true);
    try {
      const result = mode === 'buy'
        ? await API.buy(userId ?? '', ticker, total)
        : await API.sell(userId ?? '', ticker, shares);

      if (result?.error || result?.detail) throw new Error(result.error ?? result.detail);

      setRiskModalVisible(false);
      navigation.navigate('TradeSuccess', {
        ticker,
        shares: result.quantity ?? shares,
        total: (result.price ?? currentPrice) * (result.quantity ?? shares),
        mode,
      });
    } catch (e: any) {
      Alert.alert('Trade Failed', e.message || 'Please try again');
    } finally {
      setSubmitting(false);
      setRiskModalVisible(false);
    }
  };

  const recommendedShares = currentPrice
    ? Math.max(1, Math.floor((availableBalance * 0.1) / currentPrice))
    : 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* العنوان باسم الشركة */}
        <Text style={styles.title}>{mode === 'buy' ? 'Buy' : 'Sell'} {companyName}</Text>
        <Text style={styles.tickerSubtitle}>{ticker}</Text>

        {loadingQuote
          ? <ActivityIndicator color={colors.accent} style={{ marginVertical: 20 }} />
          : <Text style={styles.subtitle}>Current price: {currentPrice?.toFixed(2) ?? '—'} {currency}</Text>
        }

        {/* Order type */}
        <Text style={styles.fieldLabel}>Order type</Text>
        <View style={styles.orderTypePills}>
          {(['market', 'limit'] as const).map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.orderTypePill, orderType === type && styles.orderTypePillActive]}
              onPress={() => setOrderType(type)}
              activeOpacity={0.8}
            >
              <Text style={[styles.orderTypePillText, orderType === type && styles.orderTypePillTextActive]}>
                {type === 'market' ? 'Market order' : 'Limit order'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {orderType === 'limit' && (
          <View style={styles.limitPriceWrapper}>
            <Text style={styles.fieldLabel}>Your target price ({currency})</Text>
            <TextInput
              style={styles.limitPriceInput}
              value={limitPrice}
              onChangeText={setLimitPrice}
              keyboardType="decimal-pad"
              placeholderTextColor={colors.gray500}
            />
          </View>
        )}

        {/* Live Market Data */}
        <Text style={styles.marketDataLabel}>LIVE MARKET DATA</Text>
        <View style={styles.marketDataCard}>
          {quoteData ? [
            { label: 'Current price', value: `${quoteData.c?.toFixed(2)} ${currency}`, color: colors.white },
            { label: 'Prev close',    value: `${quoteData.pc?.toFixed(2)} ${currency}`, color: colors.white },
            { label: 'High today',    value: `${quoteData.h?.toFixed(2)} ${currency}`, color: colors.white },
            { label: 'Low today',     value: `${quoteData.l?.toFixed(2)} ${currency}`, color: colors.white },
            { label: 'Open',          value: `${quoteData.o?.toFixed(2)} ${currency}`, color: colors.white },
            {
              label: 'Change today',
              value: quoteData.pc ? `${((quoteData.c - quoteData.pc) / quoteData.pc * 100).toFixed(2)}%` : '—',
              color: quoteData.c >= quoteData.pc ? colors.green : colors.red,
            },
          ].map(item => (
            <View key={item.label} style={styles.statChip}>
              <Text style={styles.statChipLabel}>{item.label}</Text>
              <Text style={[styles.statChipValue, { color: item.color }]}>{item.value}</Text>
            </View>
          )) : <ActivityIndicator color={colors.accent} />}
        </View>

        {/* Shares */}
        <Text style={styles.label}>Number of shares</Text>
        <View style={styles.sharesControl}>
          <TouchableOpacity style={styles.adjustBtn} onPress={() => setShares(Math.max(1, shares - 1))} activeOpacity={0.7}>
            <Text style={styles.adjustBtnText}>−</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.sharesInput}
            value={String(shares)}
            onChangeText={t => setShares(Math.max(1, parseInt(t) || 1))}
            keyboardType="numeric"
            textAlign="center"
          />
          <TouchableOpacity style={styles.adjustBtn} onPress={() => setShares(shares + 1)} activeOpacity={0.7}>
            <Text style={styles.adjustBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {mode === 'buy' && currentPrice && (
          <TouchableOpacity style={styles.recommendationChip} onPress={() => setShares(recommendedShares)} activeOpacity={0.7}>
            <Text style={styles.recommendationIcon}>✦</Text>
            <Text style={styles.recommendationText}>
              Based on your balance, {recommendedShares} shares is a good starting point
            </Text>
          </TouchableOpacity>
        )}

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shares</Text>
            <Text style={styles.summaryValue}>{shares}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price per share</Text>
            <Text style={styles.summaryValue}>{currentPrice?.toFixed(2) ?? '—'} {currency}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{total.toFixed(2)} {currency}</Text>
          </View>
        </View>

        {mode === 'buy' && (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceText}>
              Available balance: {availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.continueBtn,
            !canProceed && styles.continueBtnDisabled,
            mode === 'sell' && canProceed && styles.sellContinueBtn,
          ]}
          onPress={() => canProceed && setRiskModalVisible(true)}
          disabled={!canProceed || loadingQuote}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color={mode === 'sell' ? colors.red : colors.bg} />
            : (
              <Text style={[
                styles.continueBtnText,
                !canProceed && styles.continueBtnTextDisabled,
                mode === 'sell' && canProceed && styles.sellContinueBtnText,
              ]}>
                {mode === 'buy'
                  ? total > availableBalance ? 'Exceeds balance' : 'Review order'
                  : 'Review sell order'}
              </Text>
            )}
        </TouchableOpacity>
      </ScrollView>

      <RiskWarningModal
        visible={riskModalVisible}
        ticker={ticker}
        shares={shares}
        total={total}
        onProceed={handleConfirmTrade}
        onDismiss={() => setRiskModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 32, paddingTop: 56 },
  backText: { color: colors.accent, fontSize: 15, fontWeight: '600', marginBottom: 24 },
  scroll: { paddingHorizontal: 32, paddingBottom: 40 },
  title: { color: colors.white, fontSize: 28, fontWeight: '700', marginBottom: 4 },
  tickerSubtitle: { color: colors.gray500, fontSize: 13, fontWeight: '500', marginBottom: 8 },
  subtitle: { color: colors.gray400, fontSize: 15, marginBottom: 32 },
  label: { color: colors.white, fontSize: 15, fontWeight: '600', marginBottom: 16 },
  fieldLabel: { color: colors.gray500, fontSize: 12, fontWeight: '500', marginBottom: 10 },
  orderTypePills: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  orderTypePill: { flex: 1, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(255,255,255,0.04)' },
  orderTypePillActive: { backgroundColor: colors.white, borderColor: colors.white },
  orderTypePillText: { color: colors.gray400, fontSize: 14, fontWeight: '500' },
  orderTypePillTextActive: { color: colors.bg, fontWeight: '700' },
  limitPriceWrapper: { marginBottom: 20 },
  limitPriceInput: { height: 52, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingHorizontal: 16, color: colors.white, fontSize: 18, fontWeight: '600' },
  marketDataLabel: { color: colors.gray500, fontSize: 11, fontWeight: '600', letterSpacing: 0.7, marginBottom: 10 },
  marketDataCard: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 12, marginBottom: 28 },
  statChip: { width: '47%', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexGrow: 1 },
  statChipLabel: { color: colors.gray500, fontSize: 11, marginBottom: 4 },
  statChipValue: { fontSize: 13, fontWeight: '700' },
  sharesControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSecondary, borderRadius: 14, padding: 16, gap: 12, marginBottom: 28 },
  adjustBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.bgTertiary, alignItems: 'center', justifyContent: 'center' },
  adjustBtnText: { color: colors.white, fontSize: 22, fontWeight: '400', lineHeight: 24 },
  sharesInput: { flex: 1, color: colors.white, fontSize: 32, fontWeight: '700', textAlign: 'center' },
  recommendationChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, backgroundColor: 'rgba(0,232,255,0.08)', borderColor: 'rgba(0,232,255,0.25)', borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 20 },
  recommendationIcon: { color: '#00E8FF', fontSize: 12 },
  recommendationText: { color: '#00E8FF', fontSize: 12, fontWeight: '500' },
  summaryCard: { backgroundColor: colors.bgSecondary, borderRadius: 16, padding: 24, marginBottom: 16 },
  summaryTitle: { color: colors.white, fontSize: 18, fontWeight: '700', marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  summaryLabel: { color: colors.gray400, fontSize: 15 },
  summaryValue: { color: colors.white, fontSize: 16, fontWeight: '700' },
  summaryDivider: { height: 1, backgroundColor: colors.gray800, marginBottom: 16 },
  totalLabel: { color: colors.white, fontSize: 17, fontWeight: '700' },
  totalValue: { color: colors.white, fontSize: 22, fontWeight: '700' },
  balanceCard: { backgroundColor: `${colors.accent}1A`, borderWidth: 1, borderColor: `${colors.accent}33`, borderRadius: 12, padding: 16, marginBottom: 28 },
  balanceText: { color: colors.accent, fontSize: 14, fontWeight: '500' },
  continueBtn: { height: 56, backgroundColor: colors.accent, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  continueBtnDisabled: { backgroundColor: colors.bgTertiary },
  continueBtnText: { color: colors.bg, fontSize: 16, fontWeight: '700' },
  continueBtnTextDisabled: { color: colors.gray600 },
  sellContinueBtn: { backgroundColor: `${colors.red}1A`, borderWidth: 2, borderColor: `${colors.red}4D` },
  sellContinueBtnText: { color: colors.red },
});