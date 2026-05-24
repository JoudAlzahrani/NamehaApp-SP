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
import { RouteProp } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { API } from '../services/api';

interface ResetPasswordScreenProps {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ ResetPassword: { token: string } }, 'ResetPassword'>;
}

export default function ResetPasswordScreen({ navigation, route }: ResetPasswordScreenProps) {
  const { token } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await API.resetPassword(token, newPassword);
      Alert.alert('Success', 'Password changed successfully. Please sign in.', [
        { text: 'Sign In', onPress: () => navigation.navigate('SignIn') },
      ]);
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

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your new password below.</Text>

        <View style={styles.inputGroup}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputIconBox}>
              <Text style={styles.inputIconText}>◉</Text>
            </View>
            <TextInput
              style={[styles.input, { flex: 1, paddingRight: 56 }]}
              placeholder="New password"
              placeholderTextColor={colors.gray600}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(!showNew)}>
              <Text style={styles.eyeToggle}>{showNew ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputIconBox}>
              <Text style={styles.inputIconText}>◉</Text>
            </View>
            <TextInput
              style={[styles.input, { flex: 1, paddingRight: 56 }]}
              placeholder="Confirm new password"
              placeholderTextColor={colors.gray600}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
              <Text style={styles.eyeToggle}>{showConfirm ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleReset} activeOpacity={0.85} disabled={loading}>
          {loading
            ? <ActivityIndicator color={colors.bg} />
            : <Text style={styles.btnText}>Reset Password</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backRow} onPress={() => navigation.navigate('SignIn')}>
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
  inputGroup: {
    gap: 12,
    marginBottom: 28,
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
