// [Sayfa 3] Biletlerim — biletleri listele (GET) ve iptal et (DELETE).
// "Bildirim Gönderildi" rozeti, RabbitMQ worker'ının çalıştığının
// uygulama içinden görülebilir kanıtıdır.
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { Badge, Banner, Button, Card, SectionTitle } from '../ui';
import { colors, space } from '../theme';

export function BiletlerimScreen() {
  const [liste, setListe] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState<{ t: string; tone: 'green' | 'red' } | null>(null);

  async function yukle() {
    setRefreshing(true);
    try {
      const r = await api.biletler();
      setListe(r.biletler);
    } catch (e: any) {
      setMsg({ t: '⚠️ ' + e.message, tone: 'red' });
    } finally {
      setRefreshing(false);
    }
  }
  useEffect(() => {
    yukle();
  }, []);

  async function iptal(id: string) {
    setMsg(null);
    try {
      const r = await api.biletIptal(id);
      setMsg({ t: `✅ ${r.pnr} iptal edildi. İade: ${r.iade_tutari} ₺`, tone: 'green' });
      yukle();
    } catch (e: any) {
      setMsg({ t: '⚠️ ' + e.message, tone: 'red' });
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: space.lg, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={yukle} />}
    >
      <View style={styles.rowBetween}>
        <SectionTitle>🎫 Biletlerim ({liste.length})</SectionTitle>
        <Text onPress={yukle} style={styles.refresh}>
          ↻ Yenile
        </Text>
      </View>

      {msg ? <Banner text={msg.t} tone={msg.tone} /> : null}
      {liste.length === 0 && <Banner text="Henüz bilet yok. 'Sefer Ara' sekmesinden bilet alın." tone="red" />}

      {liste.map((b) => {
        const iptalli = b.durum === 'IPTAL';
        return (
          <Card key={b.id} style={iptalli ? { opacity: 0.6 } : undefined}>
            <View style={styles.rowBetween}>
              <Text style={styles.pnr}>PNR: {b.pnr}</Text>
              <Badge text={b.durum} tone={iptalli ? 'red' : 'green'} />
            </View>
            <Text style={styles.rota}>
              {b.kalkis} → {b.varis}
            </Text>
            <Text style={styles.meta}>
              {b.firma} · {b.tarih} {b.saat} · Koltuk {b.koltuk_no} · {b.fiyat} ₺
            </Text>
            <Text style={styles.meta}>Yolcu: {b.yolcu_ad}</Text>
            <View style={{ marginTop: 8, flexDirection: 'row', gap: 8 }}>
              <Badge
                text={b.bildirim_gonderildi ? '🐇 Bildirim gönderildi (RabbitMQ)' : '⏳ Bildirim kuyrukta'}
                tone={b.bildirim_gonderildi ? 'green' : 'amber'}
              />
            </View>
            {!iptalli && (
              <View style={{ marginTop: 12 }}>
                <Button title="Bileti İptal Et" variant="danger" onPress={() => iptal(b.id)} />
              </View>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  refresh: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  pnr: { fontSize: 17, fontWeight: '900', color: colors.primary, letterSpacing: 1 },
  rota: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 6 },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
});
