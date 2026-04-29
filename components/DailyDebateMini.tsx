import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MessageCircle, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export function DailyDebateMini() {
  const [debate, setDebate] = useState<any>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

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
      .single();

    if (!debateData) return;
    setDebate(debateData);

    const { count: votes } = await supabase
      .from('debate_votes')
      .select('*', { count: 'exact', head: true })
      .eq('debate_id', debateData.id);
    setVoteCount(votes || 0);

    const { count: comments } = await supabase
      .from('debate_comments')
      .select('*', { count: 'exact', head: true })
      .eq('debate_id', debateData.id);
    setCommentCount(comments || 0);
  };

  if (!debate) {
    return (
      <TouchableOpacity style={styles.container} activeOpacity={1}>
        <Text style={styles.label}>🔥 토론</Text>
        <Text style={styles.emptyText}>준비 중...</Text>
      </TouchableOpacity>
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
        <ChevronRight size={12} color="#9ca3af" />
      </View>
      <Text style={styles.question} numberOfLines={1}>
        {debate.question}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ea4c89',
  },
  emptyText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  question: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0d0c22',
    lineHeight: 16,
  },
});