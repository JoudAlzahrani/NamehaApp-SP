import React from 'react';
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
import { Settings2 } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AppContext';

interface ProfileScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

type MenuItem = {
  id: string;
  label: string;
  screen: string;
  icon?: string;
  Icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
};

const MENU_ITEMS: MenuItem[] = [
  { id: 'preferences',  Icon: Settings2, label: 'Preferences',   screen: 'Preferences'  },
  { id: 'notifications', icon: '△',      label: 'Notifications', screen: 'Notifications' },
  { id: 'safety',        icon: '◈',      label: 'Safety & Limits', screen: 'SafetyLimits' },
  { id: 'help',          icon: '?',      label: 'Help & Support', screen: 'HelpSupport'  },
  { id: 'terms',         icon: '≡',      label: 'Terms & Privacy', screen: 'TermsPrivacy' },
];

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, logout } = useAuth();

  const displayName = user?.name ?? 'User';
  const displayEmail = user?.email ?? '';
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          logout();
          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profile</Text>

        {/* Profile Hero */}
        <View style={styles.heroCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail}>{displayEmail}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Member since</Text>
              <Text style={styles.statValue}>Jan 2026</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Risk profile</Text>
              <Text style={styles.statValue}>Moderate</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menu}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconBg}>
                  {item.Icon
                    ? <item.Icon size={16} color={colors.accent} strokeWidth={1.75} />
                    : <Text style={styles.menuIcon}>{item.icon}</Text>
                  }
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutIcon}>←</Text>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>NAMEHA v1.0.0</Text>
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
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
  },
  title: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 28,
  },
  heroCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.bg,
    fontSize: 22,
    fontWeight: '700',
  },
  userName: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    color: colors.gray400,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    color: colors.gray500,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  statValue: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  menu: {
    gap: 12,
    marginBottom: 20,
  },
  menuItem: {
    height: 56,
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${colors.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 15,
    color: colors.accent,
    fontWeight: '700',
    textAlign: 'center',
  },
  menuLabel: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  chevron: {
    color: colors.gray500,
    fontSize: 22,
  },
  logoutBtn: {
    height: 56,
    backgroundColor: `${colors.red}1A`,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${colors.red}4D`,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  logoutIcon: {
    color: colors.red,
    fontSize: 20,
    fontWeight: '700',
  },
  logoutText: {
    color: colors.red,
    fontSize: 15,
    fontWeight: '600',
  },
  version: {
    color: colors.gray600,
    fontSize: 13,
    textAlign: 'center',
  },
});
