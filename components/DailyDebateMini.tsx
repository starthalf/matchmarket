import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function DailyDebateMini() {
  const { user } = useAuth();
  const [debate, setDebate] = useState<any>(null);
  const [votes, setVotes] = useState({ agree: 0, disagree: 0 });
  const [myVote, setMyVote] = useState<string | null>(null);
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

    const { data: voteData } = await supabase
      .from('debate_votes')
      .select('vote')
      .eq('debate_id', debateData.id);

    if (voteData) {
      setVotes({
        agree: voteData.filter((v: any) => v.vote === 'agree').length,
        disagree: voteData.filter((v: any) => v.vote === 'disagree').length,
      });
    }

    if (user) {
      const { data: myVoteData } = await supabase
        .from('debate_votes')
        .select('vote')
        .eq('debate_id', debateData.id)
        .eq('user_id', user.id)
        .single();
      if (myVoteData) setMyVote(myVoteData.vote);
    }

    const { count } = await supabase
      .from('debate_comments')
      .select('*', { count: 'exact', head: true })
      .eq('debate_id', debateData.id);
    setCommentCount(count || 0);
  };

  const handleVote = async (vote: 'agree' | 'disagree') => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!debate || myVote) return;

    const { error } = await supabase.from('debate_votes').insert({
      debate_id: debate.id,
      user_id: user.id,
      vote,
    });

    if (!error) {
      setMyVote(vote);
      setVotes(prev => ({ ...prev, [vote]: prev[vote] + 1 }));
    }
  };

  if (!debate) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>🔥 토론</Text>
        <Text style={styles.emptyText}>준비 중...</Text>
      </View>
    );
  }

  const total = votes.agree + votes.disagree;
  const agreePercent = total > 0 ? Math.round((votes.agree / total) * 100) : 50;

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.8}
      onPress={() => router.push(`/debate/${debate.id}`)}
    >
      <Text style={styles.label}>🔥 토론</Text>

      <Text style={styles.question} numberOfLines={2}>
        {debate.question}
      </Text>

      {myVote ? (
        <View style={styles.resultRow}>
          <Text style={styles.resultText}>👍 {agreePercent}%</Text>
          <View style={styles.miniBar}>
            <View style={[styles.miniBarFill, { flex: agreePercent }]} />
            <View style={[styles.miniBarEmpty, { flex: 100 - agreePercent }]} />
          </View>
          <Text style={styles.resultText}>👎 {100 - agreePercent}%</Text>
        </View>
      ) : (
        <View style={styles.voteRow}>
          <TouchableOpacity
            style={styles.agreeBtn}
            onPress={() => handleVote('agree')}
          >
            <ThumbsUp size={12} color="#22c55e" />
            <Text style={styles.agreeText}>찬성</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.disagreeBtn}
            onPress={() => handleVote('disagree')}
          >
            <ThumbsDown size={12} color="#ef4444" />
            <Text style={styles.disagreeText}>반대</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <MessageCircle size={11} color="#9ca3af" />
        <Text style={styles.footerText}>{commentCount}</Text>
        <Text style={styles.footerText}>· {total}명</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ea4c89',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  question: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0d0c22',
    lineHeight: 18,
    marginBottom: 8,
  },
  voteRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  agreeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 3,
  },
  disagreeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 3,
  },
  agreeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  disagreeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  resultText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  miniBar: {
    flex: 1,
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniBarFill: {
    backgroundColor: '#22c55e',
  },
  miniBarEmpty: {
    backgroundColor: '#fecaca',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  footerText: {
    fontSize: 10,
    color: '#9ca3af',
  },
});