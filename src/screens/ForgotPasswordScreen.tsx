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

interface ForgotPasswordScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      const data = await API.forgotPassword(email.trim());
      navigation.navigate('ResetPassword', { token: data.reset_token });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Sparkles size={22} color={colors.accent} strokeWidth={1.5} />
          </View>
        </View>

        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a reset code.
        </Text>

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

        <TouchableOpacity style={styles.btn} onPress={handleSend} activeOpacity={0.85} disabled={loading}>
          {loading
            ? <ActivityIndicator color={colors.bg} />
            : <Text style={styles.btnText}>Send Reset Code</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back to Sign In</Text>
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray700,
    paddingHorizontal: 16,
    marginBottom: 28,
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
  btn: {
    height: 56,
    backgroundColor: colors.accent,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  btnText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
  backRow: {
    alignItems: 'center',
  },
  backText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
});
