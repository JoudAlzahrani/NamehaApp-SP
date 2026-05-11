import React, { useState } from 'react';
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

interface TermsPrivacyScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

const TERMS_SECTIONS = [
  { title: '1. Acceptance of Terms', body: 'By accessing and using NAMEHA, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, you should not use this service.' },
  { title: '2. Investment Disclaimer', body: 'NAMEHA is a decision-support platform and does not provide financial advice. All investment decisions are made solely by you. We are not responsible for any financial gains or losses resulting from your investment decisions.' },
  { title: '3. User Responsibilities', body: 'You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.' },
  { title: '4. AI-Generated Insights', body: 'Our AI-powered insights are provided for informational purposes only. They should not be considered as financial advice or recommendations. Past performance does not guarantee future results.' },
  { title: '5. Limitation of Liability', body: 'NAMEHA shall not be liable for any direct, indirect, incidental, special, consequential or exemplary damages resulting from your use of the service.' },
];

const PRIVACY_SECTIONS = [
  { title: 'Information We Collect', body: 'We collect information you provide directly to us, including: Account information (name, email, phone number), Trading activity and portfolio data, Device and usage information, Communication preferences.' },
  { title: 'How We Use Your Information', body: 'We use the information we collect to: Provide and improve our services, Generate personalized AI insights, Communicate with you about your account, Ensure security and prevent fraud.' },
  { title: 'Data Security', body: 'We implement industry-standard security measures to protect your personal information. All data is encrypted in transit and at rest. We are regulated by SAMA and comply with Saudi data protection laws.' },
  { title: 'Data Sharing', body: 'We do not sell your personal information to third parties. We may share data with service providers who help us operate our platform, always under strict confidentiality agreements.' },
  { title: 'Your Rights', body: 'You have the right to access, correct, or delete your personal information. You can also request a copy of your data or opt-out of certain data processing activities.' },
];

export default function TermsPrivacyScreen({ navigation }: TermsPrivacyScreenProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');
  const sections = activeTab === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>Legal</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'terms' && styles.tabActive]}
          onPress={() => setActiveTab('terms')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>Terms of Service</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'privacy' && styles.tabActive]}
          onPress={() => setActiveTab('privacy')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.contentCard}>
          <View style={styles.contentHeader}>
            <Text style={styles.contentIcon}>{activeTab === 'terms' ? '≡' : '◆'}</Text>
            <Text style={styles.contentTitle}>
              {activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            </Text>
          </View>
          <Text style={styles.lastUpdated}>Last updated: April 3, 2026</Text>

          {sections.map((section, i) => (
            <View key={i} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}
        </View>

        {activeTab === 'privacy' && (
          <View style={styles.privacyNote}>
            <Text style={styles.privacyNoteIcon}>◎</Text>
            <View style={styles.privacyNoteContent}>
              <Text style={styles.privacyNoteTitle}>Your privacy matters</Text>
              <Text style={styles.privacyNoteText}>
                We're committed to protecting your privacy and handling your data responsibly. If you have any questions, contact us at privacy@nameha.com
              </Text>
            </View>
          </View>
        )}
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
    marginBottom: 16,
  },
  titleRow: {
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  title: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    height: 48,
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.bg,
  },
  scroll: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  contentCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  contentIcon: {
    fontSize: 20,
    color: colors.accent,
    fontWeight: '700',
  },
  contentTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  lastUpdated: {
    color: colors.gray500,
    fontSize: 14,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionBody: {
    color: colors.gray400,
    fontSize: 14,
    lineHeight: 22,
  },
  privacyNote: {
    flexDirection: 'row',
    backgroundColor: `${colors.accent}1A`,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
    borderRadius: 14,
    padding: 20,
    gap: 12,
  },
  privacyNoteIcon: {
    fontSize: 22,
    flexShrink: 0,
    marginTop: 2,
  },
  privacyNoteContent: {
    flex: 1,
  },
  privacyNoteTitle: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  privacyNoteText: {
    color: colors.accent,
    fontSize: 14,
    lineHeight: 22,
  },
});
