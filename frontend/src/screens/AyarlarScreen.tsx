// [Sayfa 5] Ayarlar — API adresi yapılandırma + canlı sağlık kontrolü.
// "Bağlantıyı Test Et" tüm mikroservislerin (Mongo/Redis/RabbitMQ) durumunu gösterir.
import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { Badge, Banner, Button, Card, Field, SectionTitle } from '../ui';
import { colors, space } from '../theme';

export function AyarlarScreen() {
  const [base, setBase] = useState(api.getBase());
  const [health, setHealth] = useState<any | null>(null);
  const [msg, setMsg] = useState<{ t: string; tone: 'green' | 'red' } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBase(api.getBase());
  }, []);

  async function kaydet() {
    await api.setBase(base);
    setBase(api.getBase());
    setMsg({ t: '✅ API adresi kaydedildi: ' + api.getBase(), tone: 'green' });
  }

  async function testEt() {
    setLoading(true);
    setMsg(null);
    try {
      await api.setBase(base);
      const h = await api.health();
      setHealth(h);
      setMsg({ t: '✅ Bağlantı başarılı (' + api.getBase() + ')', tone: 'green' });
    } catch (e: any) {
      setHealth(null);
      setMsg({ t: '⚠️ ' + e.message, tone: 'red' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: space.lg, paddingBottom: 40 }}>
      <SectionTitle>⚙️ Ayarlar</SectionTitle>
      <Card>
        <Field label="Backend API Adresi" value={base} onChangeText={setBase} placeholder="http://localhost:8000" />
        <Text style={styles.hint}>
          • Web/iOS: http://localhost:8000{'\n'}
          • Android emülatör: http://10.0.2.2:8000{'\n'}
          • Gerçek cihaz: http://&lt;bilgisayar-IP&gt;:8000
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button title="Kaydet" variant="outline" onPress={kaydet} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Bağlantıyı Test Et" onPress={testEt} loading={loading} />
          </View>
        </View>
        {msg ? <Banner text={msg.t} tone={msg.tone} /> : null}
      </Card>

      {health && (
        <Card>
          <Text style={styles.title}>Servis Durumu (/health)</Text>
          <View style={styles.svcRow}>
            <Text style={styles.svc}>🗄️ MongoDB</Text>
            <Badge text={health.servisler.mongodb} tone={health.servisler.mongodb === 'up' ? 'green' : 'red'} />
          </View>
          <View style={styles.svcRow}>
            <Text style={styles.svc}>⚡ Redis</Text>
            <Badge text={health.servisler.redis} tone={health.servisler.redis === 'up' ? 'green' : 'red'} />
          </View>
          <View style={styles.svcRow}>
            <Text style={styles.svc}>🐇 RabbitMQ</Text>
            <Badge text={health.servisler.rabbitmq} tone={health.servisler.rabbitmq === 'up' ? 'green' : 'red'} />
          </View>
        </Card>
      )}

      <Card>
        <Text style={styles.title}>Faydalı Bağlantılar</Text>
        <Text style={styles.link} onPress={() => Linking.openURL(api.getBase() + '/docs')}>
          📘 Swagger API Dokümantasyonu (/docs)
        </Text>
        <Text style={styles.link} onPress={() => Linking.openURL('http://localhost:15672')}>
          🐇 RabbitMQ Yönetim Arayüzü (:15672 · guest/guest)
        </Text>
      </Card>

      <Text style={styles.footer}>Biletal · Otobüs Bileti Otomasyon Sistemi · Mikroservis Mimarisi</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: space.md, lineHeight: 18 },
  title: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 10 },
  svcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  svc: { fontSize: 15, color: colors.text, fontWeight: '600' },
  link: { fontSize: 14, color: colors.blue, paddingVertical: 8, fontWeight: '600' },
  footer: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 20 },
});
