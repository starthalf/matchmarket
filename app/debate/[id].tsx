import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Heart,
  Send,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function DebateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  const [debate, setDebate] = useState<any>(null);
  const [votes, setVotes] = useState({ agree: 0, disagree: 0 });
  const [myVote, setMyVote] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [topComments, setTopComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pastDebates, setPastDebates] = useState<any[]>([]);
  
  useEffect(() => {
    if (id) {
      loadAll();
    }
  }, [id]);

  const loadAll = async () => {
    const timeout = (ms: number) => new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), ms)
    );
    
    try {
      await Promise.race([fetchDebate(), timeout(8000)]);
    } catch (e) {
      console.log('토론 로드 재시도...');
      try {
        await Promise.race([fetchDebate(), timeout(8000)]);
      } catch {
        console.error('토론 로드 실패');
      }
    }
    
    fetchComments();
    fetchPastDebates();
    if (user) {
      fetchMyVote();
      fetchMyLikes();
    }
  };

  const fetchDebate = async () => {
    const { data, error } = await supabase
      .from('daily_debates')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('토론 조회 오류:', error);
      return;
    }
    if (data) setDebate(data);

    const { data: voteData } = await supabase
      .from('debate_votes')
      .select('vote')
      .eq('debate_id', id);
    if (voteData) {
      setVotes({
        agree: voteData.filter((v: any) => v.vote === 'agree').length,
        disagree: voteData.filter((v: any) => v.vote === 'disagree').length,
      });
    }
  };

  const fetchMyVote = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('debate_votes')
      .select('vote')
      .eq('debate_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setMyVote(data.vote);
  };

 

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('debate_comments')
      .select('*')
      .eq('debate_id', id)
      .order('created_at', { ascending: true });

    if (error || !data) return;

    const parents = data.filter((c: any) => !c.parent_id);
    const withReplies = parents.map((parent: any) => ({
      ...parent,
      replies: data.filter((c: any) => c.parent_id === parent.id),
    }));
    setComments(withReplies);

    const sorted = [...parents].sort((a, b) => b.like_count - a.like_count);
    setTopComments(sorted.slice(0, 3).filter((c: any) => c.like_count > 0));
  };

  const fetchMyLikes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('debate_comment_likes')
      .select('comment_id')
      .eq('user_id', user.id);
    if (data) {
      setLikedComments(new Set(data.map((l: any) => l.comment_id)));
    }
  };

const fetchPastDebates = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_debates')
      .select('*')
      .neq('id', id)
      .lte('display_date', today)
      .order('display_date', { ascending: false })
      .limit(10);
    if (data) setPastDebates(data);
  };

  const handleVote = async (vote: 'agree' | 'disagree') => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (myVote) return;

    const { error } = await supabase.from('debate_votes').insert({
      debate_id: id,
      user_id: user.id,
      vote,
    });

    if (!error) {
      setMyVote(vote);
      setVotes(prev => ({ ...prev, [vote]: prev[vote] + 1 }));
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const { error } = await supabase.from('debate_comments').insert({
      debate_id: id,
      user_id: user.id,
      content: newComment.trim(),
      parent_id: replyTo?.id || null,
    });

    if (!error) {
      setNewComment('');
      setReplyTo(null);
      await fetchComments();
    }
    setIsSubmitting(false);
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const alreadyLiked = likedComments.has(commentId);

    if (alreadyLiked) {
      await supabase
        .from('debate_comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);
      setLikedComments(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    } else {
      await supabase.from('debate_comment_likes').insert({
        comment_id: commentId,
        user_id: user.id,
      });
      setLikedComments(prev => new Set(prev).add(commentId));
    }
    await fetchComments();
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  if (!debate) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#0d0c22" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>오늘의 토론</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const total = votes.agree + votes.disagree;
  const agreePercent = total > 0 ? Math.round((votes.agree / total) * 100) : 50;
  const disagreePercent = total > 0 ? 100 - agreePercent : 50;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#0d0c22" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>오늘의 토론</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView ref={scrollRef} style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 토론 주제 카드 */}
        <View style={styles.debateCard}>
          <Text style={styles.dateLabel}>{debate.display_date}</Text>
          <Text style={styles.questionText}>"{debate.question}"</Text>

         {myVote ? (
            <View style={styles.resultContainer}>
              <View style={styles.resultBarWrapper}>
                {agreePercent > 0 && (
                  <View style={[styles.resultBarAgree, { flex: agreePercent }]}>
                    <Text style={styles.resultBarText}>👍 찬성 {agreePercent}%</Text>
                  </View>
                )}
                {disagreePercent > 0 && (
                  <View style={[styles.resultBarDisagree, { flex: disagreePercent, backgroundColor: '#ef4444' }]}>
                    <Text style={styles.resultBarText}>👎 반대 {disagreePercent}%</Text>
                  </View>
                )}
              </View>
              <Text style={styles.totalVotes}>{total}명 참여</Text>
            </View>
          ) : (
            <View style={styles.voteButtons}>
              <TouchableOpacity style={styles.agreeBtn} onPress={() => handleVote('agree')}>
                <ThumbsUp size={20} color="#22c55e" />
                <Text style={styles.agreeBtnText}>찬성</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.disagreeBtn} onPress={() => handleVote('disagree')}>
                <ThumbsDown size={20} color="#ef4444" />
                <Text style={styles.disagreeBtnText}>반대</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* TOP 댓글 */}
        {topComments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 인기 댓글 TOP {topComments.length}</Text>
            {topComments.map((comment, index) => (
              <View key={comment.id} style={styles.topCommentCard}>
                <View style={styles.topBadge}>
                  <Text style={styles.topBadgeText}>{index + 1}</Text>
                </View>
                <View style={styles.topCommentContent}>
                 <Text style={styles.commentAuthor}>익명</Text>
                  <Text style={styles.commentText}>{comment.content}</Text>
                  <View style={styles.commentMeta}>
                    <Heart size={12} color="#ef4444" fill="#ef4444" />
                    <Text style={styles.likeCount}>{comment.like_count}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 전체 댓글 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 댓글 {comments.length}개</Text>

          {comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <Text style={styles.emptyText}>아직 댓글이 없어요. 첫 번째 의견을 남겨보세요!</Text>
            </View>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>익명</Text>
                  <Text style={styles.commentTime}>{formatDate(comment.created_at)}</Text>
                </View>
                <Text style={styles.commentText}>{comment.content}</Text>
                <View style={styles.commentActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(comment.id)}>
                    <Heart
                      size={14}
                      color={likedComments.has(comment.id) ? '#ef4444' : '#9ca3af'}
                      fill={likedComments.has(comment.id) ? '#ef4444' : 'none'}
                    />
                    <Text style={[styles.actionText, likedComments.has(comment.id) && styles.actionTextActive]}>
                      {comment.like_count}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => setReplyTo(comment)}>
                    <MessageCircle size={14} color="#9ca3af" />
                    <Text style={styles.actionText}>답글</Text>
                  </TouchableOpacity>
                  {comment.replies?.length > 0 && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => toggleReplies(comment.id)}>
                      {expandedReplies.has(comment.id) ? (
                        <ChevronUp size={14} color="#6b7280" />
                      ) : (
                        <ChevronDown size={14} color="#6b7280" />
                      )}
                      <Text style={styles.actionText}>답글 {comment.replies.length}개</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {expandedReplies.has(comment.id) && comment.replies?.map((reply: any) => (
                  <View key={reply.id} style={styles.replyCard}>
                    <View style={styles.commentHeader}>
                     <Text style={styles.commentAuthor}>익명</Text>
                      <Text style={styles.commentTime}>{formatDate(reply.created_at)}</Text>
                    </View>
                    <Text style={styles.commentText}>{reply.content}</Text>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(reply.id)}>
                      <Heart
                        size={12}
                        color={likedComments.has(reply.id) ? '#ef4444' : '#9ca3af'}
                        fill={likedComments.has(reply.id) ? '#ef4444' : 'none'}
                      />
                      <Text style={[styles.actionText, likedComments.has(reply.id) && styles.actionTextActive]}>
                        {reply.like_count}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        {/* 과거 토론 */}
        {pastDebates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 지난 토론</Text>
            {pastDebates.map((past) => (
              <TouchableOpacity
                key={past.id}
                style={styles.pastCard}
                onPress={() => router.push(`/debate/${past.id}`)}
              >
                <Text style={styles.pastDate}>{past.display_date}</Text>
                <Text style={styles.pastQuestion} numberOfLines={1}>{past.question}</Text>
                <ChevronRight size={14} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 댓글 입력 */}
      <View style={styles.inputBar}>
        {replyTo && (
          <View style={styles.replyIndicator}>
            <Text style={styles.replyIndicatorText}>
              익명에게 답글
            </Text>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <Text style={styles.replyCancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder={user ? "의견을 남겨보세요..." : "로그인 후 댓글을 남길 수 있어요"}
            placeholderTextColor="#9ca3af"
            value={newComment}
            onChangeText={setNewComment}
            editable={!!user}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!newComment.trim() || isSubmitting) && styles.sendBtnDisabled]}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || isSubmitting}
          >
            <Send size={18} color={newComment.trim() && !isSubmitting ? '#fff' : '#9ca3af'} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#9ca3af' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 15, fontWeight: '500', color: '#0d0c22', letterSpacing: -0.3 },
  scrollView: { flex: 1 },
  debateCard: {
    backgroundColor: '#fdf2f8',
    margin: 16,
    padding: 32,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#ea4c89',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0d0c22',
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: -0.5,
  },
  voteButtons: { flexDirection: 'row', gap: 10 },
  agreeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1.5,
    borderColor: '#dcfce7',
    gap: 6,
  },
  disagreeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1.5,
    borderColor: '#fecaca',
    gap: 6,
  },
  agreeBtnText: { fontSize: 15, fontWeight: '600', color: '#16a34a' },
  disagreeBtnText: { fontSize: 15, fontWeight: '600', color: '#dc2626' },
  resultContainer: { gap: 10 },
  resultBarWrapper: {
    flexDirection: 'row',
    borderRadius: 22,
    overflow: 'hidden',
    height: 44,
    backgroundColor: '#f3f4f6',
  },
  resultBarAgree: {
    backgroundColor: '#22c55e',
    borderRadius: 22,
    justifyContent: 'center',
    paddingLeft: 16,
  },
  resultBarDisagree: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  resultBarText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  totalVotes: { fontSize: 12, color: '#9ca3af', textAlign: 'center' },
  section: { paddingHorizontal: 16, marginBottom: 14 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0d0c22',
    marginBottom: 10,
  },
  topCommentCard: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 6,
    gap: 12,
    alignItems: 'flex-start',
  },
  topBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  topCommentContent: { flex: 1 },
  commentCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAuthor: { fontSize: 13, fontWeight: '500', color: '#374151' },
  commentTime: { fontSize: 11, color: '#bbb' },
  commentText: { fontSize: 14, color: '#1f2937', lineHeight: 21, marginBottom: 10 },
  commentActions: { flexDirection: 'row', gap: 14 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 11, color: '#d1d5db' },
  actionTextActive: { color: '#ef4444' },
  likeCount: { fontSize: 11, color: '#9ca3af' },
  replyCard: {
    marginLeft: 20,
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#e5e7eb',
    paddingVertical: 8,
  },
  emptyComments: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, color: '#9ca3af' },
  pastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
    gap: 10,
  },
  pastDate: { fontSize: 11, color: '#9ca3af', minWidth: 48 },
  pastQuestion: { flex: 1, fontSize: 13, fontWeight: '500', color: '#374151' },
  inputBar: {
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  replyIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  replyIndicatorText: { fontSize: 12, color: '#ea4c89', fontWeight: '600' },
  replyCancelText: { fontSize: 12, color: '#9ca3af' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  commentInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0d0c22',
    maxHeight: 80,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ea4c89',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#e5e7eb' },
});