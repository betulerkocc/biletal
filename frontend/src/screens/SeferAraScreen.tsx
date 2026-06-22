// [Sayfa 1] Sefer Ara — Redis cache (HIT/MISS) burada net görünür.
// Bilet alma akışı (koltuk seçimi + RabbitMQ tetikleyen satın alma) bu ekrandadır.
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '../api';
import { SeatMap } from '../components/SeatMap';
import { Badge, Banner, Button, Card, Chip, SectionTitle } from '../ui';
import { colors, radius, space } from '../theme';

const TARIHLER = ['2026-06-23', '2026-06-24', '2026-06-25'];

export function SeferAraScreen() {
  const [sehirler, setSehirler] = useState<string[]>([]);
  const [kalkis, setKalkis] = useState<string | undefined>();
  const [varis, setVaris] = useState<string | undefined>();
  const [tarih, setTarih] = useState<string | undefined>();
  const [sonuc, setSonuc] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Satın alma modalı
  const [seciliSefer, setSeciliSefer] = useState<any | null>(null);

  useEffect(() => {
    api.sehirler().then((r) => setSehirler(r.sehirler.map((s: any) => s.ad))).catch(() => {});
  }, []);

  async function ara() {
    setLoading(true);
    setErr('');
    try {
      const r = await api.seferler({ kalkis, varis, tarih });
      setSonuc(r);
    } catch (e: any) {
      setErr(e.message);
      setSonuc(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: space.lg, paddingBottom: 40 }}>
      <SectionTitle>🔍 Sefer Ara</SectionTitle>

      <Card>
        <Text style={styles.lbl}>Kalkış</Text>
        <ChipRow items={sehirler} value={kalkis} onPick={setKalkis} />
        <Text style={styles.lbl}>Varış</Text>
        <ChipRow items={sehirler} value={varis} onPick={setVaris} />
        <Text style={styles.lbl}>Tarih</Text>
        <ChipRow items={TARIHLER} value={tarih} onPick={setTarih} />
        <Button title="Seferleri Getir" onPress={ara} loading={loading} />
      </Card>

      {err ? <Banner text={'⚠️ ' + err} tone="red" /> : null}

      {sonuc && (
        <>
          {/* Redis cache durumu — videoda gösterilecek kanıt */}
          <View
            style={[
              styles.cacheBox,
              { backgroundColor: sonuc.cache === 'HIT' ? colors.greenBg : colors.amberBg },
            ]}
          >
            <Text style={styles.cacheTitle}>
              {sonuc.cache === 'HIT' ? '⚡ Redis CACHE → HIT' : '🗄️ MongoDB → MISS'}
            </Text>
            <Text style={styles.cacheSub}>
              Kaynak: {sonuc.kaynak} · Süre: {sonuc.sure_ms} ms · {sonuc.adet} sefer
            </Text>
            <Text style={styles.cacheHint}>
              {sonuc.cache === 'HIT'
                ? 'Bu sonuç Redis önbelleğinden geldi (çok daha hızlı).'
                : 'İlk istek: MongoDB sorgulandı ve Redis\'e yazıldı. Tekrar aratın → HIT.'}
            </Text>
          </View>

          {sonuc.seferler.length === 0 && <Banner text="Bu kriterlere uygun sefer yok." tone="red" />}

          {sonuc.seferler.map((s: any) => (
            <Card key={s.id}>
              <View style={styles.rowBetween}>
                <Text style={styles.firma}>{s.firma}</Text>
                <Badge text={s.otobus_tipi} tone="blue" />
              </View>
              <View style={[styles.rowBetween, { marginVertical: 8 }]}>
                <View>
                  <Text style={styles.saat}>{s.saat}</Text>
                  <Text style={styles.rota}>
                    {s.kalkis} → {s.varis}
                  </Text>
                  <Text style={styles.meta}>
                    {s.tarih} · {s.sure}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.fiyat}>{s.fiyat} ₺</Text>
                  <Text style={styles.koltuk}>{s.bos_koltuk} boş koltuk</Text>
                </View>
              </View>
              <Button
                title="🎫 Bilet Al"
                variant="accent"
                onPress={() => setSeciliSefer(s)}
                disabled={s.bos_koltuk <= 0}
              />
            </Card>
          ))}
        </>
      )}

      <Modal visible={!!seciliSefer} animationType="slide" transparent onRequestClose={() => setSeciliSefer(null)}>
        {seciliSefer && (
          <BiletAlModal sefer={seciliSefer} onClose={() => setSeciliSefer(null)} />
        )}
      </Modal>
    </ScrollView>
  );
}

function ChipRow({
  items,
  value,
  onPick,
}: {
  items: string[];
  value?: string;
  onPick: (v: string | undefined) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: space.sm }}>
      <Chip label="Hepsi" active={!value} onPress={() => onPick(undefined)} />
      {items.map((it) => (
        <Chip key={it} label={it} active={value === it} onPress={() => onPick(it)} />
      ))}
    </ScrollView>
  );
}

// ── Bilet Al Modalı: koltuk seçimi + yolcu seçimi + satın alma ──
function BiletAlModal({ sefer, onClose }: { sefer: any; onClose: () => void }) {
  const [detay, setDetay] = useState<any | null>(null);
  const [yolcular, setYolcular] = useState<any[]>([]);
  const [koltuk, setKoltuk] = useState<number | null>(null);
  const [yolcuId, setYolcuId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sonuc, setSonuc] = useState<any | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.seferDetay(sefer.id).then(setDetay).catch((e) => setErr(e.message));
    api.yolcular().then((r) => {
      setYolcular(r.yolcular);
      if (r.yolcular.length) setYolcuId(r.yolcular[0].id);
    });
  }, [sefer.id]);

  async function satinAl() {
    if (!koltuk) {
      setErr('Lütfen bir koltuk seçin.');
      return;
    }
    if (!yolcuId) {
      setErr('Lütfen bir yolcu seçin (önce Yolcular sekmesinden kayıt ekleyin).');
      return;
    }
    setLoading(true);
    setErr('');
    try {
      const r = await api.biletAl({ sefer_id: sefer.id, koltuk_no: koltuk, yolcu_id: yolcuId });
      setSonuc(r);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.modalWrap}>
      <View style={styles.modalCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.modalTitle}>🎫 Bilet Al</Text>
          <Text onPress={onClose} style={styles.close}>
            ✕
          </Text>
        </View>
        <Text style={styles.rota}>
          {sefer.firma} · {sefer.kalkis} → {sefer.varis} · {sefer.tarih} {sefer.saat}
        </Text>

        {sonuc ? (
          <View style={{ marginTop: 16 }}>
            <Banner text="✅ Bilet onaylandı!" tone="green" />
            <Card>
              <Text style={styles.pnr}>PNR: {sonuc.pnr}</Text>
              <Text style={styles.meta}>Koltuk: {sonuc.koltuk_no} · {sonuc.fiyat} ₺</Text>
              <View style={{ marginTop: 10 }}>
                <Badge
                  text={sonuc.rabbitmq_published ? '🐇 RabbitMQ olayı yayınlandı' : 'RabbitMQ kapalı'}
                  tone={sonuc.rabbitmq_published ? 'green' : 'red'}
                />
              </View>
              <Text style={styles.cacheHint}>
                Bildirim worker kuyruğa alındı → SMS/E-posta gönderiliyor.
              </Text>
            </Card>
            <Button title="Kapat" onPress={onClose} />
          </View>
        ) : (
          <ScrollView style={{ maxHeight: 460 }}>
            {detay ? (
              <>
                <Text style={[styles.lbl, { marginTop: 12 }]}>Koltuk Seç</Text>
                <SeatMap
                  total={detay.toplam_koltuk}
                  taken={detay.dolu_koltuklar || []}
                  selected={koltuk}
                  onSelect={setKoltuk}
                />
                <Text style={[styles.lbl, { marginTop: 12 }]}>Yolcu Seç</Text>
                {yolcular.length === 0 ? (
                  <Banner text="Kayıtlı yolcu yok. 'Yolcular' sekmesinden ekleyin." tone="red" />
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {yolcular.map((y) => (
                      <Chip
                        key={y.id}
                        label={`${y.ad} ${y.soyad}`}
                        active={yolcuId === y.id}
                        onPress={() => setYolcuId(y.id)}
                      />
                    ))}
                  </ScrollView>
                )}
                {err ? <Banner text={'⚠️ ' + err} tone="red" /> : null}
                <View style={{ marginTop: 12 }}>
                  <Button
                    title={koltuk ? `${koltuk} No'lu Koltuğu Satın Al` : 'Koltuk Seçin'}
                    onPress={satinAl}
                    loading={loading}
                    disabled={!koltuk}
                  />
                </View>
              </>
            ) : (
              <Text style={styles.meta}>Koltuk haritası yükleniyor...</Text>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  lbl: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 6, marginTop: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  firma: { fontSize: 15, fontWeight: '800', color: colors.text },
  saat: { fontSize: 22, fontWeight: '800', color: colors.text },
  rota: { fontSize: 14, color: colors.text, marginTop: 2 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  fiyat: { fontSize: 20, fontWeight: '900', color: colors.primary },
  koltuk: { fontSize: 12, color: colors.green, fontWeight: '600', marginTop: 2 },
  cacheBox: { padding: space.md, borderRadius: radius.md, marginBottom: space.md },
  cacheTitle: { fontSize: 16, fontWeight: '900', color: colors.text },
  cacheSub: { fontSize: 13, color: colors.text, marginTop: 4, fontWeight: '600' },
  cacheHint: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: space.lg,
    maxHeight: '92%',
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.text },
  close: { fontSize: 22, color: colors.textMuted, padding: 4 },
  pnr: { fontSize: 22, fontWeight: '900', color: colors.primary, letterSpacing: 2 },
});
