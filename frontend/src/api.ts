// ============================================================================
//  API istemcisi — Backend (FastAPI) ile tüm haberleşme buradan geçer.
//  Her istek, ekranın altındaki "API Log" çubuğuna kaydedilir; böylece
//  mobil uygulamadan REST API'ye giden istek videoda NET olarak görünür.
// ============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type ApiLog = {
  method: string;
  path: string;
  status: number;
  ms: number;
  cache: string | null;
  ok: boolean;
  time: string;
};

// Android emülatöründe host makineye 10.0.2.2 ile erişilir; web/iOS'ta localhost.
const DEFAULT_BASE =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

let baseUrl = DEFAULT_BASE;
let logger: ((l: ApiLog) => void) | null = null;

function qs(params: Record<string, string | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export const api = {
  getBase: () => baseUrl,
  defaultBase: () => DEFAULT_BASE,

  async setBase(b: string) {
    baseUrl = b.replace(/\/+$/, '');
    await AsyncStorage.setItem('apiBase', baseUrl);
  },
  async loadBase() {
    const saved = await AsyncStorage.getItem('apiBase');
    if (saved) baseUrl = saved;
    return baseUrl;
  },
  onLog(fn: (l: ApiLog) => void) {
    logger = fn;
  },

  async request(method: string, path: string, body?: any): Promise<any> {
    const t0 = Date.now();
    const url = baseUrl + path;
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e: any) {
      logger?.({ method, path, status: 0, ms: Date.now() - t0, cache: null, ok: false, time: nowStr() });
      throw new Error(`Bağlantı kurulamadı: ${url}\n(Ayarlar'dan API adresini kontrol edin)`);
    }
    const ms = Date.now() - t0;
    const cache = res.headers.get('X-Cache');
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    logger?.({ method, path, status: res.status, ms, cache, ok: res.ok, time: nowStr() });
    if (!res.ok) {
      const detail = data?.detail ?? res.statusText;
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
    return data;
  },

  // Yüksek seviye yardımcılar
  sehirler() {
    return this.request('GET', '/api/sehirler');
  },
  seferler(f: { kalkis?: string; varis?: string; tarih?: string } = {}) {
    return this.request('GET', `/api/seferler${qs(f)}`);
  },
  seferDetay(id: string) {
    return this.request('GET', `/api/seferler/${id}`);
  },
  yeniSefer(b: any) {
    return this.request('POST', '/api/seferler', b);
  },
  yolcular() {
    return this.request('GET', '/api/yolcular');
  },
  yeniYolcu(b: any) {
    return this.request('POST', '/api/yolcular', b);
  },
  biletler() {
    return this.request('GET', '/api/biletler');
  },
  biletAl(b: any) {
    return this.request('POST', '/api/biletler', b);
  },
  biletIptal(id: string) {
    return this.request('DELETE', `/api/biletler/${id}`);
  },
  istatistik() {
    return this.request('GET', '/api/istatistik');
  },
  health() {
    return this.request('GET', '/health');
  },
};

function nowStr() {
  const d = new Date();
  const p = (n: number) => `${n}`.padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
