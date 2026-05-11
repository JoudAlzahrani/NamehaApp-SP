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

interface HelpSupportScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

const QUICK_ACTIONS = [
  { icon: '◎', iconBg: `${colors.accent}1A`, iconColor: colors.accent, label: 'Live Chat', sub: 'Chat with our support team' },
  { icon: '≡', iconBg: `${'#8B5CF6'}1A`, iconColor: '#8B5CF6', label: 'Help Center', sub: 'Browse articles and guides' },
];

const FAQS = [
  'How do I fund my account?',
  'What are safety limits?',
  'How does AI analysis work?',
  'Can I set custom alerts?',
  'How do I withdraw funds?',
];

export default function HelpSupportScreen({ navigation }: HelpSupportScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Help & Support</Text>
        </View>
        <Text style={styles.subtitle}>We're here to help you get the most out of NAMEHA</Text>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map((action, i) => (
            <TouchableOpacity key={i} style={styles.quickCard} activeOpacity={0.7}>
              <View style={[styles.quickIcon, { backgroundColor: action.iconBg }]}>
                <Text style={[styles.quickIconText, { color: action.iconColor }]}>{action.icon}</Text>
              </View>
              <View style={styles.quickContent}>
                <Text style={styles.quickLabel}>{action.label}</Text>
                <Text style={styles.quickSub}>{action.sub}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact */}
        <Text style={styles.sectionTitle}>Contact us</Text>
        <View style={styles.contactList}>
          <View style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <Text style={styles.contactIcon}>@</Text>
              <Text style={styles.contactLabel}>Email</Text>
            </View>
            <Text style={styles.contactValue}>support@nameha.com</Text>
            <Text style={styles.contactSub}>We'll respond within 24 hours</Text>
          </View>
          <View style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <Text style={[styles.contactIcon, { color: colors.green }]}>◎</Text>
              <Text style={styles.contactLabel}>Phone</Text>
            </View>
            <Text style={styles.contactValue}>+966 11 234 5678</Text>
            <Text style={styles.contactSub}>Sunday - Thursday, 9 AM - 5 PM</Text>
          </View>
        </View>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>Frequently asked</Text>
        <View style={styles.faqList}>
          {FAQS.map((faq, i) => (
            <View key={i}>
              <TouchableOpacity style={styles.faqRow} activeOpacity={0.7}>
                <Text style={styles.faqText}>{faq}</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
              {i < FAQS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Version */}
        <View style={styles.versionCard}>
          <Text style={styles.versionText}>NAMEHA version 1.0.0</Text>
        </View>
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
    lineHeight: 22,
  },
  quickActions: {
    gap: 12,
    marginBottom: 32,
  },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    padding: 20,
    gap: 16,
  },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIconText: {
    fontSize: 22,
    fontWeight: '700',
  },
  quickContent: {
    flex: 1,
  },
  quickLabel: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  quickSub: {
    color: colors.gray500,
    fontSize: 14,
  },
  chevron: {
    color: colors.gray500,
    fontSize: 22,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  contactList: {
    gap: 12,
    marginBottom: 32,
  },
  contactCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    padding: 20,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  contactIcon: {
    fontSize: 22,
    color: colors.accent,
  },
  contactLabel: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  contactValue: {
    color: colors.gray300,
    fontSize: 15,
    marginBottom: 6,
  },
  contactSub: {
    color: colors.gray500,
    fontSize: 13,
  },
  faqList: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  faqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  faqText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray800,
    marginHorizontal: 20,
  },
  versionCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  versionText: {
    color: colors.gray600,
    fontSize: 13,
  },
});
