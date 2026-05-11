import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';

interface QuizIntroScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

const TOPICS = [
  'Your experience with investing',
  'Investment goals and timeline',
  'Risk comfort level',
  'Preferred investment approach',
];

export default function QuizIntroScreen({ navigation }: QuizIntroScreenProps) {
  const handleStart = () => {
    navigation.navigate('QuizQuestion', { questionIndex: 0, answers: [-1, -1, -1, -1] });
  };

  const handleSkip = () => {
    navigation.navigate('Payment');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Skip */}
        <TouchableOpacity style={styles.skipRow} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>

        {/* Illustration */}
        <View style={styles.illustration}>
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarIcon}>◎</Text>
            </View>
            <View style={styles.skeletonLine} />
          </View>
          <View style={[styles.questionBadge, { backgroundColor: colors.accent, top: -8, left: 0 }]}>
            <Text style={styles.questionMark}>?</Text>
          </View>
          <View style={[styles.questionBadge, { backgroundColor: '#8B5CF6', top: -8, right: 0 }]}>
            <Text style={styles.questionMark}>?</Text>
          </View>
          <View style={[styles.questionBadge, { backgroundColor: colors.amber, bottom: -8, left: 24 }]}>
            <Text style={styles.questionMark}>?</Text>
          </View>
          <View style={[styles.questionBadge, { backgroundColor: '#EC4899', bottom: -8, right: 24 }]}>
            <Text style={styles.questionMark}>?</Text>
          </View>
        </View>

        <Text style={styles.title}>Let's build your profile</Text>
        <Text style={styles.subtitle}>
          Answer 4 quick questions so NAMEHA can personalize insights to match your investing style and comfort level.
        </Text>

        {/* Topics */}
        <View style={styles.topicsCard}>
          <Text style={styles.topicsTitle}>What we'll ask:</Text>
          {TOPICS.map((topic, index) => (
            <View key={index} style={styles.topicRow}>
              <View style={styles.topicNumber}>
                <Text style={styles.topicNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.topicText}>{topic}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Start Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>Let's get started</Text>
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
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 56,
    paddingBottom: 24,
  },
  skipRow: {
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  skipText: {
    color: colors.gray400,
    fontSize: 14,
    fontWeight: '600',
  },
  illustration: {
    alignSelf: 'center',
    width: 220,
    height: 160,
    marginBottom: 32,
    position: 'relative',
  },
  profileCard: {
    position: 'absolute',
    top: 20,
    left: '50%',
    marginLeft: -70,
    width: 140,
    height: 100,
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarIcon: {
    fontSize: 20,
    color: colors.white,
    fontWeight: '700',
  },
  skeletonLine: {
    height: 8,
    width: 80,
    backgroundColor: colors.gray700,
    borderRadius: 4,
  },
  questionBadge: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionMark: {
    color: colors.white,
    fontSize: 22,
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
    marginBottom: 28,
  },
  topicsCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 20,
  },
  topicsTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  topicNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topicNumberText: {
    color: colors.bg,
    fontSize: 13,
    fontWeight: '700',
  },
  topicText: {
    color: colors.gray400,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    paddingTop: 3,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  startBtn: {
    height: 56,
    backgroundColor: colors.accent,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
});
