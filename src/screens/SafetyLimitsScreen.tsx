import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AppContext';

interface SafetyLimitsScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

export default function SafetyLimitsScreen({ navigation }: SafetyLimitsScreenProps) {
  const { userId } = useAuth();
  const [maxLoss, setMaxLoss] = useState('500');
  const [dailyLimit, setDailyLimit] = useState('2000');
  const [stopLossEnabled, setStopLossEnabled] = useState(true);

  const storageKey = `safety_limits_${userId ?? 'default'}`;

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then(raw => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (saved.maxLoss)       setMaxLoss(saved.maxLoss);
        if (saved.dailyLimit)    setDailyLimit(saved.dailyLimit);
        if (saved.stopLossEnabled !== undefined) setStopLossEnabled(saved.stopLossEnabled);
      } catch {}
    });
  }, [storageKey]);

  const handleSave = async () => {
    await AsyncStorage.setItem(storageKey, JSON.stringify({ maxLoss, dailyLimit, stopLossEnabled }));
    Alert.alert('Saved', 'Safety limits saved successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Safety Limits</Text>
        </View>
        <Text style={styles.subtitle}>Set automatic limits to protect your investments</Text>

        {/* Max Loss Per Trade */}
        <View style={styles.field}>
          <View style={styles.fieldLabel}>
            <Text style={styles.fieldIcon}>↓</Text>
            <Text style={styles.fieldTitle}>Max loss per trade</Text>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={maxLoss}
              onChangeText={setMaxLoss}
              keyboardType="numeric"
              placeholder="500"
              placeholderTextColor={colors.gray600}
            />
            <Text style={styles.currency}>SAR</Text>
          </View>
          <Text style={styles.fieldHint}>
            NAMEHA will alert you if a single trade could lose more than this amount
          </Text>
        </View>

        {/* Daily Spending Limit */}
        <View style={styles.field}>
          <View style={styles.fieldLabel}>
            <Text style={styles.fieldIcon}>$</Text>
            <Text style={styles.fieldTitle}>Daily spending limit</Text>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={dailyLimit}
              onChangeText={setDailyLimit}
              keyboardType="numeric"
              placeholder="2000"
              placeholderTextColor={colors.gray600}
            />
            <Text style={styles.currency}>SAR</Text>
          </View>
          <Text style={styles.fieldHint}>
            Maximum amount you can spend on trades in a single day
          </Text>
        </View>

        {/* Auto Stop-Loss */}
        <View style={styles.stopLossCard}>
          <View style={styles.stopLossHeader}>
            <View style={styles.stopLossLeft}>
              <Text style={styles.stopLossIcon}>△</Text>
              <Text style={styles.stopLossTitle}>Auto stop-loss alerts</Text>
            </View>
            <Switch
              value={stopLossEnabled}
              onValueChange={setStopLossEnabled}
              trackColor={{ false: colors.bgTertiary, true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>
          <Text style={styles.stopLossDesc}>
            Get notified when a position drops below your maximum loss threshold
          </Text>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            These limits help prevent emotional decisions during market volatility. You can adjust them anytime.
          </Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save changes</Text>
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
  scroll: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  titleRow: {
    marginBottom: 8,
  },
  title: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.gray400,
    fontSize: 15,
    marginBottom: 32,
  },
  field: {
    marginBottom: 28,
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  fieldIcon: {
    color: colors.amber,
    fontSize: 18,
    fontWeight: '700',
  },
  fieldTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray700,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  currency: {
    color: colors.gray500,
    fontSize: 15,
    fontWeight: '500',
  },
  fieldHint: {
    color: colors.gray500,
    fontSize: 14,
    lineHeight: 20,
  },
  stopLossCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
  },
  stopLossHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stopLossLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopLossIcon: {
    color: colors.red,
    fontSize: 18,
  },
  stopLossTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  stopLossDesc: {
    color: colors.gray400,
    fontSize: 14,
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: `${colors.accent}1A`,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 28,
  },
  infoText: {
    color: colors.accent,
    fontSize: 14,
    lineHeight: 22,
  },
  saveBtn: {
    height: 56,
    backgroundColor: colors.accent,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
});
