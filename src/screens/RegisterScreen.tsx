import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { API } from '../services/api';

interface RegisterScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

import { BASE_URL } from '../services/api';

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { setUserId, setUser, setToken } = useApp();
  const [showPassword, setShowPassword]       = useState(false);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleContinue = async () => {
    if (!name || !email || !password) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }

    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // ── تحقق إن الرد JSON قبل ما تحاول تحلله ──────────────────────────
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        const raw = await res.text();
        console.error('Non-JSON response:', raw);
        Alert.alert('خطأ في السيرفر', `السيرفر أرجع رد غير متوقع:\n${raw.slice(0, 200)}`);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || `فشل التسجيل (${res.status})`);
      }

      setUserId(data.user_id);
      setToken(data.access_token ?? data.token ?? null);
      setUser({
        name:        data.name,
        email:       data.email,
        initials:    data.name?.[0] ?? '?',
        profileType: '',
        profileName: '',
      });

      await API.createPortfolio(data.user_id).catch(() => {});

      navigation.navigate('QuizIntro');

    } catch (e: any) {
      if (e.name === 'AbortError') {
        Alert.alert('خطأ', 'انتهت مهلة الطلب، تحقق من الاتصال بالسيرفر');
      } else {
        Alert.alert('خطأ', e.message ?? 'حدث خطأ غير متوقع');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../imports/nameha_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Join NAMEHA</Text>
        <Text style={styles.subtitle}>
          You're about to invest smarter. Let's set up your account.
        </Text>

        {/* Inputs */}
        <View style={styles.inputGroup}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputIconBox}>
              <Text style={styles.inputIconText}>◎</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={colors.gray600}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputIconBox}>
              <Text style={styles.inputIconText}>@</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={colors.gray600}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputIconBox}>
              <Text style={styles.inputIconText}>◉</Text>
            </View>
            <TextInput
              style={[styles.input, { flex: 1, paddingRight: 56 }]}
              placeholder="Create a password"
              placeholderTextColor={colors.gray600}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeToggle}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <TouchableOpacity
            style={[styles.checkbox, disclaimerChecked && styles.checkboxActive]}
            onPress={() => setDisclaimerChecked(!disclaimerChecked)}
          >
            {disclaimerChecked && <Check size={12} color={colors.bg} strokeWidth={3} />}
          </TouchableOpacity>
          <Text style={styles.disclaimerText}>
            I understand that NAMEHA is a decision-support platform. All trades require my explicit approval.
            NAMEHA is not responsible for any financial gains or losses resulting from my investment decisions.
          </Text>
        </View>

        {/* Continue */}
        <TouchableOpacity
          style={[styles.continueBtn, (!disclaimerChecked || loading) && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!disclaimerChecked || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={colors.bg} />
            : <Text style={[styles.continueBtnText, !disclaimerChecked && styles.continueBtnTextDisabled]}>Continue</Text>
          }
        </TouchableOpacity>

        {/* Sign in link */}
        <View style={styles.signInRow}>
          <Text style={styles.signInPrompt}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.signInLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.bg },
  scroll:             { flexGrow: 1, paddingHorizontal: 32, paddingTop: 24, paddingBottom: 32 },
  logoContainer:      { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  logoImage:          { width: 80, height: 48 },
  title:              { color: colors.white, fontSize: 30, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  subtitle:           { color: colors.gray400, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  inputGroup:         { gap: 12, marginBottom: 20 },
  inputWrapper:       { flexDirection: 'row', alignItems: 'center', height: 56, backgroundColor: colors.bgSecondary, borderRadius: 14, borderWidth: 1, borderColor: colors.gray700, paddingHorizontal: 16 },
  inputIconBox:       { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.bgTertiary, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  inputIconText:      { fontSize: 14, color: colors.gray400, fontWeight: '600' },
  input:              { flex: 1, color: colors.white, fontSize: 15 },
  eyeBtn:             { position: 'absolute', right: 16, height: '100%', justifyContent: 'center' },
  eyeToggle:          { fontSize: 13, color: colors.accent, fontWeight: '600' },
  disclaimer:         { flexDirection: 'row', backgroundColor: colors.bgSecondary, borderRadius: 14, padding: 16, marginBottom: 24, gap: 12 },
  checkbox:           { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.gray700, backgroundColor: colors.bgTertiary, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  checkboxActive:     { backgroundColor: colors.accent, borderColor: colors.accent },
  disclaimerText:     { color: colors.gray400, fontSize: 13, lineHeight: 20, flex: 1 },
  continueBtn:        { height: 56, backgroundColor: colors.accent, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  continueBtnDisabled:{ backgroundColor: colors.bgTertiary },
  continueBtnText:    { color: colors.bg, fontSize: 16, fontWeight: '700' },
  continueBtnTextDisabled: { color: colors.gray600 },
  signInRow:          { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signInPrompt:       { color: colors.gray400, fontSize: 15 },
  signInLink:         { color: colors.accent, fontSize: 15, fontWeight: '600' },
});