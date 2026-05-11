import React, { lazy, Suspense } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LinearGradient from 'react-native-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { colors } from '../theme/colors';

// ── Lazy load الشاشات — تتحمل عند أول ضغط فقط ────────────────────────────
const DashboardScreen   = lazy(() => import('../screens/DashboardScreen'));
const TradeScreen       = lazy(() => import('../screens/TradeScreen'));
const AIInvestingScreen = lazy(() => import('../screens/AIInvestingScreen'));
const PortfolioScreen   = lazy(() => import('../screens/PortfolioScreen'));
const ProfileScreen     = lazy(() => import('../screens/ProfileScreen'));

export type MainTabParamList = {
  Dashboard:   undefined;
  Trade:       undefined;
  AIInvesting: undefined;
  Portfolio:   undefined;
  Profile:     undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// ── Loading placeholder ────────────────────────────────────────────────────
const ScreenLoader = () => (
  <View style={styles.loader}>
    <ActivityIndicator size="large" color={colors.accent} />
  </View>
);

// ── Suspense wrapper ───────────────────────────────────────────────────────
const withSuspense = (Component: React.LazyExoticComponent<any>) =>
  (props: any) => (
    <Suspense fallback={<ScreenLoader />}>
      <Component {...props} />
    </Suspense>
  );

// ── Memoized components — منع إعادة الرسم عند التنقل ─────────────────────
const DashboardLazy   = withSuspense(DashboardScreen);
const TradeLazy       = withSuspense(TradeScreen);
const AIInvestingLazy = withSuspense(AIInvestingScreen);
const PortfolioLazy   = withSuspense(PortfolioScreen);
const ProfileLazy     = withSuspense(ProfileScreen);

// ── Tab Icons ──────────────────────────────────────────────────────────────
const TAB_ICONS: Record<string, string> = {
  Dashboard: '⌂',
  Trade:     '⇅',
  Portfolio: '◉',
  Profile:   '○',
};

const TabIcon = React.memo(({ name, focused }: { name: string; focused: boolean }) => (
  <View style={styles.iconWrap}>
    <Text style={[
      styles.icon,
      focused && styles.iconActive,
      focused && { transform: [{ scale: 1.15 }] },
    ]}>
      {TAB_ICONS[name]}
    </Text>
    {focused && <View style={styles.glowDot} />}
  </View>
));

const AITabButton = React.memo(({ onPress }: { onPress?: (e?: any) => void }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    style={styles.aiButtonContainer}
  >
    <View style={styles.aiButtonRing}>
      <LinearGradient
        colors={['#852EC6', '#7F80D8', '#76E3EF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.aiButtonGradient}
      >
        <Sparkles size={22} color={colors.white} strokeWidth={1.5} />
      </LinearGradient>
    </View>
  </TouchableOpacity>
));

// ── screenOptions خارج الـ component — منع إعادة إنشاءها ─────────────────
const screenOptions = ({ route }: any) => ({
  headerShown: false,
  tabBarStyle: styles.tabBar,
  tabBarShowLabel: true,
  tabBarLabelStyle: styles.tabLabel,
  tabBarActiveTintColor: colors.accent,
  tabBarInactiveTintColor: colors.gray600,
  tabBarIcon: ({ focused }: { focused: boolean }) => (
    <TabIcon name={route.name} focused={focused} />
  ),
  // يوقف الشاشة عند مغادرتها بدل ما تشتغل في الخلفية
  lazy: true,
  freezeOnBlur: true,
});

export default function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardLazy}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Trade"
        component={TradeLazy}
        options={{ tabBarLabel: 'Trade' }}
      />
      <Tab.Screen
        name="AIInvesting"
        component={AIInvestingLazy}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <AITabButton onPress={props.onPress as any} />
          ),
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioLazy}
        options={{ tabBarLabel: 'Portfolio' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileLazy}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

const AI_BUTTON_SIZE  = 64;
const AI_FLOAT_OFFSET = 20;

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0B0F',
  },
  tabBar: {
    backgroundColor: colors.bgSecondary,
    borderTopColor: '#1E1F27',
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 12,
    paddingTop: 8,
    overflow: 'visible',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    color: colors.gray600,
  },
  iconActive: {
    color: colors.accent,
  },
  glowDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: 3,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  aiButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -AI_FLOAT_OFFSET }],
  },
  aiButtonRing: {
    width: AI_BUTTON_SIZE + 4,
    height: AI_BUTTON_SIZE + 4,
    borderRadius: (AI_BUTTON_SIZE + 4) / 2,
    backgroundColor: colors.bgSecondary,
    borderWidth: 2,
    borderColor: '#FFFFFF22',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#852EC6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  aiButtonGradient: {
    width: AI_BUTTON_SIZE,
    height: AI_BUTTON_SIZE,
    borderRadius: AI_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});