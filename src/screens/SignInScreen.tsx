import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { API } from '../services/api';
import { useApp } from '../context/AppContext';

interface SignInScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

export default function SignInScreen({ navigation }: SignInScreenProps) {
  const { setUserId, setUser, setToken } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    setLoading(true);
    try {
      const data = await API.login(email, password);
      setUserId(data.user_id);
      setToken(data.access_token ?? data.token ?? null);
      setUser({ name: data.name, email: data.email, initials: data.name[0], profileType: '', profileName: '' });
      await API.createPortfolio(data.user_id).catch(() => {});
      navigation.navigate('Main');
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Sparkles size={22} color={colors.accent} strokeWidth={1.5} />
          </View>
        </View>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Your portfolio has been waiting for you.</Text>

        {/* Inputs */}
        <View style={styles.inputGroup}>
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
              placeholder="Enter your password"
              placeholderTextColor={colors.gray600}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeToggle}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity
          style={styles.forgotRow}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Sign In Button */}
        <TouchableOpacity style={styles.signInBtn} onPress={handleSignIn} activeOpacity={0.85} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.signInBtnText}>Sign In</Text>}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Buttons */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.85}>
            <Text style={styles.socialBtnText}>G  Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.85}>
            <Text style={styles.socialBtnText}>  Apple</Text>
          </TouchableOpacity>
        </View>

        {/* Create account link */}
        <View style={styles.createRow}>
          <Text style={styles.createPrompt}>New here? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.createLink}>Create account</Text>
          </TouchableOpacity>
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
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoStar: {
    fontSize: 24,
    color: colors.accent,
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
    lineHeight: 22,
    marginBottom: 32,
  },
  inputGroup: {
    gap: 12,
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray700,
    paddingHorizontal: 16,
  },
  inputIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  inputIconText: {
    fontSize: 14,
    color: colors.gray400,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    color: colors.white,
    fontSize: 15,
  },
  eyeBtn: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
  },
  eyeToggle: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 28,
  },
  forgotText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  signInBtn: {
    height: 56,
    backgroundColor: colors.accent,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  signInBtnText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray800,
  },
  dividerText: {
    color: colors.gray500,
    fontSize: 14,
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  socialBtn: {
    flex: 1,
    height: 56,
    backgroundColor: colors.bgTertiary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray700,
  },
  socialBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  createRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createPrompt: {
    color: colors.gray400,
    fontSize: 15,
  },
  createLink: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
});
