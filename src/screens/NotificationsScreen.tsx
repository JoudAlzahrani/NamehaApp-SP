import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';

function BellIcon({ size = 28, color = '#00E5CC' }: { size?: number; color?: string }) {
  const W = Math.round(size * 0.86);
  const stroke = 2.5;
  const domeH = Math.round(W * 0.55);
  const bodyH = Math.round(W * 0.35);
  const barH = Math.round(stroke * 1.5);
  const clapperSize = 6;
  return (
    <View style={{ width: W + stroke * 2, height: size, alignItems: 'center' }}>
      <View style={{
        width: W, height: domeH + bodyH,
        borderTopLeftRadius: W / 2, borderTopRightRadius: W / 2,
        borderWidth: stroke, borderBottomWidth: 0, borderColor: color,
        backgroundColor: 'transparent', position: 'absolute', top: 0,
      }} />
      <View style={{
        position: 'absolute', top: domeH + bodyH - stroke,
        width: W + stroke * 2, height: barH,
        borderRadius: barH / 2, backgroundColor: color,
      }} />
      <View style={{
        position: 'absolute', top: domeH + bodyH + barH + 2,
        width: clapperSize, height: clapperSize,
        borderRadius: clapperSize / 2, borderWidth: stroke,
        borderColor: color, backgroundColor: 'transparent',
      }} />
    </View>
  );
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';

interface NotificationsScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

const INBOX = [
  {
    id: 'n1',
    icon: '△',
    iconBg: `${colors.red}15`,
    iconColor: colors.red,
    title: 'Loss cap reached',
    body: 'Aramco is down 1.2% — approaching your 500 SAR max loss limit.',
    time: 'Just now',
    unread: true,
  },
  {
    id: 'n2',
    icon: '◈',
    iconBg: `${colors.amber}15`,
    iconColor: colors.amber,
    title: 'Daily limit at 80%',
    body: 'You have used 1,600 SAR of your 2,000 SAR daily trading limit.',
    time: '14 min ago',
    unread: true,
  },
  {
    id: 'n3',
    icon: '↑',
    iconBg: `${colors.green}15`,
    iconColor: colors.green,
    title: 'SABIC price target hit',
    body: 'SABIC reached your target price of 95 SAR. Review the latest analysis.',
    time: '2 hr ago',
    unread: false,
  },
  {
    id: 'n4',
    icon: '◎',
    iconBg: `${'#8B5CF6'}15`,
    iconColor: '#8B5CF6',
    title: 'New AI insight',
    body: 'Al Rajhi Bank shows strong buy signal — 82% confidence.',
    time: 'Yesterday',
    unread: false,
  },
];

export default function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [insights, setInsights] = useState(true);
  const [tradeConfirmations, setTradeConfirmations] = useState(true);
  const [marketNews, setMarketNews] = useState(false);
  const [portfolioUpdates, setPortfolioUpdates] = useState(true);

  const ITEMS = [
    { icon: '↑', iconBg: `${colors.green}1A`, iconColor: colors.green, label: 'Price alerts', sub: 'Target price reached', value: priceAlerts, onChange: setPriceAlerts },
    { icon: '◎', iconBg: `${'#8B5CF6'}1A`, iconColor: '#8B5CF6', label: 'AI Insights', sub: 'New recommendations', value: insights, onChange: setInsights },
    { icon: '◉', iconBg: `${colors.accent}1A`, iconColor: colors.accent, label: 'Trade confirmations', sub: 'Order executed', value: tradeConfirmations, onChange: setTradeConfirmations },
    { icon: '△', iconBg: `${colors.amber}1A`, iconColor: colors.amber, label: 'Market news', sub: 'Breaking updates', value: marketNews, onChange: setMarketNews },
    { icon: '≡', iconBg: `${colors.accent}1A`, iconColor: colors.accent, label: 'Portfolio updates', sub: 'Daily summaries', value: portfolioUpdates, onChange: setPortfolioUpdates },
  ];

  const handleSave = () => {
    Alert.alert('Saved', 'Notification preferences saved!', [
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
          <Text style={styles.title}>Notifications</Text>
        </View>

        {/* Inbox */}
        <Text style={styles.sectionLabel}>Inbox</Text>
        {INBOX.length > 0 ? (
          <View style={styles.inboxList}>
            {INBOX.map(item => (
              <View key={item.id} style={[styles.inboxCard, item.unread && styles.inboxCardUnread]}>
                <View style={[styles.inboxIcon, { backgroundColor: item.iconBg }]}>
                  <Text style={[styles.inboxIconText, { color: item.iconColor }]}>{item.icon}</Text>
                </View>
                <View style={styles.inboxContent}>
                  <View style={styles.inboxTop}>
                    <Text style={styles.inboxTitle}>{item.title}</Text>
                    <Text style={styles.inboxTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.inboxBody}>{item.body}</Text>
                </View>
                {item.unread && <View style={styles.unreadDot} />}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.inboxEmpty}>
            <View style={styles.inboxEmptyIcon}>
              <BellIcon size={34} color="#00E5CC" />
            </View>
            <Text style={styles.inboxEmptyTitle}>All caught up!</Text>
            <Text style={styles.inboxEmptyText}>
              No notifications right now. We'll let you know when something needs your attention.
            </Text>
          </View>
        )}

        {/* Preferences */}
        <Text style={styles.sectionLabel}>Alert preferences</Text>
        <Text style={styles.subtitle}>Manage when and how you receive alerts</Text>

        <View style={styles.notifList}>
          {ITEMS.map((item, i) => (
            <View key={i} style={styles.notifCard}>
              <View style={styles.notifLeft}>
                <View style={[styles.notifIcon, { backgroundColor: item.iconBg }]}>
                  <Text style={[styles.notifIconText, { color: item.iconColor }]}>{item.icon}</Text>
                </View>
                <View>
                  <Text style={styles.notifLabel}>{item.label}</Text>
                  <Text style={styles.notifSub}>{item.sub}</Text>
                </View>
              </View>
              <Switch
                value={item.value}
                onValueChange={item.onChange}
                trackColor={{ false: colors.bgTertiary, true: colors.accent }}
                thumbColor={colors.white}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save preferences</Text>
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
  sectionLabel: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 8,
  },
  subtitle: {
    color: colors.gray400,
    fontSize: 14,
    marginBottom: 16,
    marginTop: -8,
  },
  inboxList: {
    gap: 10,
    marginBottom: 32,
  },
  inboxEmpty: {
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: 20,
    paddingVertical: 44,
    paddingHorizontal: 28,
    marginBottom: 32,
  },
  inboxEmptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.accent}18`,
    borderWidth: 1,
    borderColor: `${colors.accent}30`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  inboxEmptyTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  inboxEmptyText: {
    color: colors.gray500,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  inboxCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  inboxCardUnread: {
    backgroundColor: colors.bgTertiary,
  },
  inboxIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inboxIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  inboxContent: {
    flex: 1,
  },
  inboxTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  inboxTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  inboxTime: {
    color: colors.gray500,
    fontSize: 12,
    flexShrink: 0,
  },
  inboxBody: {
    color: colors.gray400,
    fontSize: 13,
    lineHeight: 19,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 4,
    flexShrink: 0,
  },
  notifList: {
    gap: 12,
    marginBottom: 32,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    padding: 20,
  },
  notifLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  notifIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIconText: {
    fontSize: 20,
    fontWeight: '700',
  },
  notifLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  notifSub: {
    color: colors.gray500,
    fontSize: 13,
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
