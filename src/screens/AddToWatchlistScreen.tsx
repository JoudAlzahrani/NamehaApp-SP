import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check, Plus } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface AddToWatchlistScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

const STOCKS = [
  { ticker: '2222', name: 'Aramco', price: '28.50', change: '+1.2%', positive: true },
  { ticker: '1180', name: 'SABIC', price: '82.40', change: '+2.8%', positive: true },
  { ticker: '7010', name: 'STC', price: '42.15', change: '-0.5%', positive: false },
  { ticker: '4280', name: 'Al Rajhi Bank', price: '95.30', change: '+1.7%', positive: true },
  { ticker: '2030', name: 'ACWA Power', price: '135.60', change: '+3.4%', positive: true },
  { ticker: '1120', name: 'Al Rajhi', price: '88.20', change: '+0.9%', positive: true },
  { ticker: '2010', name: 'SABIC Agri-Nutrients', price: '156.40', change: '-0.3%', positive: false },
  { ticker: '2381', name: 'Maaden', price: '45.80', change: '+1.5%', positive: true },
];

export default function AddToWatchlistScreen({ navigation }: AddToWatchlistScreenProps) {
  const [search, setSearch] = useState('');
  const [added, setAdded] = useState<string[]>([]);

  const filtered = STOCKS.filter(
    s => s.ticker.includes(search) || s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleAdd = (ticker: string) => {
    setAdded(prev =>
      prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Add to Watchlist</Text>
        <Text style={styles.subtitle}>Search for stocks to track in your watchlist</Text>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>○</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ticker or name..."
            placeholderTextColor={colors.gray600}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {search !== '' && (
          <Text style={styles.resultCount}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
          </Text>
        )}

        {/* Stock List */}
        <ScrollView style={styles.listWrapper} showsVerticalScrollIndicator={false}>
          <View style={styles.stockList}>
            {filtered.map((stock, i) => (
              <View key={stock.ticker}>
                <View style={styles.stockRow}>
                  <View style={styles.stockInfo}>
                    <Text style={styles.stockTicker}>{stock.ticker}</Text>
                    <Text style={styles.stockName}>{stock.name}</Text>
                  </View>
                  <View style={styles.stockRight}>
                    <Text style={styles.stockPrice}>{stock.price} SAR</Text>
                    <Text style={[styles.stockChange, { color: stock.positive ? colors.green : colors.red }]}>
                      {stock.change}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.addBtn, added.includes(stock.ticker) && styles.addBtnActive]}
                    onPress={() => toggleAdd(stock.ticker)}
                    activeOpacity={0.7}
                  >
                    {added.includes(stock.ticker)
                      ? <Check size={16} color={colors.bg} strokeWidth={3} />
                      : <Plus size={16} color={colors.bg} strokeWidth={2.5} />
                    }
                  </TouchableOpacity>
                </View>
                {i < filtered.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Add Button */}
        {added.length > 0 && (
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmBtnText}>
              Add {added.length} stock{added.length !== 1 ? 's' : ''} to watchlist
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 56,
    paddingBottom: 0,
  },
  backText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  title: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.gray400,
    fontSize: 15,
    marginBottom: 24,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray700,
    paddingHorizontal: 18,
    gap: 10,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: 15,
  },
  resultCount: {
    color: colors.gray500,
    fontSize: 14,
    marginBottom: 12,
  },
  listWrapper: {
    flex: 1,
    marginBottom: 16,
  },
  stockList: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    overflow: 'hidden',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
  },
  stockInfo: {
    flex: 1,
  },
  stockTicker: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  stockName: {
    color: colors.gray500,
    fontSize: 13,
  },
  stockRight: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  stockPrice: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  stockChange: {
    fontSize: 13,
    fontWeight: '600',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnActive: {
    backgroundColor: colors.accent,
  },
  addBtnText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 22,
  },
  addBtnTextActive: {
    color: colors.bg,
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray800,
    marginHorizontal: 20,
  },
  confirmBtn: {
    height: 56,
    backgroundColor: colors.accent,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  confirmBtnText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
});
