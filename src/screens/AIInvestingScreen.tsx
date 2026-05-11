import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Easing, Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View, ActivityIndicator,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AppContext';
import { API } from '../services/api';

interface AIInvestingScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

type FlowState = 'setup' | 'agreement' | 'active';

const BASE_URL = 'http://172.30.55.184:8000';

const CONSERVATIVE_RATE = 0.124;
const OPTIMISTIC_RATE   = 0.178;
const BASE_MONTHS       = 6;

const SECTOR_COLORS: Record<string, string> = {
  Energy: colors.amber, Finance: '#3B82F6',
  Technology: '#8B5CF6', Healthcare: colors.green,
  'Real Estate': colors.accent, Materials: '#F97316',
  Telecom: '#EC4899', Utilities: '#14B8A6',
};

function formatAmount(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// ─── Projection chart ─────────────────────────────────────────────────────────

function ProjectionChart({ months }: { months: number }) {
  const [width, setWidth] = useState(280);
  const HEIGHT = 80; const N = 20;
  const PAD_L = 4, PAD_R = 4, PAD_T = 8, PAD_B = 4;
  const chartW = width - PAD_L - PAD_R;
  const chartH = HEIGHT - PAD_T - PAD_B;
  const maxRate = OPTIMISTIC_RATE * (months / BASE_MONTHS);
  const pts = Array.from({ length: N }, (_, i) => {
    const t = i / (N - 1);
    const x = PAD_L + t * chartW;
    const cr = CONSERVATIVE_RATE * (months / BASE_MONTHS) * t;
    const or = OPTIMISTIC_RATE * (months / BASE_MONTHS) * t;
    return { x, yC: PAD_T + chartH - (cr / maxRate) * chartH, yO: PAD_T + chartH - (or / maxRate) * chartH };
  });
  const colW = chartW / N + 1;
  const conservSegs = pts.slice(0, -1).map((p, i) => { const q = pts[i+1]; const dx=q.x-p.x,dy=q.yC-p.yC,len=Math.sqrt(dx*dx+dy*dy); return {mx:(p.x+q.x)/2,my:(p.yC+q.yC)/2,len,ang:Math.atan2(dy,dx)*180/Math.PI}; });
  const optimSegs   = pts.slice(0, -1).map((p, i) => { const q = pts[i+1]; const dx=q.x-p.x,dy=q.yO-p.yO,len=Math.sqrt(dx*dx+dy*dy); return {mx:(p.x+q.x)/2,my:(p.yO+q.yO)/2,len,ang:Math.atan2(dy,dx)*180/Math.PI}; });
  const last = pts[N - 1];
  return (
    <View style={{ height: HEIGHT, position: 'relative', overflow: 'hidden' }} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {pts.map((p,i) => <View key={`b${i}`} style={{ position:'absolute', left:p.x, top:p.yO, width:colW, height:Math.max(0,p.yC-p.yO), backgroundColor:'rgba(16,185,129,0.12)' }} />)}
      {conservSegs.map((s,i) => <View key={`c${i}`} style={{ position:'absolute', left:s.mx-s.len/2, top:s.my-1, width:s.len, height:2, backgroundColor:'rgba(16,185,129,0.4)', borderRadius:1, transform:[{rotate:`${s.ang}deg`}] }} />)}
      {optimSegs.map((s,i) => <View key={`o${i}`} style={{ position:'absolute', left:s.mx-s.len/2, top:s.my-1.5, width:s.len, height:3, backgroundColor:colors.green, borderRadius:1.5, transform:[{rotate:`${s.ang}deg`}] }} />)}
      <View style={{ position:'absolute', left:last.x-4, top:last.yO-4, width:8, height:8, borderRadius:4, backgroundColor:colors.green, borderWidth:2, borderColor:'rgba(10,11,15,0.85)' }} />
    </View>
  );
}

// ─── Mini sparkline ───────────────────────────────────────────────────────────

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const [width, setWidth] = useState(200);
  const HEIGHT = 48, PAD_V = 4;
  const chartH = HEIGHT - PAD_V * 2;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * width, y: PAD_V + chartH - ((v - min) / range) * chartH }));
  const segs = pts.slice(0, -1).map((p, i) => { const q=pts[i+1]; const dx=q.x-p.x,dy=q.y-p.y,len=Math.sqrt(dx*dx+dy*dy); return {mx:(p.x+q.x)/2,my:(p.y+q.y)/2,len,ang:Math.atan2(dy,dx)*180/Math.PI}; });
  const last = pts[pts.length - 1];
  return (
    <View style={{ height: HEIGHT, position: 'relative', overflow: 'hidden' }} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {pts.slice(0,-1).map((p,i) => { const q=pts[i+1]; const topY=Math.min(p.y,q.y); return <View key={`f${i}`} style={{ position:'absolute', left:p.x, top:topY, width:q.x-p.x, height:HEIGHT-topY, backgroundColor:`${color}1A` }} />; })}
      {segs.map((s,i) => <View key={`s${i}`} style={{ position:'absolute', left:s.mx-s.len/2, top:s.my-1.5, width:s.len, height:3, backgroundColor:color, borderRadius:1.5, transform:[{rotate:`${s.ang}deg`}] }} />)}
      <View style={{ position:'absolute', left:last.x-4, top:last.y-4, width:8, height:8, borderRadius:4, backgroundColor:color, borderWidth:2, borderColor:colors.bgSecondary }} />
    </View>
  );
}

// ─── How it works modal ───────────────────────────────────────────────────────

function HowItWorksModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={hiw.overlay} activeOpacity={1} onPress={onClose}>
        <View style={hiw.card}>
          <Text style={hiw.title}>How it works</Text>
          <View style={hiw.divider} />
          {[
            ['You set the amount and duration.', ' We handle everything else — analysis, timing, and execution.'],
            ['Your risk profile guides the AI.', ' Allocation is automatically tailored to your conservative, medium, or aggressive preference.'],
            ['You stay in control.', ' Pause or stop at any time from your active investments view. Returns are estimated — not guaranteed.'],
          ].map(([bold, rest], i) => <Text key={i} style={hiw.bullet}>{'• '}<Text style={hiw.bulletBold}>{bold}</Text>{rest}</Text>)}
          <TouchableOpacity style={hiw.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={hiw.closeBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const hiw = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.6)', alignItems:'center', justifyContent:'center', paddingHorizontal:28 },
  card: { width:'100%', backgroundColor:'#1A1B21', borderRadius:20, padding:24, borderWidth:1, borderColor:'rgba(255,255,255,0.08)' },
  title: { color:colors.white, fontSize:18, fontWeight:'700', marginBottom:14 },
  divider: { height:1, backgroundColor:'rgba(255,255,255,0.08)', marginBottom:16 },
  bullet: { color:colors.gray400, fontSize:14, lineHeight:22, marginBottom:14 },
  bulletBold: { color:colors.white, fontWeight:'600' },
  closeBtn: { marginTop:6, height:48, backgroundColor:colors.accent, borderRadius:14, alignItems:'center', justifyContent:'center' },
  closeBtnText: { color:colors.bg, fontSize:15, fontWeight:'700' },
});

// ─── Hero ─────────────────────────────────────────────────────────────────────

const HERO_OUTER=126, HERO_GRAD=200, HERO_INNER=112;
const HERO_OFFSET=(HERO_OUTER-HERO_GRAD)/2, HERO_INNER_OFFSET=(HERO_OUTER-HERO_INNER)/2;

function HeroAnim() {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.loop(Animated.timing(rotateAnim,{toValue:1,duration:6000,easing:Easing.linear,useNativeDriver:true})).start(); }, []);
  const rotate = rotateAnim.interpolate({ inputRange:[0,1], outputRange:['0deg','360deg'] });
  return (
    <View style={{ width:HERO_OUTER, height:HERO_OUTER, borderRadius:HERO_OUTER/2, overflow:'hidden', alignSelf:'center', marginBottom:26 }}>
      <Animated.View style={{ width:HERO_GRAD, height:HERO_GRAD, position:'absolute', top:HERO_OFFSET, left:HERO_OFFSET, transform:[{rotate}] }}>
        <LinearGradient colors={['#852EC6','#7F80D8','#76E3EF','#852EC6']} start={{x:0,y:0}} end={{x:1,y:1}} style={{ width:HERO_GRAD, height:HERO_GRAD }} />
      </Animated.View>
      <View style={{ position:'absolute', top:HERO_INNER_OFFSET, left:HERO_INNER_OFFSET, width:HERO_INNER, height:HERO_INNER, borderRadius:HERO_INNER/2, backgroundColor:colors.bg, alignItems:'center', justifyContent:'center' }}>
        <Text style={{ fontSize:48, color:colors.white, fontWeight:'700' }}>↗</Text>
      </View>
    </View>
  );
}

// ─── Active Investment Card ───────────────────────────────────────────────────

function ActiveInvestmentCard({ inv, onViewDetails }: {
  inv: { id: number; amountSAR: string; daysAgo: number; returnMin: string; returnMax: string; durationDone: number; durationTotal: number; sparkData: number[] };
  onViewDetails: () => void;
}) {
  const progress = inv.durationDone / inv.durationTotal;
  return (
    <View style={card.wrap}>
      <View style={card.topRow}>
        <Text style={card.name}>Investment #{inv.id}</Text>
        <View style={card.statusPill}><View style={card.statusDot} /><Text style={card.statusText}>Active</Text></View>
      </View>
      <Text style={card.amount}>{inv.amountSAR} SAR</Text>
      <Text style={card.startedAgo}>started {inv.daysAgo} days ago</Text>
      <Text style={card.estReturn}>Estimated return: {inv.returnMin}–{inv.returnMax} SAR</Text>
      <View style={card.sparkWrap}><MiniSparkline data={inv.sparkData} color={colors.green} /></View>
      <Text style={card.durationLabel}>Duration: {inv.durationDone} of {inv.durationTotal} months</Text>
      <View style={card.progressTrack}>
        <View style={[card.progressFill, { flex: progress }]} />
        <View style={{ flex: 1 - progress }} />
      </View>
      <TouchableOpacity style={card.detailsRow} onPress={onViewDetails} activeOpacity={0.7}>
        <Text style={card.detailsLink}>View details →</Text>
      </TouchableOpacity>
    </View>
  );
}

const card = StyleSheet.create({
  wrap: { backgroundColor:'rgba(255,255,255,0.04)', borderWidth:1, borderColor:'rgba(255,255,255,0.08)', borderRadius:16, padding:16, marginBottom:12 },
  topRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
  name: { color:colors.white, fontSize:15, fontWeight:'700' },
  statusPill: { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(16,185,129,0.15)', paddingHorizontal:10, paddingVertical:4, borderRadius:20 },
  statusDot: { width:6, height:6, borderRadius:3, backgroundColor:colors.green },
  statusText: { color:colors.green, fontSize:12, fontWeight:'600' },
  amount: { color:colors.white, fontSize:20, fontWeight:'700', marginBottom:2 },
  startedAgo: { color:colors.gray500, fontSize:12, marginBottom:10 },
  estReturn: { color:colors.gray400, fontSize:13, marginBottom:10 },
  sparkWrap: { marginBottom:12 },
  durationLabel: { color:colors.gray500, fontSize:11, marginBottom:6 },
  progressTrack: { height:4, borderRadius:2, backgroundColor:'rgba(255,255,255,0.08)', flexDirection:'row', overflow:'hidden', marginBottom:12 },
  progressFill: { height:'100%', backgroundColor:colors.accent, borderRadius:2 },
  detailsRow: { alignItems:'flex-end' },
  detailsLink: { color:colors.accent, fontSize:13, fontWeight:'600' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AIInvestingScreen({ navigation }: AIInvestingScreenProps) {
  const { userId } = useAuth();
  const [flowState, setFlowState]               = useState<FlowState>('setup');
  const [amountText, setAmountText]             = useState('5000');
  const [months, setMonths]                     = useState(6);
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const [agreed, setAgreed]                     = useState(false);
  const [aiPlan, setAiPlan]                     = useState<any>(null);
  const [loadingPlan, setLoadingPlan]           = useState(false);
  const [cashBalance, setCashBalance]           = useState<number>(0);
  const [executing, setExecuting]               = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue:0.72, duration:950, useNativeDriver:true }),
      Animated.timing(pulseAnim, { toValue:1,    duration:950, useNativeDriver:true }),
    ])).start();
  }, []);

  useEffect(() => {
    fetch(`${BASE_URL}/portfolio/${userId ?? ''}`).then(r=>r.json()).then(d=>setCashBalance(d?.cash_balance??0)).catch(()=>{});
  }, []);

  useEffect(() => {
    const fetchPlan = async () => {
      const amount = parseInt(amountText.replace(/[^0-9]/g, ''), 10) || 0;
      if (amount < 100) return;
      setLoadingPlan(true);
      try {
        const res = await fetch(`${BASE_URL}/ai-analysis/autoinvest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId ?? '', amount_sar: amount, duration_months: months }),
        });
        const data = await res.json();
        if (data?.success && data?.data) setAiPlan(data.data);
      } catch {}
      finally { setLoadingPlan(false); }
    };
    const timer = setTimeout(fetchPlan, 800);
    return () => clearTimeout(timer);
  }, [amountText, months]);

  const handleConfirmInvestment = async () => {
    if (!agreed || !aiPlan) return;
    setExecuting(true);
    try {
      const result = await API.executePlan(userId ?? '', aiPlan);
      if (!result?.success) {
        Alert.alert('تنبيه', 'تم تنفيذ بعض الصفقات جزئياً. تحقق من سجل التداول.');
      }
      setFlowState('active');
    } catch (e: any) {
      Alert.alert('تعذر التنفيذ', e.message || 'تحقق من رصيدك وحاول مجدداً.');
    } finally {
      setExecuting(false);
    }
  };

  const amount        = parseInt(amountText.replace(/[^0-9]/g, ''), 10) || 0;
  const conservReturn = aiPlan?.estimated_return?.conservative_sar ?? Math.round(amount * CONSERVATIVE_RATE * (months / BASE_MONTHS));
  const optimReturn   = aiPlan?.estimated_return?.optimistic_sar   ?? Math.round(amount * OPTIMISTIC_RATE   * (months / BASE_MONTHS));
  const conservPct    = aiPlan?.estimated_return?.conservative_pct ?? (CONSERVATIVE_RATE * (months / BASE_MONTHS) * 100).toFixed(1);
  const optimPct      = aiPlan?.estimated_return?.optimistic_pct   ?? (OPTIMISTIC_RATE   * (months / BASE_MONTHS) * 100).toFixed(1);
  const allocations   = aiPlan?.sector_allocation ?? [
    { sector: 'Energy', allocation_pct: 40 },
    { sector: 'Finance', allocation_pct: 35 },
    { sector: 'Technology', allocation_pct: 25 },
  ];

  // بيانات الكاردات في الـ active state — تعتمد على الخطة الحقيقية
  const activeInvestments = [
    {
      id: 1,
      amountSAR: formatAmount(amount || 5000),
      daysAgo: 14,
      returnMin: formatAmount(conservReturn || 620),
      returnMax: formatAmount(optimReturn || 890),
      durationDone: Math.max(1, Math.floor(months / 2)),
      durationTotal: months || 6,
      sparkData: [100,102,101,104,107,105,108,110,109,113,115,112,116,120],
    },
  ];

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (flowState === 'setup') {
    return (
      <SafeAreaView style={styles.container}>
        <HowItWorksModal visible={howItWorksVisible} onClose={() => setHowItWorksVisible(false)} />
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>Grow for me</Text>
          <TouchableOpacity style={styles.infoBtn} activeOpacity={0.7} onPress={() => setHowItWorksVisible(true)}>
            <Text style={styles.infoIcon}>ⓘ</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <HeroAnim />
          <Text style={styles.introTitle}>Let the AI grow your money</Text>
          <Text style={styles.introBody}>Enter an amount and a duration. Our AI will analyse the market and automatically invest where it finds the best opportunities based on your risk profile.</Text>
          <Text style={[styles.introDisclaimer, { marginBottom: 26 }]}>Predictions are estimates, not guarantees.</Text>

          <Text style={styles.sectionLabel}>How much would you like to invest?</Text>
          <View style={styles.amountField}>
            <Text style={styles.amountCurrency}>SAR</Text>
            <TextInput style={styles.amountInput} value={amountText} onChangeText={t => setAmountText(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" textAlign="right" placeholderTextColor={colors.gray500} />
          </View>
          <Text style={styles.availableText}>Available: {cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</Text>

          <Text style={[styles.sectionLabel, styles.sectionLabelGap]}>For how long?</Text>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => setMonths(m => Math.max(3, m - 1))} activeOpacity={0.7}><Text style={styles.stepperBtnText}>−</Text></TouchableOpacity>
            <Text style={styles.stepperValue}>{months} months</Text>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => setMonths(m => m + 1)} activeOpacity={0.7}><Text style={styles.stepperBtnText}>+</Text></TouchableOpacity>
          </View>
          <Text style={styles.stepperHint}>Minimum duration is 3 months</Text>

          <View style={styles.predictionCard}>
            <Text style={styles.predictionLabel}>ESTIMATED RETURN</Text>
            {loadingPlan
              ? <ActivityIndicator color={colors.accent} style={{ marginVertical: 12 }} />
              : <Animated.Text style={[styles.predictionValue, { opacity: pulseAnim }]}>{formatAmount(conservReturn)} – {formatAmount(optimReturn)} SAR</Animated.Text>
            }
            <Text style={styles.predictionSub}>{aiPlan?.estimated_return?.label ?? `over ${months} months · based on your Medium risk profile`}</Text>
            <View style={styles.chartWrapper}><ProjectionChart months={months} /></View>
            <View style={styles.predictionFooterRow}>
              <Text style={styles.predictionFooterLeft}>Conservative +{conservPct}%</Text>
              <Text style={styles.predictionFooterRight}>Optimistic +{optimPct}%</Text>
            </View>
          </View>

          <View style={styles.allocationCard}>
            <Text style={styles.allocationTitle}>{aiPlan?.plan_summary ?? 'Where the AI will invest'}</Text>
            {allocations.map((a: any) => {
              const color = SECTOR_COLORS[a.sector] ?? colors.accent;
              return (
                <View key={a.sector} style={styles.allocationRow}>
                  <View style={[styles.allocationDot, { backgroundColor: color }]} />
                  <Text style={styles.allocationName}>{a.sector}</Text>
                  <View style={styles.allocationTrack}>
                    <View style={[styles.allocationFill, { flex: a.allocation_pct, backgroundColor: color + '55' }]} />
                    <View style={{ flex: 100 - a.allocation_pct }} />
                  </View>
                  <Text style={styles.allocationPct}>{a.allocation_pct}%</Text>
                </View>
              );
            })}
            <Text style={styles.allocationNote}>{aiPlan?.risk_note ?? 'Allocation adjusts automatically as market conditions change'}</Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85} onPress={() => setFlowState('agreement')}>
            <Text style={styles.primaryBtnText}>Start growing</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} activeOpacity={0.75} onPress={() => setHowItWorksVisible(true)}>
            <Text style={styles.ghostBtnText}>Learn how this works</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── AGREEMENT ──────────────────────────────────────────────────────────────
  if (flowState === 'agreement') {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={agr.backRow} onPress={() => setFlowState('setup')} activeOpacity={0.7}>
          <Text style={agr.backText}>← Back</Text>
        </TouchableOpacity>
        <ScrollView contentContainerStyle={agr.scroll} showsVerticalScrollIndicator={false}>
          <Text style={agr.title}>Before we begin</Text>
          <Text style={agr.subtitle}>Please read and accept the following before we start investing on your behalf.</Text>
          <View style={agr.card}>
            {[
              'NAMEHA will invest your funds automatically based on your risk profile and current market conditions.',
              'Returns are estimated and not guaranteed. Market conditions can change.',
              'You can pause or stop this investment at any time from your active investments view.',
              'A minimum duration of 3 months applies. Early withdrawal may affect returns.',
              'All trades made on your behalf will appear in your trade history.',
            ].map((point, i) => <Text key={i} style={agr.point}>{'• '}{point}</Text>)}
            <View style={agr.divider} />
            <TouchableOpacity style={agr.checkRow} onPress={() => setAgreed(v => !v)} activeOpacity={0.8}>
              <View style={[agr.checkbox, agreed && agr.checkboxChecked]}>
                {agreed && <Check size={12} color={colors.bg} strokeWidth={3} />}
              </View>
              <Text style={agr.checkLabel}>I have read and agree to the above</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[agr.confirmBtn, (!agreed || executing) && agr.confirmBtnDisabled]} activeOpacity={agreed ? 0.85 : 1} onPress={handleConfirmInvestment} disabled={!agreed || executing}>
            {executing
              ? <ActivityIndicator color={colors.bg} />
              : <Text style={agr.confirmBtnText}>Confirm and start</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={agr.goBackBtn} onPress={() => setFlowState('setup')} activeOpacity={0.75}>
            <Text style={agr.goBackText}>Go back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── ACTIVE ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <View style={act.headerRow}>
        <Text style={act.title}>My investments</Text>
        <TouchableOpacity onPress={() => setFlowState('setup')} activeOpacity={0.75}>
          <Text style={act.newBtn}>Start a new one +</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={act.scroll} showsVerticalScrollIndicator={false}>
        {activeInvestments.map(inv => (
          <ActiveInvestmentCard
            key={inv.id}
            inv={inv}
            onViewDetails={() => navigation.navigate('InvestmentDetail', {
              investmentId: inv.id,
              planData: aiPlan,
            })}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GLASS_BG = 'rgba(255,255,255,0.04)';
const GLASS_BORDER = 'rgba(255,255,255,0.08)';

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:colors.bg },
  topBar: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:22, paddingTop:12, paddingBottom:4 },
  topBarTitle: { color:colors.white, fontSize:24, fontWeight:'700' },
  infoBtn: { width:36, height:36, alignItems:'center', justifyContent:'center' },
  infoIcon: { color:colors.gray500, fontSize:20 },
  scroll: { paddingHorizontal:20, paddingTop:14, paddingBottom:36 },
  introTitle: { color:colors.white, fontSize:18, fontWeight:'700', marginBottom:10 },
  introBody: { color:colors.gray400, fontSize:13, lineHeight:21.5, marginBottom:10 },
  introDisclaimer: { color:colors.gray500, fontSize:11 },
  sectionLabel: { color:colors.white, fontSize:14, fontWeight:'700', marginBottom:12 },
  sectionLabelGap: { marginTop:22 },
  amountField: { flexDirection:'row', alignItems:'center', height:64, backgroundColor:GLASS_BG, borderWidth:1, borderColor:GLASS_BORDER, borderRadius:16, paddingHorizontal:18, gap:10, marginBottom:8 },
  amountCurrency: { color:colors.gray400, fontSize:16, fontWeight:'600' },
  amountInput: { flex:1, color:colors.white, fontSize:24, fontWeight:'700' },
  availableText: { color:colors.gray500, fontSize:12, marginBottom:2 },
  stepper: { flexDirection:'row', alignItems:'center', backgroundColor:GLASS_BG, borderWidth:1, borderColor:GLASS_BORDER, borderRadius:16, paddingHorizontal:14, paddingVertical:10, gap:12, marginBottom:8 },
  stepperBtn: { width:44, height:44, borderRadius:12, backgroundColor:'rgba(255,255,255,0.07)', alignItems:'center', justifyContent:'center' },
  stepperBtnText: { color:colors.white, fontSize:22, fontWeight:'400', lineHeight:26 },
  stepperValue: { flex:1, color:colors.white, fontSize:18, fontWeight:'700', textAlign:'center' },
  stepperHint: { color:colors.gray500, fontSize:11, marginBottom:24 },
  predictionCard: { backgroundColor:GLASS_BG, borderWidth:1, borderColor:'rgba(16,185,129,0.30)', borderRadius:16, padding:18, marginBottom:14 },
  predictionLabel: { color:colors.gray500, fontSize:11, fontWeight:'600', letterSpacing:0.6, marginBottom:8 },
  predictionValue: { color:colors.white, fontSize:28, fontWeight:'700', letterSpacing:-0.5, marginBottom:4 },
  predictionSub: { color:colors.gray500, fontSize:12, marginBottom:16 },
  chartWrapper: { marginBottom:12 },
  predictionFooterRow: { flexDirection:'row', justifyContent:'space-between' },
  predictionFooterLeft: { color:colors.gray500, fontSize:12 },
  predictionFooterRight: { color:colors.gray500, fontSize:12 },
  allocationCard: { backgroundColor:GLASS_BG, borderWidth:1, borderColor:GLASS_BORDER, borderRadius:16, padding:16, marginBottom:22 },
  allocationTitle: { color:colors.white, fontSize:14, fontWeight:'700', marginBottom:16 },
  allocationRow: { flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 },
  allocationDot: { width:8, height:8, borderRadius:4, flexShrink:0 },
  allocationName: { color:colors.white, fontSize:13, fontWeight:'500', width:86 },
  allocationTrack: { flex:1, height:6, borderRadius:3, backgroundColor:'rgba(255,255,255,0.08)', flexDirection:'row', overflow:'hidden' },
  allocationFill: { height:'100%', borderRadius:3 },
  allocationPct: { color:colors.gray500, fontSize:12, fontWeight:'500', width:32, textAlign:'right' },
  allocationNote: { color:colors.gray500, fontSize:11, marginTop:2 },
  primaryBtn: { height:56, backgroundColor:colors.accent, borderRadius:16, alignItems:'center', justifyContent:'center', marginBottom:12 },
  primaryBtnText: { color:colors.bg, fontSize:16, fontWeight:'700' },
  ghostBtn: { height:52, borderRadius:16, borderWidth:1, borderColor:'rgba(255,255,255,0.18)', backgroundColor:'rgba(255,255,255,0.04)', alignItems:'center', justifyContent:'center' },
  ghostBtnText: { color:colors.white, fontSize:15, fontWeight:'500', opacity:0.85 },
});

const agr = StyleSheet.create({
  scroll: { paddingHorizontal:20, paddingTop:8, paddingBottom:40 },
  backRow: { paddingHorizontal:20, paddingTop:16, paddingBottom:4 },
  backText: { color:colors.accent, fontSize:15, fontWeight:'600' },
  title: { color:colors.white, fontSize:22, fontWeight:'700', marginBottom:10, marginTop:8 },
  subtitle: { color:colors.gray400, fontSize:13, lineHeight:20, marginBottom:22 },
  card: { backgroundColor:'rgba(255,255,255,0.04)', borderWidth:1, borderColor:'rgba(255,255,255,0.08)', borderRadius:16, padding:18, marginBottom:22 },
  point: { color:colors.gray400, fontSize:13, lineHeight:22, marginBottom:10 },
  divider: { height:1, backgroundColor:'rgba(255,255,255,0.08)', marginTop:6, marginBottom:16 },
  checkRow: { flexDirection:'row', alignItems:'center', gap:12 },
  checkbox: { width:20, height:20, borderRadius:5, borderWidth:2, borderColor:'rgba(255,255,255,0.30)', backgroundColor:'transparent', alignItems:'center', justifyContent:'center' },
  checkboxChecked: { borderColor:colors.accent, backgroundColor:colors.accent },
  checkLabel: { color:colors.white, fontSize:13, flex:1 },
  confirmBtn: { height:56, backgroundColor:colors.accent, borderRadius:16, alignItems:'center', justifyContent:'center', marginBottom:12 },
  confirmBtnDisabled: { opacity:0.4 },
  confirmBtnText: { color:colors.bg, fontSize:16, fontWeight:'700' },
  goBackBtn: { height:52, borderRadius:16, borderWidth:1, borderColor:'rgba(255,255,255,0.18)', backgroundColor:'rgba(255,255,255,0.04)', alignItems:'center', justifyContent:'center' },
  goBackText: { color:colors.white, fontSize:15, fontWeight:'500', opacity:0.85 },
});

const act = StyleSheet.create({
  headerRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:22, paddingTop:20, paddingBottom:16 },
  title: { color:colors.white, fontSize:22, fontWeight:'700' },
  newBtn: { color:colors.accent, fontSize:14, fontWeight:'600' },
  scroll: { paddingHorizontal:20, paddingBottom:40 },
});