// [Sayfa 4] İstatistik — dashboard (GET /api/istatistik)
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { Banner, Card, SectionTitle } from '../ui';
import { colors, radius, space } from '../theme';

export function IstatistikScreen() {
  const [veri, setVeri] = useState<any | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState('');

  async function yukle() {
    setRefreshing(true);
    try {
      setVeri(await api.istatistik());
      setErr('');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setRefreshing(false);
    }
  }
  useEffect(() => {
    yukle();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: space.lg, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={yukle} />}
    >
      <View style={styles.rowBetween}>
        <SectionTitle>📊 İstatistikler</SectionTitle>
        <Text onPress={yukle} style={styles.refresh}>
          ↻ Yenile
        </Text>
      </View>
      {err ? <Banner text={'⚠️ ' + err} tone="red" /> : null}

      {veri && (
        <>
          <View style={styles.grid}>
            <Stat label="Toplam Sefer" value={veri.toplam_sefer} color={colors.blue} />
            <Stat label="Toplam Yolcu" value={veri.toplam_yolcu} color={colors.accent} />
            <Stat label="Aktif Bilet" value={veri.aktif_bilet} color={colors.green} />
            <Stat label="İptal Bilet" value={veri.iptal_bilet} color={colors.red} />
            <Stat label="🐇 Bildirim (RabbitMQ)" value={veri.gonderilen_bildirim} color={colors.primary} />
            <Stat label="Gelir (₺)" value={veri.toplam_gelir} color={colors.text} />
          </View>

          <SectionTitle>Popüler Rotalar</SectionTitle>
          {veri.populer_rotalar.length === 0 ? (
            <Banner text="Henüz satış yok." tone="red" />
          ) : (
            veri.populer_rotalar.map((p: any, i: number) => (
              <Card key={i}>
                <View style={styles.rowBetween}>
                  <Text style={styles.rota}>
                    {i + 1}. {p.rota}
                  </Text>
                  <Text style={styles.adet}>{p.adet} bilet</Text>
                </View>
              </Card>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

function Stat({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statVal, { color }]}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  refresh: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: space.md },
  statCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginBottom: space.md,
  },
  statVal: { fontSize: 28, fontWeight: '900' },
  statLbl: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontWeight: '600' },
  rota: { fontSize: 15, fontWeight: '700', color: colors.text },
  adet: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
