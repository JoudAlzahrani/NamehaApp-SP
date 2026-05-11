import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShieldCheck, Scale, Rocket, Check } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface PreferencesScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

// ─── Risk level data ──────────────────────────────────────────────────────────

const RISK_OPTIONS = [
  { key: 'Low',    Icon: ShieldCheck, sub: 'Safer returns'  },
  { key: 'Medium', Icon: Scale,       sub: 'Balanced'       },
  { key: 'High',   Icon: Rocket,      sub: 'Higher risk'    },
] as const;

type RiskLevel = typeof RISK_OPTIONS[number]['key'];

const RISK_ADVICE: Record<RiskLevel, string> = {
  Low:    "Your Low risk profile prioritises capital protection over growth. You'll see steadier, smaller returns with reduced exposure to market volatility.",
  Medium: "Your current Medium profile balances growth opportunities with reasonable protection. You're comfortable with some market fluctuation in exchange for better long-term returns.",
  High:   "Your High risk profile opens the door to greater returns, but comes with significant exposure to market swings. Best suited for investors with a long time horizon and the ability to absorb potential losses.",
};

export default function PreferencesScreen({ navigation }: PreferencesScreenProps) {
  const [language,  setLanguage]  = useState<'en' | 'ar'>('en');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('Medium');

  const handleSave = () => {
    Alert.alert('Saved', 'Preferences saved successfully!', [
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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Preferences</Text>
        </View>
        <Text style={styles.subtitle}>Customize your NAMEHA experience</Text>

        {/* ── RISK LEVEL — first section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>◈</Text>
            <Text style={styles.sectionTitle}>Risk level</Text>
          </View>

          <Text style={styles.investLabel}>Your risk level</Text>
          <View style={styles.riskRow}>
            {RISK_OPTIONS.map(opt => {
              const active = riskLevel === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.riskCard, active && styles.riskCardActive]}
                  onPress={() => setRiskLevel(opt.key)}
                  activeOpacity={0.8}
                >
                  <opt.Icon size={22} color={active ? colors.white : colors.gray500} strokeWidth={1.5} />
                  <Text style={[styles.riskCardLabel, active && styles.riskCardLabelActive]}>
                    {opt.key}
                  </Text>
                  <Text style={styles.riskCardSub}>{opt.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.aiAdviceBox}>
            <Text style={styles.aiAdviceHeading}>AI ADVICE ON YOUR RISK LEVEL</Text>
            <Text style={styles.aiAdviceBody}>{RISK_ADVICE[riskLevel]}</Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('QuizIntro')}
            activeOpacity={0.7}
          >
            <Text style={styles.retakeQuiz}>Or retake the investor quiz</Text>
          </TouchableOpacity>
        </View>

        {/* Language */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⊕</Text>
            <Text style={styles.sectionTitle}>Language</Text>
          </View>
          <TouchableOpacity
            style={[styles.optionCard, language === 'en' && styles.optionCardActive]}
            onPress={() => setLanguage('en')}
            activeOpacity={0.8}
          >
            <Text style={[styles.optionText, language === 'en' && styles.optionTextActive]}>English</Text>
            {language === 'en' && (
              <View style={styles.checkCircle}>
                <Check size={14} color={colors.accent} strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionCard, language === 'ar' && styles.optionCardActive]}
            onPress={() => setLanguage('ar')}
            activeOpacity={0.8}
          >
            <Text style={[styles.optionText, language === 'ar' && styles.optionTextActive]}>العربية</Text>
            {language === 'ar' && (
              <View style={styles.checkCircle}>
                <Check size={14} color={colors.accent} strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Display currency */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⇌</Text>
            <Text style={styles.sectionTitle}>Display currency</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Saudi Riyal (SAR)</Text>
            <Text style={styles.infoSub}>Default</Text>
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>◉</Text>
            <Text style={styles.sectionTitle}>Security</Text>
          </View>
          <TouchableOpacity style={styles.securityCard} activeOpacity={0.7}>
            <View>
              <Text style={styles.securityName}>Biometric login</Text>
              <Text style={styles.securitySub}>Use fingerprint or Face ID</Text>
            </View>
            <Text style={styles.enabledText}>Enabled</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.securityCard} activeOpacity={0.7}>
            <View>
              <Text style={styles.securityName}>Change password</Text>
              <Text style={styles.securitySub}>Update your login password</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Safety limits — navigates to dedicated screen */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.safetyNavRow}
            onPress={() => navigation.navigate('SafetyLimits')}
            activeOpacity={0.8}
          >
            <View style={styles.safetyNavLeft}>
              <Text style={styles.sectionIcon}>◆</Text>
              <Text style={styles.safetyNavLabel}>Safety limits</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
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
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 18,
    color: colors.accent,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    marginBottom: 10,
  },
  optionCardActive: {
    backgroundColor: colors.accent,
  },
  optionText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  optionTextActive: {
    color: colors.bg,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    padding: 20,
  },
  infoLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  infoSub: {
    color: colors.gray500,
    fontSize: 14,
  },
  securityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    padding: 20,
    marginBottom: 10,
  },
  securityName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  securitySub: {
    color: colors.gray500,
    fontSize: 13,
  },
  enabledText: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '700',
  },
  chevron: {
    color: colors.gray500,
    fontSize: 22,
  },
  // ── Investing / Risk level ──
  investLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  riskRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  riskCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  riskCardActive: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}12`,
  },
  riskIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  riskCardLabel: {
    color: colors.gray400,
    fontSize: 13,
    fontWeight: '700',
  },
  riskCardLabelActive: {
    color: colors.white,
  },
  riskCardSub: {
    color: colors.gray500,
    fontSize: 11,
  },
  aiAdviceBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    borderRadius: 12,
    padding: 13,
    marginBottom: 14,
  },
  aiAdviceHeading: {
    color: colors.gray500,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 7,
  },
  aiAdviceBody: {
    color: colors.gray400,
    fontSize: 13,
    lineHeight: 20.8,
  },
  retakeQuiz: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },

  // ── Safety limits nav row ──
  safetyNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    padding: 20,
  },
  safetyNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  safetyNavLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
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
