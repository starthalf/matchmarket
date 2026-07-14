import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Colors, Type, IconStroke } from '../constants/theme';

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
      .maybeSingle();

    if (!debateData) return;
    setDebate(debateData);

    const { count: realVotes } = await supabase
      .from('debate_votes')
      .select('*', { count: 'exact', head: true })
      .eq('debate_id', debateData.id);
    setVoteCount(
      (debateData.agree_count || 0) + (debateData.disagree_count || 0) + (realVotes || 0)
    );

    const { count: comments } = await supabase
      .from('debate_comments')
      .select('*', { count: 'exact', head: true })
      .eq('debate_id', debateData.id);
    setCommentCount(comments || 0);
  };

  if (!debate) {
    return (
      <View style={styles.container}>
        <View style={styles.topLine}>
          <View style={styles.labelWrap}>
            <View style={styles.liveDot} />
            <Text style={styles.label}>토론</Text>
          </View>
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
        <View style={styles.labelWrap}>
          <View style={styles.liveDot} />
          <Text style={styles.label}>토론</Text>
        </View>
        <ChevronRight size={13} color={Colors.textTertiary} strokeWidth={IconStroke} />
      </View>

    <Text style={styles.question} numberOfLines={1} ellipsizeMode="tail">
        {debate.question}
      </Text>

      {voteCount > 0 && (
        <Text style={styles.meta} numberOfLines={1}>
          {voteCount.toLocaleString()}명 참여
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
 container: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    gap: 2,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.accent,
  },
  label: {
    ...Type.micro,
    color: Colors.textSecondary,
    letterSpacing: -0.1,
  },
  emptyText: {
    ...Type.caption,
    fontWeight: '400',
    color: Colors.textTertiary,
  },
 question: {
    ...Type.caption,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 16,
  },
  meta: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: -0.1,
    color: Colors.textTertiary,
  },
});
