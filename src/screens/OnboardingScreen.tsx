import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../theme/colors';

type OnboardingNavProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;


const GRAD = ['#852EC6', '#7F80D8', '#76E3EF'] as string[];
const GRAD_S = { x: 0, y: 0 };
const GRAD_E = { x: 1, y: 0 };

interface PageProps {
  onNext: () => void;
  onSkip: () => void;
  onBack?: () => void;
}

function FeaturePage1({ onNext, onSkip }: PageProps) {
  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <Image source={require('../imports/nameha_logo.png')} style={{width: 120, height: 45}} resizeMode="contain" />
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.graphic}>
        <View style={styles.analysisCard}>
          <View style={styles.analysisCardHeader}>
            <Text style={styles.analysisLabel}>SABIC Analysis</Text>
            <View style={styles.greenDot} />
          </View>
          <View style={[styles.skeletonLine, { width: 120 }]} />
          <View style={[styles.skeletonLine, { width: 90, marginTop: 6 }]} />
        </View>
        <View style={styles.checkBadge}>
          <Check size={24} color={colors.bg} strokeWidth={3} />
        </View>
        <View style={styles.confidenceCard}>
          <Text style={styles.confidenceLabel}>Confidence Level</Text>
          <View style={styles.miniBars}>
            {[85, 90, 78, 92, 88].map((h, i) => (
              <View key={i} style={[styles.miniBar, { height: h * 0.18 }]} />
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.pageHeading}>Decisions that make sense — every time</Text>
      <Text style={styles.pageBody}>
        Every suggestion comes with a plain-language explanation of exactly why it was made. You'll always understand before you act — no guessing, no confusion.
      </Text>

      <View style={styles.dotsContainer}>
        <LinearGradient colors={GRAD} start={GRAD_S} end={GRAD_E} style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.nextBtnText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

function FeaturePage2({ onNext, onSkip, onBack }: PageProps) {
  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <Image source={require('../imports/nameha_logo.png')} style={{width: 120, height: 45}} resizeMode="contain" />
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.graphic}>
        <View style={styles.tradeCard}>
          <View style={styles.tradeCardRow}>
            <View>
              <Text style={styles.tradeTicker}>Buy SABIC</Text>
              <Text style={styles.tradeDetail}>40 shares · 5,200 SAR</Text>
            </View>
            <View style={styles.blueBox}>
              <Text style={styles.plusIcon}>+</Text>
            </View>
          </View>
          <View style={styles.tradeProgress} />
        </View>
        <View style={styles.approvalRow}>
          <View style={[styles.approvalBtn, styles.declineBtn]}>
            <X size={28} color={colors.white} strokeWidth={2.5} />
            <Text style={styles.approvalLabel}>Decline</Text>
          </View>
          <View style={[styles.approvalBtn, styles.confirmBtn]}>
            <Check size={28} color={colors.white} strokeWidth={2.5} />
            <Text style={styles.approvalLabel}>Confirm</Text>
          </View>
        </View>
      </View>

      <Text style={styles.pageHeading}>You stay in control — always</Text>
      <Text style={styles.pageBody}>
        Nothing happens without your approval. Every trade — whether suggested or self-initiated — requires your explicit confirmation. NAMEHA guides, you decide.
      </Text>

      <View style={styles.dotsContainer}>
        <View style={styles.dot} />
        <LinearGradient colors={GRAD} start={GRAD_S} end={GRAD_E} style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.85}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.nextBtn, { flex: 1 }]} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FeaturePage3({ onNext, onSkip, onBack }: PageProps) {
  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <Image source={require('../imports/nameha_logo.png')} style={{width: 120, height: 45}} resizeMode="contain" />
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.graphic}>
        <View style={styles.protectionCard}>
          <View style={styles.protectionCardRow}>
            <View style={styles.protLimitCard}>
              <Text style={styles.protLimitLabel}>Max Loss</Text>
              <Text style={styles.protLimitValue}>500 SAR</Text>
              <View style={styles.protLimitBar}>
                <View style={[styles.protLimitBarFill, { width: '60%', backgroundColor: '#EF4444' }]} />
              </View>
            </View>
            <View style={styles.protCenterIcon}>
              <View style={styles.protShieldBody} />
              <View style={styles.protShieldPoint} />
            </View>
            <View style={styles.protLimitCard}>
              <Text style={styles.protLimitLabel}>Daily Limit</Text>
              <Text style={styles.protLimitValue}>2,000 SAR</Text>
              <View style={styles.protLimitBar}>
                <View style={[styles.protLimitBarFill, { width: '80%', backgroundColor: '#00E5CC' }]} />
              </View>
            </View>
          </View>
          <View style={styles.protectionCardFooter}>
            <View style={styles.protStatusDot} />
            <Text style={styles.protStatusText}>Protection active</Text>
          </View>
        </View>
      </View>

      <Text style={styles.pageHeading}>Your risk, your rules — your protection</Text>
      <Text style={styles.pageBody}>
        Set your own safety limits per stock. NAMEHA watches the market for you and alerts you the moment something reaches your threshold — before it's too late.
      </Text>

      <View style={styles.dotsContainer}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <LinearGradient colors={GRAD} start={GRAD_S} end={GRAD_E} style={[styles.dot, styles.dotActive]} />
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.85}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.nextBtn, { flex: 1 }]} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>Create my account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const navigation = useNavigation<OnboardingNavProp>();
  const [page, setPage] = useState(0);

  const goToRegister = useCallback(() => {
    navigation.navigate('Register');
  }, [navigation]);

  const handleNext = useCallback(() => {
    if (page < 2) {
      setPage(p => p + 1);
    } else {
      goToRegister();
    }
  }, [page, goToRegister]);

  const handleBack = useCallback(() => {
    setPage(p => Math.max(0, p - 1));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {page === 0 && <FeaturePage1 onNext={handleNext} onSkip={goToRegister} />}
      {page === 1 && <FeaturePage2 onNext={handleNext} onSkip={goToRegister} onBack={handleBack} />}
      {page === 2 && <FeaturePage3 onNext={handleNext} onSkip={goToRegister} onBack={handleBack} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  page: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 56,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
skipText: {
    color: colors.gray400,
    fontSize: 15,
    fontWeight: '500',
  },
  graphic: {
    alignItems: 'center',
    height: 180,
    marginBottom: 40,
    justifyContent: 'center',
  },
  analysisCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    width: '90%',
    marginBottom: 8,
  },
  analysisCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  analysisLabel: {
    color: colors.gray400,
    fontSize: 11,
    fontWeight: '500',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  skeletonLine: {
    height: 8,
    backgroundColor: colors.gray700,
    borderRadius: 4,
  },
  checkBadge: {
    position: 'absolute',
    right: 24,
    top: 40,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: colors.bg,
    fontSize: 24,
    fontWeight: '700',
  },
  confidenceCard: {
    position: 'absolute',
    bottom: 0,
    left: 48,
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    padding: 12,
    width: 160,
  },
  confidenceLabel: {
    color: colors.gray400,
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 8,
  },
  miniBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 30,
  },
  miniBar: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  tradeCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    width: '90%',
    marginBottom: 16,
  },
  tradeCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tradeTicker: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  tradeDetail: {
    color: colors.gray400,
    fontSize: 11,
  },
  blueBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  tradeProgress: {
    height: 4,
    backgroundColor: colors.green,
    borderRadius: 2,
    width: '40%',
  },
  approvalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  approvalBtn: {
    width: 96,
    height: 96,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  declineBtn: {
    backgroundColor: colors.red,
  },
  confirmBtn: {
    backgroundColor: colors.accent,
  },
  approvalIcon: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '700',
  },
  approvalLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  protectionCard: {
    width: '90%',
    backgroundColor: '#0D2B2B',
    borderWidth: 2,
    borderColor: '#00E5CC',
    borderRadius: 16,
    padding: 20,
  },
  protectionCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  protLimitCard: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    padding: 12,
  },
  protLimitLabel: {
    color: colors.gray400,
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
  },
  protLimitValue: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  protLimitBar: {
    height: 4,
    backgroundColor: colors.gray700,
    borderRadius: 2,
    overflow: 'hidden',
  },
  protLimitBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  protCenterIcon: {
    width: 48,
    height: 56,
    alignItems: 'center',
  },
  protShieldBody: {
    width: 32,
    height: 34,
    borderWidth: 2.5,
    borderColor: '#00E5CC',
    borderRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
  },
  protShieldPoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#00E5CC',
  },
  protectionCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#00E5CC30',
  },
  protStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E5CC',
  },
  protStatusText: {
    color: '#00E5CC',
    fontSize: 12,
    fontWeight: '600',
  },
  pageHeading: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 16,
  },
  pageBody: {
    color: colors.gray400,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    flex: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray600,
  },
  dotActive: {
    width: 28,
  },
  nextBtn: {
    height: 56,
    backgroundColor: colors.accent,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backBtn: {
    width: '35%',
    height: 56,
    backgroundColor: colors.bgTertiary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray700,
  },
  backBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
