import React, { lazy, Suspense } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ── تحميل فوري - شاشات البداية فقط ───────────────────────────────────────
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import SignInScreen from '../screens/SignInScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

// ── تحميل كسول - باقي الشاشات ─────────────────────────────────────────────
const OnboardingScreen        = lazy(() => import('../screens/OnboardingScreen'));
const QuizIntroScreen         = lazy(() => import('../screens/QuizIntroScreen'));
const QuizQuestionScreen      = lazy(() => import('../screens/QuizQuestionScreen'));
const QuizResultScreen        = lazy(() => import('../screens/QuizResultScreen'));
const PaymentScreen           = lazy(() => import('../screens/PaymentScreen'));
const MainTabNavigator        = lazy(() => import('./MainTabNavigator'));
const AIAnalysisScreen        = lazy(() => import('../screens/AIAnalysisScreen'));
const AllInsightsScreen       = lazy(() => import('../screens/AllInsightsScreen'));
const AssetDetailScreen       = lazy(() => import('../screens/AssetDetailScreen'));
const OrderEntryScreen        = lazy(() => import('../screens/OrderEntryScreen'));
const TradeSuccessScreen      = lazy(() => import('../screens/TradeSuccessScreen'));
const PerformanceHistoryScreen= lazy(() => import('../screens/PerformanceHistoryScreen'));
const TradeHistoryScreen      = lazy(() => import('../screens/TradeHistoryScreen'));
const AddToWatchlistScreen    = lazy(() => import('../screens/AddToWatchlistScreen'));
const PreferencesScreen       = lazy(() => import('../screens/PreferencesScreen'));
const NotificationsScreen     = lazy(() => import('../screens/NotificationsScreen'));
const SafetyLimitsScreen      = lazy(() => import('../screens/SafetyLimitsScreen'));
const HelpSupportScreen       = lazy(() => import('../screens/HelpSupportScreen'));
const TermsPrivacyScreen      = lazy(() => import('../screens/TermsPrivacyScreen'));
const InvestmentDetailScreen  = lazy(() => import('../screens/InvestmentDetailScreen'));
const PortfolioAnalysisScreen = lazy(() => import('../screens/PortfolioAnalysisScreen'));

// ── Loading Fallback ───────────────────────────────────────────────────────
const ScreenLoader = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0B0F' }}>
    <ActivityIndicator size="large" color="#6C63FF" />
  </View>
);

// ── Wrapper عشان كل شاشة كسولة تنحاط بـ Suspense ─────────────────────────
const withSuspense = (Component: React.LazyExoticComponent<any>) =>
  (props: any) => (
    <Suspense fallback={<ScreenLoader />}>
      <Component {...props} />
    </Suspense>
  );

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Onboarding: undefined;
  Register: undefined;
  SignIn: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  QuizIntro: undefined;
  QuizQuestion: { questionIndex: number; answers: number[] };
  QuizResult: { answers: number[] };
  Payment: undefined;
  Main: undefined;
  AIAnalysis: { ticker?: string };
  AllInsights: undefined;
  AssetDetail: { ticker: string };
  OrderEntry: { ticker: string };
  TradeSuccess: { ticker: string; shares: number; total: number };
  PerformanceHistory: undefined;
  TradeHistory: undefined;
  AddToWatchlist: undefined;
  Preferences: undefined;
  Notifications: undefined;
  SafetyLimits: undefined;
  HelpSupport: undefined;
  TermsPrivacy: undefined;
  InvestmentDetail: { investmentId: number };
  PortfolioAnalysis: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        // تحسين الأداء
        freezeOnBlur: true,        // يوقف الشاشات غير النشطة
        animationDuration: 250,    // تقليل مدة الأنيميشن
      }}
    >
      {/* ── تحميل فوري ── */}
      <Stack.Screen name="Splash"          component={SplashScreen}          options={{ animation: 'none' }} />
      <Stack.Screen name="Welcome"         component={WelcomeScreen} />
      <Stack.Screen name="SignIn"          component={SignInScreen} />
      <Stack.Screen name="Register"        component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword"  component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword"   component={ResetPasswordScreen} />

      {/* ── تحميل كسول ── */}
      <Stack.Screen name="Onboarding"          component={withSuspense(OnboardingScreen)} />
      <Stack.Screen name="QuizIntro"           component={withSuspense(QuizIntroScreen)} />
      <Stack.Screen name="QuizQuestion"        component={withSuspense(QuizQuestionScreen)} />
      <Stack.Screen name="QuizResult"          component={withSuspense(QuizResultScreen)} />
      <Stack.Screen name="Payment"             component={withSuspense(PaymentScreen)} />
      <Stack.Screen name="Main"                component={withSuspense(MainTabNavigator)} />
      <Stack.Screen name="AIAnalysis"          component={withSuspense(AIAnalysisScreen)} />
      <Stack.Screen name="AllInsights"         component={withSuspense(AllInsightsScreen)} />
      <Stack.Screen name="AssetDetail"         component={withSuspense(AssetDetailScreen)} />
      <Stack.Screen name="OrderEntry"          component={withSuspense(OrderEntryScreen)} />
      <Stack.Screen name="TradeSuccess"        component={withSuspense(TradeSuccessScreen)} options={{ animation: 'fade' }} />
      <Stack.Screen name="PerformanceHistory"  component={withSuspense(PerformanceHistoryScreen)} />
      <Stack.Screen name="TradeHistory"        component={withSuspense(TradeHistoryScreen)} />
      <Stack.Screen name="AddToWatchlist"      component={withSuspense(AddToWatchlistScreen)} />
      <Stack.Screen name="Preferences"         component={withSuspense(PreferencesScreen)} />
      <Stack.Screen name="Notifications"       component={withSuspense(NotificationsScreen)} />
      <Stack.Screen name="SafetyLimits"        component={withSuspense(SafetyLimitsScreen)} />
      <Stack.Screen name="HelpSupport"         component={withSuspense(HelpSupportScreen)} />
      <Stack.Screen name="TermsPrivacy"        component={withSuspense(TermsPrivacyScreen)} />
      <Stack.Screen name="InvestmentDetail"    component={withSuspense(InvestmentDetailScreen)} />
      <Stack.Screen name="PortfolioAnalysis"   component={withSuspense(PortfolioAnalysisScreen)} />
    </Stack.Navigator>
  );
}