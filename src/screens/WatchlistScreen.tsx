import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';

function BookmarkIcon({ size = 28, color = '#00E5CC' }: { size?: number; color?: string }) {
  const W = Math.round(size * 0.72);
  const totalH = size;
  const rectH = Math.round(totalH * 0.70);
  const notchH = totalH - rectH;
  const stroke = 2.5;
  const half = W / 2;
  const diagLen = Math.sqrt(half * half + notchH * notchH);
  const diagAngle = Math.atan2(notchH, half) * (180 / Math.PI);
  const lMx = half / 2;
  const lMy = rectH + notchH / 2;
  const rMx = W - half / 2;
  const rMy = lMy;
  return (
    <View style={{ width: W, height: totalH, overflow: 'visible' }}>
      <View style={{ position: 'absolute', left: 0, top: 0, width: stroke, height: rectH, backgroundColor: color, borderTopLeftRadius: 3 }} />
      <View style={{ position: 'absolute', right: 0, top: 0, width: stroke, height: rectH, backgroundColor: color, borderTopRightRadius: 3 }} />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: stroke, borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: color }} />
      <View style={{ position: 'absolute', left: lMx - diagLen / 2, top: lMy - stroke / 2, width: diagLen, height: stroke, backgroundColor: color, borderRadius: stroke / 2, transform: [{ rotate: `${diagAngle}deg` }] }} />
      <View style={{ position: 'absolute', left: rMx - diagLen / 2, top: rMy - stroke / 2, width: diagLen, height: stroke, backgroundColor: color, borderRadius: stroke / 2, transform: [{ rotate: `${-diagAngle}deg` }] }} />
    </View>
  );
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';

interface WatchlistScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

const STOCKS = [
  { ticker: '2222', name: 'Aramco', price: '28.50', change: '+1.2%', positive: true },
  { ticker: '1180', name: 'SABIC', price: '82.40', change: '+2.8%', positive: true },
  { ticker: '7010', name: 'STC', price: '42.15', change: '-0.5%', positive: false },
  { ticker: '4280', name: 'Al Rajhi Bank', price: '95.30', change: '+1.7%', positive: true },
];

export default function WatchlistScreen({ navigation }: WatchlistScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Watchlist</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddToWatchlist')}
            activeOpacity={0.85}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {STOCKS.length > 0 ? (
          <View style={styles.stockList}>
            {STOCKS.map((stock, i) => (
              <View key={stock.ticker}>
                <View style={styles.stockRow}>
                  <TouchableOpacity
                    style={styles.stockInfo}
                    onPress={() => navigation.navigate('AssetDetail', { ticker: stock.ticker })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stockTicker}>{stock.ticker}</Text>
                    <Text style={styles.stockName}>{stock.name}</Text>
                  </TouchableOpacity>
                  <View style={styles.stockRight}>
                    <Text style={styles.stockPrice}>{stock.price} SAR</Text>
                    <View style={styles.changeRow}>
                      <Text style={styles.trendIcon}>{stock.positive ? '↑' : '↓'}</Text>
                      <Text style={[styles.stockChange, { color: stock.positive ? colors.green : colors.red }]}>
                        {stock.change}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.removeBtn} activeOpacity={0.7}>
                    <X size={14} color={colors.gray400} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
                {i < STOCKS.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIllustration}>
              <BookmarkIcon size={34} color="#00E5CC" />
            </View>
            <Text style={styles.emptyTitle}>Nothing to watch yet</Text>
            <Text style={styles.emptyText}>
              Add stocks you want to track and we'll keep an eye on them for you.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('AddToWatchlist')}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyBtnText}>Add your first stock</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '700',
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: colors.bg,
    fontSize: 26,
    fontWeight: '400',
    lineHeight: 28,
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
    paddingVertical: 20,
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
    marginRight: 12,
  },
  stockPrice: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendIcon: {
    fontSize: 13,
    color: colors.gray500,
  },
  stockChange: {
    fontSize: 13,
    fontWeight: '600',
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: colors.gray400,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray800,
    marginHorizontal: 20,
  },
  emptyCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 20,
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emptyIllustration: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.accent}18`,
    borderWidth: 1,
    borderColor: `${colors.accent}30`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyText: {
    color: colors.gray500,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  emptyBtn: {
    height: 56,
    paddingHorizontal: 32,
    backgroundColor: colors.accent,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
});
