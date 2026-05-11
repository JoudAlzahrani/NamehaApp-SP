import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { API } from '../services/api';
import { useAuth } from '../context/AppContext';

interface PaymentScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export default function PaymentScreen({ navigation }: PaymentScreenProps) {
  const { userId } = useAuth();
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'bank' | null>(null);
  const [loading, setLoading] = useState(false);

  const isValid = !!amount && !!selectedMethod && parseFloat(amount) >= 100;

  const handleContinue = async () => {
    if (!isValid || !userId) return;
    setLoading(true);
    try {
      await API.fundPortfolio(userId, parseFloat(amount));
    } catch {}
    setLoading(false);
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Fund your account</Text>
        <Text style={styles.subtitle}>
          Add funds to start investing in the Saudi stock market
        </Text>

        {/* Amount Input */}
        <Text style={styles.label}>Amount to deposit</Text>
        <View style={styles.amountInputWrapper}>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor={colors.gray600}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <Text style={styles.currencyLabel}>SAR</Text>
        </View>

        {/* Quick Amounts */}
        <View style={styles.quickAmounts}>
          {QUICK_AMOUNTS.map(q => (
            <TouchableOpacity
              key={q}
              style={styles.quickBtn}
              onPress={() => setAmount(String(q))}
              activeOpacity={0.7}
            >
              <Text style={styles.quickBtnText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Methods */}
        <Text style={styles.label}>Payment method</Text>
        <View style={styles.methodsGroup}>
          {/* Card */}
          <TouchableOpacity
            style={[styles.methodCard, selectedMethod === 'card' && styles.methodCardSelected]}
            onPress={() => setSelectedMethod('card')}
            activeOpacity={0.8}
          >
            <View style={styles.methodLeft}>
              <View style={[styles.methodIcon, selectedMethod === 'card' && styles.methodIconSelected]}>
                <Text style={styles.methodIconGlyph}>□</Text>
              </View>
              <View>
                <Text style={styles.methodName}>Credit/Debit Card</Text>
                <Text style={styles.methodSub}>Instant transfer</Text>
              </View>
            </View>
            <View style={[styles.radio, selectedMethod === 'card' && styles.radioSelected]}>
              {selectedMethod === 'card' && <View style={styles.radioCenter} />}
            </View>
          </TouchableOpacity>

          {/* Bank */}
          <TouchableOpacity
            style={[styles.methodCard, selectedMethod === 'bank' && styles.methodCardSelected]}
            onPress={() => setSelectedMethod('bank')}
            activeOpacity={0.8}
          >
            <View style={styles.methodLeft}>
              <View style={[styles.methodIcon, selectedMethod === 'bank' && styles.methodIconSelected]}>
                <Text style={styles.methodIconGlyph}>◆</Text>
              </View>
              <View>
                <Text style={styles.methodName}>Bank Transfer</Text>
                <Text style={styles.methodSub}>1-2 business days</Text>
              </View>
            </View>
            <View style={[styles.radio, selectedMethod === 'bank' && styles.radioSelected]}>
              {selectedMethod === 'bank' && <View style={styles.radioCenter} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Minimum deposit is 100 SAR. Funds are held in a secure SAMA-regulated account.
          </Text>
        </View>

        {/* Continue */}
        <TouchableOpacity
          style={[styles.continueBtn, (!isValid || loading) && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!isValid || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={colors.bg} />
            : <Text style={[styles.continueBtnText, !isValid && styles.continueBtnTextDisabled]}>Continue</Text>
          }
        </TouchableOpacity>
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
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 56,
    paddingBottom: 32,
  },
  backBtn: {
    marginBottom: 24,
  },
  backText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    color: colors.gray400,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  label: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray700,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  amountInput: {
    flex: 1,
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
  },
  currencyLabel: {
    color: colors.gray400,
    fontSize: 18,
    fontWeight: '600',
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  quickBtn: {
    flex: 1,
    height: 44,
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray700,
  },
  quickBtnText: {
    color: colors.gray300,
    fontSize: 14,
    fontWeight: '600',
  },
  methodsGroup: {
    gap: 12,
    marginBottom: 20,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.gray700,
  },
  methodCardSelected: {
    backgroundColor: `${colors.accent}1A`,
    borderColor: colors.accent,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIconSelected: {
    backgroundColor: colors.accent,
  },
  methodIconGlyph: {
    fontSize: 18,
    color: colors.gray400,
    fontWeight: '700',
  },
  methodName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  methodSub: {
    color: colors.gray500,
    fontSize: 13,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray700,
    borderWidth: 2,
    borderColor: colors.gray600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  radioCenter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.bg,
  },
  infoCard: {
    backgroundColor: `${colors.amber}1A`,
    borderWidth: 1,
    borderColor: `${colors.amber}33`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    color: colors.amber,
    fontSize: 13,
    lineHeight: 20,
  },
  continueBtn: {
    height: 56,
    backgroundColor: colors.accent,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: colors.bgTertiary,
  },
  continueBtnText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
  continueBtnTextDisabled: {
    color: colors.gray600,
  },
});
