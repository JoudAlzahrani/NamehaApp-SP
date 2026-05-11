import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AppContext';

interface WelcomeScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

const BAR_HEIGHTS = [45, 60, 38, 72, 55, 68, 82, 70];

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { logout } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const barAnims = useRef(BAR_HEIGHTS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    logout();
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.stagger(
        50,
        barAnims.map(anim =>
          Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ),
      ),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Illustration Card */}
        <Animated.View style={[styles.illustrationArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.portfolioCard}>
            <View style={styles.portfolioCardTop}>
              <View>
                <Text style={styles.portfolioLabel}>Portfolio Value</Text>
                <Text style={styles.portfolioValue}>12,450 SAR</Text>
              </View>
              <View style={styles.gainBadge}>
                <Text style={styles.gainText}>+12%</Text>
              </View>
            </View>
            {/* Mini bars */}
            <View style={styles.barsContainer}>
              {BAR_HEIGHTS.map((height, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.bar,
                    { height: (height / 100) * 56 },
                    { transform: [{ scaleY: barAnims[i] }] },
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Active</Text>
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statSub}>Stocks</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Insights</Text>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statSub}>AI Signals</Text>
            </View>
          </View>
        </Animated.View>

        {/* Heading */}
        <Animated.Text style={[styles.heading, { opacity: fadeAnim }]}>
          Professional Stock Analysis & Market Insights
        </Animated.Text>

        {/* Description */}
        <Animated.Text style={[styles.description, { opacity: fadeAnim }]}>
          Make smarter investment decisions with real-time data, advanced charting, and personalized portfolio tracking.
        </Animated.Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Onboarding')} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Get Started  →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('SignIn')} activeOpacity={0.85}>
          <Text style={styles.secondaryBtnText}>Already have an account? Sign In</Text>
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
  logoArea: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationArea: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  portfolioCard: {
    width: 290,
    backgroundColor: colors.bgSecondary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  portfolioCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  portfolioLabel: {
    color: colors.gray400,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  portfolioValue: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
  },
  gainBadge: {
    backgroundColor: `${colors.green}1A`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  gainText: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '700',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 56,
    gap: 5,
  },
  bar: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  statCard: {
    width: 124,
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    padding: 14,
  },
  statLabel: {
    color: colors.gray400,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statSub: {
    color: colors.gray500,
    fontSize: 11,
  },
  heading: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 12,
    maxWidth: 280,
  },
  description: {
    color: colors.gray400,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 280,
  },
  buttons: {
    paddingHorizontal: 32,
    paddingBottom: 24,
    gap: 8,
  },
  primaryBtn: {
    height: 52,
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
    height: 52,
    backgroundColor: colors.bgTertiary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray700,
  },
  secondaryBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
