// ============================================================================
//  Biletal — Otobüs Bileti Otomasyon Sistemi · Mobil Arayüz (React Native/Expo)
//  Mobil uyumlu; web simülasyon modu (expo start --web) ile tarayıcıda çalışır.
// ============================================================================
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api, ApiLog } from './src/api';
import { ApiLogBar } from './src/components/ApiLogBar';
import { SeferAraScreen } from './src/screens/SeferAraScreen';
import { YolcularScreen } from './src/screens/YolcularScreen';
import { BiletlerimScreen } from './src/screens/BiletlerimScreen';
import { IstatistikScreen } from './src/screens/IstatistikScreen';
import { AyarlarScreen } from './src/screens/AyarlarScreen';
import { colors } from './src/theme';

type TabKey = 'ara' | 'yolcular' | 'biletler' | 'istatistik' | 'ayarlar';

const TABS: { key: TabKey; icon: string; label: string }[] = [
  { key: 'ara', icon: '🔍', label: 'Sefer Ara' },
  { key: 'yolcular', icon: '👤', label: 'Yolcular' },
  { key: 'biletler', icon: '🎫', label: 'Biletlerim' },
  { key: 'istatistik', icon: '📊', label: 'İstatistik' },
  { key: 'ayarlar', icon: '⚙️', label: 'Ayarlar' },
];

export default function App() {
  const [tab, setTab] = useState<TabKey>('ara');
  const [log, setLog] = useState<ApiLog | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.onLog(setLog);
    api.loadBase().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text style={{ fontSize: 18 }}>🚌 Biletal yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      {/* Üst başlık */}
      <View style={styles.header}>
        <Text style={styles.logo}>🚌 Biletal</Text>
        <Text style={styles.subtitle}>Otobüs Bileti Otomasyon Sistemi</Text>
      </View>

      {/* Aktif ekran (sekme değişince yeniden yüklenir → güncel veri) */}
      <View style={styles.body}>
        {tab === 'ara' && <SeferAraScreen />}
        {tab === 'yolcular' && <YolcularScreen />}
        {tab === 'biletler' && <BiletlerimScreen />}
        {tab === 'istatistik' && <IstatistikScreen />}
        {tab === 'ayarlar' && <AyarlarScreen />}
      </View>

      {/* Canlı API log çubuğu — istek/yanıt kanıtı */}
      <ApiLogBar log={log} />

      {/* Alt sekme çubuğu */}
      <View style={styles.tabbar}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
              <Text style={[styles.tabIcon, { opacity: active ? 1 : 0.5 }]}>{t.icon}</Text>
              <Text style={[styles.tabLabel, active && { color: colors.primary, fontWeight: '800' }]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 18,
  },
  logo: { fontSize: 24, fontWeight: '900', color: '#fff' },
  subtitle: { fontSize: 13, color: '#FFE0DD', marginTop: 2 },
  body: { flex: 1 },
  tabbar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
});
