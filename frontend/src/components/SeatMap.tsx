// Koltuk haritası — dolu/boş/seçili koltukları gösterir
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

export function SeatMap({
  total,
  taken,
  selected,
  onSelect,
}: {
  total: number;
  taken: number[];
  selected: number | null;
  onSelect: (n: number) => void;
}) {
  const rows: number[][] = [];
  for (let i = 1; i <= total; i += 4) {
    rows.push([i, i + 1, i + 2, i + 3].filter((n) => n <= total));
  }

  const seat = (n: number) => {
    const isTaken = taken.includes(n);
    const isSel = selected === n;
    const bg = isTaken ? colors.seatTaken : isSel ? colors.seatSelected : colors.seatFree;
    return (
      <Pressable
        key={n}
        disabled={isTaken}
        onPress={() => onSelect(n)}
        style={[styles.seat, { backgroundColor: bg }]}
      >
        <Text style={[styles.seatNo, { color: isTaken || isSel ? '#fff' : colors.text }]}>{n}</Text>
      </Pressable>
    );
  };

  return (
    <View>
      <View style={styles.legendRow}>
        <Legend color={colors.seatFree} label="Boş" />
        <Legend color={colors.seatSelected} label="Seçili" />
        <Legend color={colors.seatTaken} label="Dolu" />
      </View>
      <View style={styles.bus}>
        {rows.map((row, ri) => (
          <View key={ri} style={styles.row}>
            <View style={styles.pair}>
              {row[0] != null && seat(row[0])}
              {row[1] != null && seat(row[1])}
            </View>
            <View style={styles.aisle} />
            <View style={styles.pair}>
              {row[2] != null && seat(row[2])}
              {row[3] != null && seat(row[3])}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendBox, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bus: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 10,
    backgroundColor: '#FAFAFA',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  pair: { flexDirection: 'row' },
  aisle: { width: 28 },
  seat: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  seatNo: { fontSize: 13, fontWeight: '700' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12, gap: 16 },
  legend: { flexDirection: 'row', alignItems: 'center' },
  legendBox: { width: 16, height: 16, borderRadius: 4, marginRight: 6 },
  legendLabel: { fontSize: 12, color: colors.textMuted },
});
