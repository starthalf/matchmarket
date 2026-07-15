import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Colors, IconStroke } from '../constants/theme';

export function DailyDebateMini() {
  const [debate, setDebate] = useState<any>(null);

  useEffect(() => {
    fetchTodayDebate();
  }, []);

  const fetchTodayDebate = async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data: debateData } = await supabase
      .from('daily_debates')
      .select('*')
      .lte('display_date', today)
      .order('display_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!debateData) return;
    setDebate(debateData);
  };

  if (!debate) {
    return (
      <View style={styles.container}>
        <View style={styles.topLine}>
          <Text style={styles.label}>🔥 토론</Text>
        </View>
        <Text style={styles.emptyText}>준비 중</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.7}
      onPress={() => router.push(`/debate/${debate.id}`)}
    >
      <View style={styles.topLine}>
        <Text style={styles.label}>🔥 토론</Text>
        <ChevronRight size={13} color={Colors.textTertiary} strokeWidth={IconStroke} />
      </View>

      <Text style={styles.question} numberOfLines={1} ellipsizeMode="tail">
        {debate.question}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    gap: 3,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.1,
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: -0.1,
    color: Colors.textTertiary,
  },
  question: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 16,
    color: Colors.text,
  },
});
