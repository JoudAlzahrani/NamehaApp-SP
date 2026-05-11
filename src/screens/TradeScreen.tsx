import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Fuel, Landmark, Monitor, Heart, Atom, Radio, Building2, Zap, Search } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useMarketStatus } from '../services/marketStatus';

interface TradeScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

interface Sector {
  id: string;
  name: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  count: number;
  color: string;
}

interface Stock {
  ticker: string;
  name: string;
  market: 'US' | 'SA';
  initials: string;
  logoColor: string;
}

const SECTOR_COLOR = '#00E8FF';

const SECTORS: Sector[] = [
  { id: 'energy',     name: 'Energy',      Icon: Fuel,      count: 6, color: SECTOR_COLOR },
  { id: 'finance',    name: 'Finance',     Icon: Landmark,  count: 7, color: SECTOR_COLOR },
  { id: 'technology', name: 'Technology',  Icon: Monitor,   count: 6, color: SECTOR_COLOR },
  { id: 'health',     name: 'Health',      Icon: Heart,     count: 6, color: SECTOR_COLOR },
  { id: 'materials',  name: 'Materials',   Icon: Atom,      count: 5, color: SECTOR_COLOR },
  { id: 'telecom',    name: 'Telecom',     Icon: Radio,     count: 5, color: SECTOR_COLOR },
  { id: 'realestate', name: 'Real Estate', Icon: Building2, count: 4, color: SECTOR_COLOR },
  { id: 'utilities',  name: 'Utilities',   Icon: Zap,       count: 4, color: SECTOR_COLOR },
];

const SECTOR_STOCKS: Record<string, Stock[]> = {
  energy: [
    { ticker: 'XOM',  name: 'ExxonMobil',                   market: 'US', initials: 'XO', logoColor: '#1D6FA4' },
    { ticker: 'CVX',  name: 'Chevron',                       market: 'US', initials: 'CV', logoColor: '#2D5A8E' },
    { ticker: 'COP',  name: 'ConocoPhillips',                market: 'US', initials: 'CO', logoColor: '#1A6B3C' },
    { ticker: 'SLB',  name: 'Schlumberger',                  market: 'US', initials: 'SL', logoColor: '#6B3A1A' },
    { ticker: '2222', name: 'Saudi Aramco',                  market: 'SA', initials: 'AR', logoColor: '#1D5C8B' },
    { ticker: '4030', name: 'Saudi Electricity Company',     market: 'SA', initials: 'SE', logoColor: '#1A6B6B' },
  ],
  finance: [
    { ticker: 'JPM',  name: 'JPMorgan Chase',                market: 'US', initials: 'JP', logoColor: '#1A3A6B' },
    { ticker: 'BAC',  name: 'Bank of America',               market: 'US', initials: 'BA', logoColor: '#8B1A1A' },
    { ticker: 'WFC',  name: 'Wells Fargo',                   market: 'US', initials: 'WF', logoColor: '#8B4513' },
    { ticker: 'GS',   name: 'Goldman Sachs',                 market: 'US', initials: 'GS', logoColor: '#1A6B5A' },
    { ticker: '1120', name: 'Al Rajhi Bank',                 market: 'SA', initials: 'AR', logoColor: '#8B4513' },
    { ticker: '1180', name: 'Saudi National Bank',           market: 'SA', initials: 'SN', logoColor: '#1A3A6B' },
    { ticker: '1150', name: 'Alinma Bank',                   market: 'SA', initials: 'AL', logoColor: '#6B3A8B' },
  ],
  technology: [
    { ticker: 'AAPL', name: 'Apple',                         market: 'US', initials: 'AP', logoColor: '#1A1A1A' },
    { ticker: 'MSFT', name: 'Microsoft',                     market: 'US', initials: 'MS', logoColor: '#0A4D8B' },
    { ticker: 'NVDA', name: 'NVIDIA',                        market: 'US', initials: 'NV', logoColor: '#1A6B1A' },
    { ticker: 'TSLA', name: 'Tesla',                         market: 'US', initials: 'TS', logoColor: '#8B1A1A' },
    { ticker: '7010', name: 'Saudi Telecom Company',         market: 'SA', initials: 'ST', logoColor: '#0A4D8B' },
    { ticker: '7020', name: 'Mobily',                        market: 'SA', initials: 'MB', logoColor: '#1A6B1A' },
  ],
  health: [
    { ticker: 'JNJ',  name: 'Johnson & Johnson',             market: 'US', initials: 'JJ', logoColor: '#8B1A1A' },
    { ticker: 'UNH',  name: 'UnitedHealth Group',            market: 'US', initials: 'UH', logoColor: '#1A4A8B' },
    { ticker: 'PFE',  name: 'Pfizer',                        market: 'US', initials: 'PF', logoColor: '#1A6B3C' },
    { ticker: 'ABBV', name: 'AbbVie',                        market: 'US', initials: 'AB', logoColor: '#6B1A6B' },
    { ticker: '4002', name: 'Saudi Healthcare Holding',      market: 'SA', initials: 'SH', logoColor: '#1A6B3C' },
    { ticker: '4004', name: 'Mouwasat Medical Services',     market: 'SA', initials: 'MW', logoColor: '#1A4A8B' },
  ],
  materials: [
    { ticker: 'LIN',  name: 'Linde',                         market: 'US', initials: 'LI', logoColor: '#0A5C8B' },
    { ticker: 'APD',  name: 'Air Products and Chemicals',    market: 'US', initials: 'AP', logoColor: '#6B4A1A' },
    { ticker: 'ECL',  name: 'Ecolab',                        market: 'US', initials: 'EC', logoColor: '#1A6B5A' },
    { ticker: '2010', name: 'Saudi Basic Industries SABIC',  market: 'SA', initials: 'SB', logoColor: '#0A5C8B' },
    { ticker: '2060', name: 'Yanbu National Petrochemical',  market: 'SA', initials: 'YN', logoColor: '#6B4A1A' },
  ],
  telecom: [
    { ticker: 'T',    name: 'AT&T',                          market: 'US', initials: 'AT', logoColor: '#0A4D8B' },
    { ticker: 'VZ',   name: 'Verizon Communications',        market: 'US', initials: 'VZ', logoColor: '#8B1A1A' },
    { ticker: 'TMUS', name: 'T-Mobile US',                   market: 'US', initials: 'TM', logoColor: '#6B1A6B' },
    { ticker: '7030', name: 'Zain Saudi Arabia',             market: 'SA', initials: 'ZN', logoColor: '#8B1A1A' },
    { ticker: '7040', name: 'Saudi Telecom Towers',          market: 'SA', initials: 'TT', logoColor: '#1A5C8B' },
  ],
  realestate: [
    { ticker: 'AMT',  name: 'American Tower',                market: 'US', initials: 'AM', logoColor: '#1A5C8B' },
    { ticker: 'PLD',  name: 'Prologis',                      market: 'US', initials: 'PL', logoColor: '#6B3A1A' },
    { ticker: 'EQIX', name: 'Equinix',                       market: 'US', initials: 'EQ', logoColor: '#1A8B3A' },
    { ticker: '4020', name: 'Emaar Economic City',           market: 'SA', initials: 'EM', logoColor: '#1A5C8B' },
  ],
  utilities: [
    { ticker: 'NEE',  name: 'NextEra Energy',                market: 'US', initials: 'NE', logoColor: '#1A6B6B' },
    { ticker: 'DUK',  name: 'Duke Energy',                   market: 'US', initials: 'DU', logoColor: '#6B1A6B' },
    { ticker: 'SO',   name: 'Southern Company',              market: 'US', initials: 'SO', logoColor: '#8B5A1A' },
    { ticker: '2082', name: 'ACWA Power',                    market: 'SA', initials: 'AC', logoColor: '#6B1A6B' },
  ],
};

export default function TradeScreen({ navigation }: TradeScreenProps) {
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const marketStatus = useMarketStatus('SA');

  if (selectedSector) {
    const stocks = (SECTOR_STOCKS[selectedSector.id] ?? []).filter(
      stock =>
        !search ||
        stock.name.toLowerCase().includes(search.toLowerCase()) ||
        stock.ticker.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.stocksHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedSector(null)}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>‹</Text>
            <Text style={styles.backLabel}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.sectorTitle}>{selectedSector.name}</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView contentContainerStyle={styles.stocksScroll} showsVerticalScrollIndicator={false}>
          {/* US Stocks */}
          {stocks.filter(stock => stock.market === 'US').length > 0 && (
            <>
              <Text style={styles.marketLabel}>🇺🇸 US Market</Text>
              <View style={styles.stockList}>
                {stocks.filter(stock => stock.market === 'US').map((stock, index, array) => (
                  <View key={stock.ticker}>
                    <TouchableOpacity
                      style={styles.stockRow}
                      onPress={() => navigation.navigate('AssetDetail', { ticker: stock.ticker })}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.logoCircle, { backgroundColor: stock.logoColor }]}>
                        <Text style={styles.logoInitials}>{stock.initials}</Text>
                      </View>
                      <View style={styles.stockInfo}>
                        <Text style={styles.stockName}>{stock.name}</Text>
                        <Text style={styles.stockTickerLabel}>{stock.ticker}</Text>
                      </View>
                      <Text style={styles.stockArrow}>›</Text>
                    </TouchableOpacity>
                    {index < array.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Saudi Stocks */}
          {stocks.filter(stock => stock.market === 'SA').length > 0 && (
            <>
              <Text style={[styles.marketLabel, { marginTop: 20 }]}>🇸🇦 Tadawul</Text>
              <View style={styles.stockList}>
                {stocks.filter(stock => stock.market === 'SA').map((stock, index, array) => (
                  <View key={stock.ticker}>
                    <TouchableOpacity
                      style={styles.stockRow}
                      onPress={() => navigation.navigate('AssetDetail', { ticker: stock.ticker })}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.logoCircle, { backgroundColor: stock.logoColor }]}>
                        <Text style={styles.logoInitials}>{stock.initials}</Text>
                      </View>
                      <View style={styles.stockInfo}>
                        <Text style={styles.stockName}>{stock.name}</Text>
                        <Text style={styles.stockTickerLabel}>{stock.ticker} · Tadawul</Text>
                      </View>
                      <Text style={styles.stockArrow}>›</Text>
                    </TouchableOpacity>
                    {index < array.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.sectorsScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Trade</Text>

        <View style={styles.marketPill}>
          <View style={[styles.marketDot, { backgroundColor: marketStatus.isOpen ? colors.green : colors.red }]} />
          <Text style={styles.marketPillText}>{marketStatus.label} · {marketStatus.statusText}</Text>
        </View>

        <View style={styles.searchWrapper}>
          <Search size={18} color={colors.gray500} strokeWidth={1.5} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stocks…"
            placeholderTextColor={colors.gray500}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Text style={styles.sectionLabel}>BROWSE BY SECTOR</Text>

        <View style={styles.sectorGrid}>
          {SECTORS.map(sector => (
            <TouchableOpacity
              key={sector.id}
              style={styles.sectorCard}
              onPress={() => setSelectedSector(sector)}
              activeOpacity={0.75}
            >
              <sector.Icon size={28} color={sector.color} strokeWidth={1.5} />
              <Text style={styles.sectorName}>{sector.name}</Text>
              <Text style={styles.sectorCount}>{sector.count} stocks</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const GLASS_BG = 'rgba(255,255,255,0.05)';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  sectorsScroll: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 32 },
  title: { color: colors.white, fontSize: 32, fontWeight: '700', marginBottom: 16 },
  marketPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)', paddingHorizontal: 12, paddingVertical: 6, gap: 7, marginBottom: 18 },
  marketDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  marketPillText: { color: colors.green, fontSize: 13, fontWeight: '500' },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', height: 52, backgroundColor: GLASS_BG, borderRadius: 14, borderWidth: 1, borderColor: GLASS_BORDER, paddingHorizontal: 16, gap: 10, marginBottom: 28 },
  searchInput: { flex: 1, color: colors.white, fontSize: 15 },
  sectionLabel: { color: colors.gray500, fontSize: 11, fontWeight: '600', letterSpacing: 0.8, marginBottom: 14 },
  sectorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sectorCard: { width: '47.5%', backgroundColor: GLASS_BG, borderRadius: 20, borderWidth: 1, borderColor: GLASS_BORDER, padding: 20, alignItems: 'center' },
  sectorName: { color: colors.white, fontSize: 16, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  sectorCount: { color: colors.gray500, fontSize: 12, marginTop: 2, textAlign: 'center' },
  stocksHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backArrow: { color: colors.accent, fontSize: 28, lineHeight: 32, marginTop: -2 },
  backLabel: { color: colors.accent, fontSize: 16, fontWeight: '500' },
  sectorTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  headerPlaceholder: { width: 56 },
  stocksScroll: { paddingHorizontal: 20, paddingBottom: 32 },
  marketLabel: { color: colors.gray400, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 10 },
  stockList: { backgroundColor: GLASS_BG, borderRadius: 18, borderWidth: 1, borderColor: GLASS_BORDER, overflow: 'hidden', marginBottom: 8 },
  stockRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  logoCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  logoInitials: { color: colors.white, fontSize: 14, fontWeight: '700' },
  stockInfo: { flex: 1 },
  stockName: { color: colors.white, fontSize: 15, fontWeight: '700', marginBottom: 3 },
  stockTickerLabel: { color: colors.gray500, fontSize: 11 },
  stockArrow: { color: colors.gray500, fontSize: 22 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 16 },
});