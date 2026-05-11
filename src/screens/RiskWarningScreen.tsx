import React from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Static mock portfolio figures — update when real data is wired in
const PORTFOLIO_VALUE  = 12450;
const SABIC_HELD_VALUE = 5200;
const RISK_LIMIT_PCT   = 40; // Medium profile single-stock concentration limit

interface RiskWarningModalProps {
  visible: boolean;
  ticker: string;
  shares: number;
  total: number;
  onProceed: () => void;
  onDismiss: () => void;
}

export default function RiskWarningModal({
  visible,
  ticker,
  shares,
  total,
  onProceed,
  onDismiss,
}: RiskWarningModalProps) {
  const currentPct = Math.round((SABIC_HELD_VALUE / PORTFOLIO_VALUE) * 100);
  const afterPct   = Math.round(
    ((SABIC_HELD_VALUE + total) / (PORTFOLIO_VALUE + total)) * 100,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      {/* Overlay — tap to dismiss */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        {/* Card — inner taps don't bubble to overlay */}
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Warning icon */}
          <View style={styles.iconCircle}>
            <Text style={styles.iconGlyph}>△</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>This trade exceeds your risk level</Text>

          {/* Body */}
          <Text style={styles.body}>
            Adding {shares} share{shares !== 1 ? 's' : ''} of {ticker} would
            push your single-stock concentration above your Medium risk profile
            limit of {RISK_LIMIT_PCT}%. Consider adjusting the order size or
            reviewing your risk settings in Preferences.
          </Text>

          {/* Exposure detail box */}
          <View style={styles.detailBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Current {ticker} exposure</Text>
              <Text style={styles.detailValue}>{currentPct}%</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>After this trade</Text>
              <Text style={[styles.detailValue, styles.detailValueWarning]}>
                {afterPct}%
              </Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Your risk limit</Text>
              <Text style={styles.detailValue}>{RISK_LIMIT_PCT}%</Text>
            </View>
          </View>

          {/* Proceed button */}
          <TouchableOpacity
            style={styles.proceedBtn}
            onPress={onProceed}
            activeOpacity={0.85}
          >
            <Text style={styles.proceedBtnText}>I understand — proceed anyway</Text>
          </TouchableOpacity>

          {/* Adjust / dismiss button */}
          <TouchableOpacity
            style={styles.adjustBtn}
            onPress={onDismiss}
            activeOpacity={0.75}
          >
            <Text style={styles.adjustBtnText}>Adjust my order</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const AMBER      = '#EF9F27';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(15,15,35,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },

  handleBar: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 20,
  },

  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(239,159,39,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,159,39,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconGlyph: {
    color: AMBER,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },

  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 10,
  },
  body: {
    color: colors.gray400,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 21.5, // ≈ 1.65 × 13
    marginBottom: 20,
  },

  detailBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  detailLabel: {
    color: colors.gray400,
    fontSize: 13,
  },
  detailValue: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  detailValueWarning: {
    color: AMBER,
  },

  proceedBtn: {
    width: '100%',
    height: 52,
    backgroundColor: AMBER,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  proceedBtnText: {
    color: '#0A0B0F',
    fontSize: 14,
    fontWeight: '700',
  },
  adjustBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.85,
  },
});
