import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import {
  Sprout, TrendingUp, Briefcase, Trophy,
  TreePine, House, Wallet, Zap,
  CircleAlert, Frown, Search, ShoppingCart,
  Timer, ClipboardList, ChartBar, Shuffle,
} from 'lucide-react-native';
import { colors } from '../theme/colors';

const QUESTIONS = [
  'How would you describe your investing experience?',
  'What is your primary investment goal?',
  'How would you react if your portfolio dropped 15% in one month?',
  'What investment approach appeals to you most?',
];

const OPTIONS: { title: string; description: string }[][] = [
  [
    { title: 'Complete beginner', description: 'Just starting out, learning the basics' },
    { title: 'Some experience with stocks', description: 'Familiar with buying and selling stocks' },
    { title: 'Experienced investor', description: 'Comfortable with analysis and strategy' },
    { title: 'Professional trader', description: 'Full-time trading with advanced techniques' },
  ],
  [
    { title: 'Build wealth over 10+ years', description: 'Long-term growth with patience' },
    { title: 'Grow savings in 3-5 years', description: 'Medium-term goals like a home or education' },
    { title: 'Generate regular income', description: 'Dividends and consistent returns' },
    { title: 'Quick returns in 1-2 years', description: 'Short-term gains, higher risk tolerance' },
  ],
  [
    { title: 'Sell everything immediately', description: 'Preserving capital is the priority' },
    { title: 'Worry but hold steady', description: 'Stay the course despite the discomfort' },
    { title: 'See it as buying opportunity', description: 'Confident the market will recover' },
    { title: 'Buy more while prices are low', description: 'Aggressive strategy to maximize gains' },
  ],
  [
    { title: 'Buy and hold for long term', description: 'Minimal trading, steady compounding' },
    { title: 'Follow expert recommendations', description: 'Trust research and analyst insights' },
    { title: 'Active trading based on trends', description: 'Frequent trades to capture movements' },
    { title: 'Mix of different strategies', description: 'Diversified approach across methods' },
  ],
];

const OPTION_ICONS: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>[][] = [
  [Sprout, TrendingUp, Briefcase, Trophy],
  [TreePine, House, Wallet, Zap],
  [CircleAlert, Frown, Search, ShoppingCart],
  [Timer, ClipboardList, ChartBar, Shuffle],
];

const SELECTED_BORDER = '#00E8FF';
const OPTION_COLORS = ['#00E5CC', '#10B981', '#F59E0B', '#8B5CF6'];

interface QuizQuestionScreenProps {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

export default function QuizQuestionScreen({ navigation, route }: QuizQuestionScreenProps) {
  const { questionIndex, answers } = route.params as { questionIndex: number; answers: number[] };
  const [selected, setSelected] = useState<number | null>(answers[questionIndex] >= 0 ? answers[questionIndex] : null);
  const totalQuestions = QUESTIONS.length;

  useEffect(() => {
    setSelected(answers[questionIndex] >= 0 ? answers[questionIndex] : null);
  }, [questionIndex]);

  const questionNumber = questionIndex + 1;

  const handleNext = () => {
    if (selected === null) return;
    const newAnswers = [...answers];
    newAnswers[questionIndex] = selected;

    if (questionIndex < totalQuestions - 1) {
      navigation.navigate('QuizQuestion', { questionIndex: questionIndex + 1, answers: newAnswers });
    } else {
      // نمرر الإجابات الكاملة لشاشة النتيجة
      navigation.navigate('QuizResult', { answers: newAnswers });
    }
  };

  const handleBack = () => {
    if (questionIndex > 0) {
      navigation.navigate('QuizQuestion', { questionIndex: questionIndex - 1, answers: answers });
    } else {
      navigation.navigate('QuizIntro');
    }
  };

  const progressWidth = `${(questionNumber / totalQuestions) * 100}%`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.counter}>{questionNumber} of {totalQuestions}</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressWidth as any }]} />
        </View>

        <Text style={styles.question}>{QUESTIONS[questionIndex]}</Text>

        <ScrollView contentContainerStyle={styles.optionsContainer} showsVerticalScrollIndicator={false}>
          {OPTIONS[questionIndex].map((option, index) => {
            const optColor = OPTION_COLORS[index];
            const isSelected = selected === index;
            const OptionIcon = OPTION_ICONS[questionIndex][index];
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  isSelected && { backgroundColor: SELECTED_BORDER + '0D', borderColor: SELECTED_BORDER, borderWidth: 1.5 },
                ]}
                onPress={() => setSelected(index)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.optionIconBox,
                  { backgroundColor: optColor + '22' },
                  isSelected && { shadowColor: optColor, shadowRadius: 8, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
                ]}>
                  <OptionIcon size={20} color={optColor} strokeWidth={1.5} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={[styles.nextBtn, selected === null && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={selected === null}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextBtnText, selected === null && styles.nextBtnTextDisabled]}>
            {questionNumber === totalQuestions ? 'See my results' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: 32, paddingTop: 56, paddingBottom: 24 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  counter: { color: colors.gray500, fontSize: 15, fontWeight: '500' },
  progressTrack: { height: 8, backgroundColor: colors.gray800, borderRadius: 4, marginBottom: 32, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 4 },
  question: { color: colors.white, fontSize: 26, fontWeight: '700', lineHeight: 34, marginBottom: 24 },
  optionsContainer: { gap: 12, paddingBottom: 24, flexGrow: 1 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, backgroundColor: colors.bgSecondary, borderRadius: 16, borderWidth: 2, borderColor: colors.gray700 },
  optionIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optionContent: { flex: 1 },
  optionText: { color: colors.gray400, fontSize: 16 },
  optionTextSelected: { color: colors.white, fontWeight: '600' },
  optionDescription: { color: colors.gray600, fontSize: 12, marginTop: 2 },
  nextBtn: { height: 56, backgroundColor: colors.accent, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  nextBtnDisabled: { backgroundColor: colors.bgTertiary },
  nextBtnText: { color: colors.bg, fontSize: 16, fontWeight: '700' },
  nextBtnTextDisabled: { color: colors.gray600 },
});