// Ekranın altında sabit duran "API Log" çubuğu.
// Mobil uygulamadan REST API'ye giden SON isteği canlı gösterir
// (metot, yol, HTTP durumu, süre, Redis cache HIT/MISS).
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ApiLog } from '../api';
import { colors } from '../theme';

export function ApiLogBar({ log }: { log: ApiLog | null }) {
  if (!log) {
    return (
      <View style={styles.bar}>
        <Text style={styles.idle}>📡 API Log — henüz istek yok</Text>
      </View>
    );
  }
  const okColor = log.status === 0 ? colors.red : log.ok ? '#4ADE80' : '#FCA5A5';
  return (
    <View style={styles.bar}>
      <Text style={styles.label}>📡 API →</Text>
      <Text style={[styles.method]}>{log.method}</Text>
      <Text style={styles.path} numberOfLines={1}>
        {log.path}
      </Text>
      <Text style={[styles.status, { color: okColor }]}>
        {log.status === 0 ? 'ERR' : log.status}
      </Text>
      <Text style={styles.ms}>{log.ms}ms</Text>
      {log.cache ? (
        <Text style={[styles.cache, { color: log.cache === 'HIT' ? '#4ADE80' : '#FCD34D' }]}>
          {log.cache === 'HIT' ? '⚡HIT' : 'MISS'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  idle: { color: '#9CA3AF', fontSize: 12, fontFamily: 'monospace' },
  label: { color: '#9CA3AF', fontSize: 12, fontFamily: 'monospace' },
  method: { color: '#FBBF24', fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
  path: { color: '#E5E7EB', fontSize: 12, flex: 1, fontFamily: 'monospace' },
  status: { fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
  ms: { color: '#9CA3AF', fontSize: 12, fontFamily: 'monospace' },
  cache: { fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
});
