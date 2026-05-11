import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Check, Star } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface QuizResultScreenProps {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

// ── حساب المستوى من الإجابات ──────────────────────────────────────────────────
// كل سؤال له 4 خيارات (0-3)
// الخيار 0 = أقل مخاطرة، الخيار 3 = أعلى مخاطرة
// المجموع: 0-3 = Conservative, 4-7 = Moderate, 8-12 = Aggressive

interface Profile {
  name: string;
  risk: 'low' | 'medium' | 'high';
  description: string;
  traits: string[];
  color: string;
  accentColor: string;
}

function calculateProfile(answers: number[]): Profile {
  const score = answers.reduce((sum, a) => sum + (a >= 0 ? a : 0), 0);

  if (score <= 3) {
    return {
      name: 'Conservative Investor',
      risk: 'low',
      description: 'You prioritize capital preservation over high returns. You prefer stable, lower-risk investments and are more comfortable with steady, predictable growth.',
      traits: ['Low risk tolerance', 'Long-term stability focus', 'Prefers bonds and blue-chip stocks', 'Minimal trading activity'],
      color: colors.green,
      accentColor: '#10B981',
    };
  } else if (score <= 7) {
    return {
      name: 'Moderate Investor',
      risk: 'medium',
      description: 'You balance growth opportunities with risk management. You are comfortable with some market volatility but prefer a measured approach.',
      traits: ['Medium-term investment horizon', 'Balanced risk tolerance', 'Growth with stability focus', 'Mix of stocks and bonds'],
      color: colors.amber,
      accentColor: '#F59E0B',
    };
  } else {
    return {
      name: 'Aggressive Investor',
      risk: 'high',
      description: 'You seek maximum growth and are comfortable with significant market volatility. You take calculated risks for potentially higher rewards.',
      traits: ['High risk tolerance', 'Short to medium-term focus', 'Prefers growth stocks', 'Active trading approach'],
      color: colors.red,
      accentColor: '#EF4444',
    };
  }
}

export default function QuizResultScreen({ navigation, route }: QuizResultScreenProps) {
  const answers = (route?.params?.answers as number[]) ?? [1, 1, 1, 1];

  const profile = useMemo(() => calculateProfile(answers), [answers]);

  const handleContinue = () => {
    navigation.navigate('Payment');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Visualization */}
        <View style={styles.visualization}>
          <View style={[styles.successBadge, { backgroundColor: profile.accentColor }]}>
            <Check size={48} color={colors.white} strokeWidth={2.5} />
          </View>
          <View style={[styles.orbitIcon, { top: 0, left: '50%', marginLeft: -24 }]}>
            <Text style={styles.orbitEmoji}>◆</Text>
          </View>
          <View style={[styles.orbitIcon, { bottom: 0, left: 0 }]}>
            <Star size={18} color={colors.accent} strokeWidth={1.5} />
          </View>
          <View style={[styles.orbitIcon, { bottom: 0, right: 0 }]}>
            <Text style={styles.orbitEmoji}>⊕</Text>
          </View>
        </View>

        <Text style={styles.title}>Your profile is ready!</Text>
        <Text style={styles.subtitle}>
          Based on your answers, we've identified your investing profile as:
        </Text>

        {/* Profile Card */}
        <View style={[styles.profileCard, { borderTopColor: profile.accentColor, borderTopWidth: 3 }]}>
          <View style={styles.profileNameRow}>
            <Text style={[styles.profileName, { color: profile.accentColor }]}>{profile.name}</Text>
            <View style={[styles.riskBadge, { backgroundColor: `${profile.accentColor}20` }]}>
              <Text style={[styles.riskBadgeText, { color: profile.accentColor }]}>
                {profile.risk === 'low' ? 'Low Risk' : profile.risk === 'medium' ? 'Medium Risk' : 'High Risk'}
              </Text>
            </View>
          </View>
          <Text style={styles.profileDescription}>{profile.description}</Text>
          {profile.traits.map((trait, i) => (
            <View key={i} style={styles.traitRow}>
              <View style={[styles.traitDot, { backgroundColor: profile.accentColor }]} />
              <Text style={styles.traitText}>{trait}</Text>
            </View>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            NAMEHA will now personalize insights and suggestions to match your profile. You can update this anytime in Settings.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.continueBtn, { backgroundColor: profile.accentColor }]} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.continueBtnText}>Continue to dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 32, paddingTop: 64, paddingBottom: 24 },
  visualization: { alignSelf: 'center', width: 180, height: 140, marginBottom: 32, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  successBadge: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  orbitIcon: { position: 'absolute', width: 48, height: 48, borderRadius: 12, backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  orbitEmoji: { fontSize: 18, color: colors.accent, fontWeight: '700' },
  title: { color: colors.white, fontSize: 30, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  subtitle: { color: colors.gray400, fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  profileCard: { backgroundColor: colors.bgSecondary, borderRadius: 16, padding: 24, marginBottom: 16 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  profileName: { fontSize: 20, fontWeight: '700' },
  riskBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  riskBadgeText: { fontSize: 12, fontWeight: '700' },
  profileDescription: { color: colors.gray400, fontSize: 14, lineHeight: 22, marginBottom: 20 },
  traitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  traitDot: { width: 8, height: 8, borderRadius: 4 },
  traitText: { color: colors.gray300, fontSize: 14 },
  infoCard: { backgroundColor: `${colors.accent}1A`, borderWidth: 1, borderColor: `${colors.accent}33`, borderRadius: 12, padding: 16 },
  infoText: { color: colors.accent, fontSize: 14, lineHeight: 22 },
  footer: { paddingHorizontal: 32, paddingBottom: 24 },
  continueBtn: { height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  continueBtnText: { color: colors.bg, fontSize: 16, fontWeight: '700' },
});