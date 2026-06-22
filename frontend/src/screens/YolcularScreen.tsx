// [Sayfa 2] Yolcular — yolcu kaydı (POST) ve listeleme (GET)
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { Badge, Banner, Button, Card, Field, SectionTitle } from '../ui';
import { colors, space } from '../theme';

export function YolcularScreen() {
  const [ad, setAd] = useState('');
  const [soyad, setSoyad] = useState('');
  const [tc, setTc] = useState('');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  const [liste, setListe] = useState<any[]>([]);
  const [msg, setMsg] = useState<{ t: string; tone: 'green' | 'red' } | null>(null);
  const [loading, setLoading] = useState(false);

  async function yukle() {
    try {
      const r = await api.yolcular();
      setListe(r.yolcular);
    } catch {}
  }
  useEffect(() => {
    yukle();
  }, []);

  async function kaydet() {
    setMsg(null);
    if (!ad || !soyad || tc.length !== 11 || !telefon) {
      setMsg({ t: 'Ad, soyad, 11 haneli TC ve telefon zorunludur.', tone: 'red' });
      return;
    }
    setLoading(true);
    try {
      const y = await api.yeniYolcu({ ad, soyad, tc, telefon, email });
      setMsg({ t: `✅ ${y.ad} ${y.soyad} kaydedildi.`, tone: 'green' });
      setAd(''); setSoyad(''); setTc(''); setTelefon(''); setEmail('');
      yukle();
    } catch (e: any) {
      setMsg({ t: '⚠️ ' + e.message, tone: 'red' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: space.lg, paddingBottom: 40 }}>
      <SectionTitle>👤 Yolcu Kaydı</SectionTitle>
      <Card>
        <Field label="Ad" value={ad} onChangeText={setAd} placeholder="Ahmet" />
        <Field label="Soyad" value={soyad} onChangeText={setSoyad} placeholder="Yılmaz" />
        <Field label="TC Kimlik No (11 hane)" value={tc} onChangeText={setTc} placeholder="12345678901" keyboardType="numeric" />
        <Field label="Telefon" value={telefon} onChangeText={setTelefon} placeholder="05551112233" keyboardType="phone-pad" />
        <Field label="E-posta" value={email} onChangeText={setEmail} placeholder="ahmet@example.com" />
        {msg ? <Banner text={msg.t} tone={msg.tone} /> : null}
        <Button title="Yolcuyu Kaydet" onPress={kaydet} loading={loading} />
      </Card>

      <SectionTitle>Kayıtlı Yolcular ({liste.length})</SectionTitle>
      {liste.length === 0 && <Banner text="Henüz yolcu kaydı yok." tone="red" />}
      {liste.map((y) => (
        <Card key={y.id}>
          <View style={styles.rowBetween}>
            <Text style={styles.ad}>
              {y.ad} {y.soyad}
            </Text>
            <Badge text={y.cinsiyet} tone="blue" />
          </View>
          <Text style={styles.meta}>TC: {y.tc}</Text>
          <Text style={styles.meta}>📞 {y.telefon}   {y.email ? `· ✉️ ${y.email}` : ''}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ad: { fontSize: 16, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
