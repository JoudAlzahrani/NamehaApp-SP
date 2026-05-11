import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Check } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface TradeSuccessScreenProps {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}


export default function TradeSuccessScreen({ navigation, route }: TradeSuccessScreenProps) {
  const { ticker = 'SABIC', shares = 10, total = 924 } = (route?.params || {}) as any;
  const orderId = `TXN${Date.now().toString().slice(-8)}`;

  const checkScale  = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(checkScale, {
      toValue: 1, tension: 55, friction: 5, useNativeDriver: true,
    }).start();
    Animated.timing(checkOpacity, {
      toValue: 1, duration: 300, useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <View style={styles.iconWrapper}>
          <Animated.View style={[
            styles.icon,
            { transform: [{ scale: checkScale }], opacity: checkOpacity },
          ]}>
            <Check size={52} color={colors.green} strokeWidth={2.5} />
          </Animated.View>
        </View>

        <Text style={styles.title}>Trade placed successfully!</Text>
        <Text style={styles.subtitle}>
          Your order has been executed. You can track it in your portfolio.
        </Text>

        {/* Trade Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Trade details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Asset</Text>
            <Text style={styles.detailValue}>{ticker}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Shares purchased</Text>
            <Text style={styles.detailValue}>{shares}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total amount</Text>
            <Text style={styles.detailValue}>{Number(total).toFixed(2)} SAR</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.orderId}>#{orderId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Your position is now visible in your portfolio. You can set safety alerts to track price movements.
          </Text>
        </View>
      </ScrollView>

      {/* Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            navigation.navigate('Main', { screen: 'Portfolio' });
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>View portfolio</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Main', { screen: 'Trade' })}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryBtnText}>Make another trade</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: 32,
    paddingTop: 64,
    paddingBottom: 24,
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    width: 112,
    height: 112,
    borderRadius: 20,
    backgroundColor: `${colors.green}1A`,
    borderWidth: 2,
    borderColor: `${colors.green}4D`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 52,
    color: colors.green,
    fontWeight: '700',
  },
  title: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: colors.gray400,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  detailsCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  detailsTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    color: colors.gray400,
    fontSize: 15,
  },
  detailValue: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray800,
    marginBottom: 16,
  },
  orderId: {
    color: colors.gray500,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  statusBadge: {
    backgroundColor: `${colors.green}1A`,
    borderWidth: 1,
    borderColor: `${colors.green}4D`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: `${colors.accent}1A`,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    color: colors.accent,
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 32,
    paddingTop: 16,
    gap: 12,
  },
  primaryBtn: {
    height: 56,
    backgroundColor: colors.accent,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 56,
    backgroundColor: colors.bgTertiary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
