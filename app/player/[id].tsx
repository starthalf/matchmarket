import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  SafeAreaView,
  TextInput,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Send, CheckCircle, Edit2 } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

// 레이더 차트 컴포넌트
function RadarChart({ stats }: { stats: Record<string, number> }) {
  const size = width - 80;
  const center = size / 2;
  const radius = size * 0.35;
  const labels = ['서브', '리턴', '포핸드', '백핸드', '발리', '풋워크', '체력', '멘탈'];
  const values = Object.values(stats);
  const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / labels.length - Math.PI / 2;
    const r = (value / 5) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const points = values.map((v, i) => getPoint(i, v));
  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.indexTitle}>Index</Text>
      <Svg width={size} height={size}>
        {[1, 2, 3, 4, 5].map(level => (
          <Circle
            key={level}
            cx={center}
            cy={center}
            r={(level / 5) * radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        ))}
        {labels.map((_, i) => {
          const point = getPoint(i, 5);
          return (
            <Line
              key={i}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
          );
        })}
        <Polygon
          points={polygonPoints}
          fill="rgba(74, 222, 128, 0.3)"
          stroke="#22c55e"
          strokeWidth={2}
        />
        {labels.map((label, i) => {
          const point = getPoint(i, 6);
          return (
            <SvgText
              key={label}
              x={point.x}
              y={point.y}
              fontSize={12}
              fill="#6b7280"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {label}
            </SvgText>
          );
        })}
        <SvgText
          x={center}
          y={center}
          fontSize={24}
          fontWeight="bold"
          fill="#22c55e"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {avg}
        </SvgText>
      </Svg>
    </View>
  );
}

// 댓글 컴포넌트
function CommentSection({ profileId, currentUserId }: { profileId: string; currentUserId?: string }) {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [profileId]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('player_comments')
      .select('*')
      .eq('player_profile_id', profileId)
      .order('created_at', { ascending: true });

    if (data) {
      setComments(data);
    }
  };

  const handleSend = async () => {
    if (!comment.trim() || !currentUserId) {
      if (!currentUserId && Platform.OS === 'web') {
        window.alert('로그인이 필요합니다.');
      }
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('player_comments')
        .insert({
          player_profile_id: profileId,
          user_id: currentUserId,
          user_name: '익명', // 실제로는 유저 이름 가져오기
          content: comment.trim(),
        })
        .select()
        .single();

      if (data) {
        setComments([...comments, data]);
        setComment('');
      }
    } catch (error) {
      console.error('댓글 작성 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.commentSection}>
      <Text style={styles.sectionTitle}>소통</Text>
      {comments.map(c => (
        <View key={c.id} style={styles.commentItem}>
          <View style={styles.commentAvatar}>
            <Text style={styles.commentAvatarText}>{c.user_name?.[0] || '?'}</Text>
          </View>
          <Text style={styles.commentText}>{c.content}</Text>
        </View>
      ))}
      <View style={styles.commentInput}>
        <TextInput
          style={styles.input}
          placeholder={currentUserId ? "응원 메시지를 남겨주세요" : "로그인 후 댓글을 작성할 수 있습니다"}
          value={comment}
          onChangeText={setComment}
          editable={!!currentUserId}
        />
        <TouchableOpacity 
          onPress={handleSend} 
          style={styles.sendBtn}
          disabled={loading || !currentUserId}
        >
          <Send size={20} color={currentUserId ? "#ea4c89" : "#9ca3af"} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasRequested, setHasRequested] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProfile();
      checkMatchRequest();
      incrementViewCount();
    }
  }, [id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('프로필 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMatchRequest = async () => {
    if (!user?.id) return;
    
    const { data } = await supabase
      .from('player_match_requests')
      .select('id')
      .eq('player_profile_id', id)
      .eq('requester_id', user.id)
      .single();

    setHasRequested(!!data);
  };

  const incrementViewCount = async () => {
    await supabase.rpc('increment_player_view_count', { profile_id: id });
  };

  const handleMatchRequest = async () => {
    if (!user?.id) {
      if (Platform.OS === 'web') {
        window.alert('로그인이 필요합니다.');
      }
      router.push('/auth/login');
      return;
    }

    setRequestLoading(true);
    try {
      if (hasRequested) {
        // 요청 취소
        await supabase
          .from('player_match_requests')
          .delete()
          .eq('player_profile_id', id)
          .eq('requester_id', user.id);

        setHasRequested(false);
        setProfile((prev: any) => ({
          ...prev,
          match_request_count: Math.max(0, (prev?.match_request_count || 1) - 1)
        }));

        if (Platform.OS === 'web') {
          window.alert('매치요청을 취소했습니다.');
        }
      } else {
        // 새 요청
        await supabase
          .from('player_match_requests')
          .insert({
            player_profile_id: id,
            requester_id: user.id,
          });

        setHasRequested(true);
        setProfile((prev: any) => ({
          ...prev,
          match_request_count: (prev?.match_request_count || 0) + 1
        }));

        if (Platform.OS === 'web') {
          window.alert('매치요청을 보냈습니다! 상대방이 매치를 열면 알림을 받게 됩니다.');
        }
      }
    } catch (error: any) {
      console.error('매치 요청 오류:', error);
      if (Platform.OS === 'web') {
        window.alert(`오류: ${error.message}`);
      }
    } finally {
      setRequestLoading(false);
    }
  };

  const isOwnProfile = user?.id === profile?.user_id;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea4c89" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>플레이어를 찾을 수 없습니다</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>돌아가기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const playerStats = {
    serve: profile.skill_serve || 3,
    return: profile.skill_return || 3,
    forehand: profile.skill_forehand || 3,
    backhand: profile.skill_backhand || 3,
    volley: profile.skill_volley || 3,
    footwork: profile.skill_footwork || 3,
    stamina: profile.skill_stamina || 3,
    mental: profile.skill_mental || 3,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          {isOwnProfile && (
            <TouchableOpacity 
              onPress={() => router.push('/player/create')}
              style={styles.editBtn}
            >
              <Edit2 size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* 매치요청 버튼 */}
        {!isOwnProfile && (
          <View style={styles.requestBtnContainer}>
            <TouchableOpacity 
              style={[
                styles.requestBtn,
                hasRequested && styles.requestBtnActive
              ]}
              onPress={handleMatchRequest}
              disabled={requestLoading}
            >
              {requestLoading ? (
                <ActivityIndicator size="small" color={hasRequested ? "#fff" : "#ea4c89"} />
              ) : (
                <Text style={[
                  styles.requestBtnText,
                  hasRequested && styles.requestBtnTextActive
                ]}>
                  매치요청 {profile.match_request_count || 0}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          {profile.profile_image ? (
            <Image source={{ uri: profile.profile_image }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.profilePlaceholder]} />
          )}
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.nickname}</Text>
            <CheckCircle size={18} color="#22c55e" />
          </View>
          <Text style={styles.viewCount}>조회수 {profile.view_count || 0}</Text>
        </View>

        {/* 레이더 차트 */}
        <RadarChart stats={playerStats} />

        {/* 주요 입상&경력 */}
        <View style={styles.careerSection}>
          <Text style={styles.sectionTitle}>주요 입상&경력</Text>
          <View style={styles.careerBox}>
            <Text style={styles.careerText}>
              {profile.career || '등록된 경력이 없습니다'}
            </Text>
          </View>
        </View>

        {/* 자기소개 */}
        {profile.introduction && (
          <View style={styles.careerSection}>
            <Text style={styles.sectionTitle}>자기소개</Text>
            <View style={styles.careerBox}>
              <Text style={styles.careerText}>{profile.introduction}</Text>
            </View>
          </View>
        )}

        {/* 소통 (댓글) */}
        <CommentSection profileId={id || ''} currentUserId={user?.id} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  backLink: { 
    color: '#ea4c89', 
    marginTop: 10,
    fontSize: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { 
    padding: 4,
  },
  editBtn: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  requestBtnContainer: { 
    alignItems: 'center', 
    marginBottom: 16 
  },
  requestBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ea4c89',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 140,
    alignItems: 'center',
  },
  requestBtnActive: {
    backgroundColor: '#ea4c89',
  },
  requestBtnText: { 
    color: '#ea4c89', 
    fontSize: 16, 
    fontWeight: '700' 
  },
  requestBtnTextActive: {
    color: '#fff',
  },
  profileSection: { 
    alignItems: 'center', 
    marginBottom: 20 
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  profilePlaceholder: { 
    backgroundColor: '#e5e7eb' 
  },
  nameRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  name: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#111827' 
  },
  viewCount: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  chartContainer: { 
    paddingHorizontal: 40, 
    marginBottom: 30 
  },
  indexTitle: { 
    fontSize: 14, 
    color: '#6b7280', 
    marginBottom: 10 
  },
  careerSection: { 
    paddingHorizontal: 20, 
    marginBottom: 24 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#111827', 
    marginBottom: 12 
  },
  careerBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    minHeight: 60,
  },
  careerText: { 
    fontSize: 14, 
    color: '#374151', 
    lineHeight: 22 
  },
  commentSection: { 
    paddingHorizontal: 20, 
    marginBottom: 40 
  },
  commentItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    gap: 10 
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#6b7280' 
  },
  commentText: { 
    fontSize: 14, 
    color: '#374151', 
    flex: 1 
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  input: { 
    flex: 1, 
    paddingVertical: 12, 
    fontSize: 14 
  },
  sendBtn: { 
    padding: 8 
  },
});