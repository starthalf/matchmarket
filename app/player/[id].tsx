import React, { useState } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react-native';
import { mockUsers } from '../../data/mockData';
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
        {/* 배경 원 */}
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
        {/* 축 선 */}
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
        {/* 데이터 영역 */}
        <Polygon
          points={polygonPoints}
          fill="rgba(74, 222, 128, 0.3)"
          stroke="#22c55e"
          strokeWidth={2}
        />
        {/* 라벨 */}
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
        {/* 중앙 평균 점수 */}
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
function CommentSection({ playerId }: { playerId: string }) {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([
    { id: '1', user: '테니스러버', text: '같이 한번만 쳐주세요!!', avatar: null },
    { id: '2', user: '초보탈출', text: '저도 꼭 같이 치고싶어요!', avatar: null },
  ]);

  const handleSend = () => {
    if (!comment.trim()) return;
    setComments([
      ...comments,
      { id: Date.now().toString(), user: '나', text: comment, avatar: null }
    ]);
    setComment('');
  };

  return (
    <View style={styles.commentSection}>
      <Text style={styles.sectionTitle}>소통</Text>
      {comments.map(c => (
        <View key={c.id} style={styles.commentItem}>
          <View style={styles.commentAvatar}>
            <Text style={styles.commentAvatarText}>{c.user[0]}</Text>
          </View>
          <Text style={styles.commentText}>
            {c.text.includes('치고싶어요') ? (
              <>
                {c.text.split('치고싶어요')[0]}
                <Text style={styles.highlight}>치고싶어요</Text>
                {c.text.split('치고싶어요')[1]}
              </>
            ) : c.text}
          </Text>
        </View>
      ))}
      <View style={styles.commentInput}>
        <TextInput
          style={styles.input}
          placeholder="응원 메시지를 남겨주세요"
          value={comment}
          onChangeText={setComment}
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
          <Send size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = mockUsers.find(u => u.id === id);
  
  // 매치요청 카운트 상태
  const [requestCount, setRequestCount] = useState(999);
  const [hasRequested, setHasRequested] = useState(false);
  
  // 더미 스탯 데이터
  const playerStats = {
    serve: 4.2,
    return: 3.8,
    forehand: 4.5,
    backhand: 4.0,
    volley: 3.5,
    footwork: 4.8,
    stamina: 4.3,
    mental: 4.6,
  };

  // 매치요청 버튼 핸들러
  const handleMatchRequest = () => {
    if (hasRequested) {
      // 이미 요청한 경우 취소
      setRequestCount(prev => prev - 1);
      setHasRequested(false);
      if (Platform.OS === 'web') {
        window.alert('매치요청을 취소했습니다.');
      }
    } else {
      // 새로 요청
      setRequestCount(prev => prev + 1);
      setHasRequested(true);
      if (Platform.OS === 'web') {
        window.alert('매치요청을 보냈습니다! 상대방이 매치를 열면 알림을 받게 됩니다.');
      }
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text>플레이어를 찾을 수 없습니다</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>돌아가기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 뒤로가기 */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>

        {/* 매치요청 버튼 */}
        <View style={styles.requestBtnContainer}>
          <TouchableOpacity 
            style={[
              styles.requestBtn,
              hasRequested && styles.requestBtnActive
            ]}
            onPress={handleMatchRequest}
          >
            <Text style={[
              styles.requestBtnText,
              hasRequested && styles.requestBtnTextActive
            ]}>
              매치요청 {requestCount}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          {user.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.profilePlaceholder]} />
          )}
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.name}</Text>
            <CheckCircle size={18} color="#22c55e" />
            <View style={styles.ntrpBadge}>
              <Text style={styles.ntrpText}>🎾</Text>
            </View>
          </View>
        </View>

        {/* 레이더 차트 */}
        <RadarChart stats={playerStats} />

        {/* 주요 입상&경력 */}
        <View style={styles.careerSection}>
          <Text style={styles.sectionTitle}>주요 입상&경력</Text>
          <View style={styles.careerBox}>
            <Text style={styles.careerText}>
              {user.careerType === '선수' 
                ? '• 전국체전 우승\n• 실업팀 5년 경력' 
                : '등록된 경력이 없습니다'}
            </Text>
          </View>
        </View>

        {/* 소통 (댓글) */}
        <CommentSection playerId={id || ''} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  backLink: { 
    color: '#ea4c89', 
    marginTop: 10 
  },
  backBtn: { 
    position: 'absolute', 
    top: 16, 
    left: 16, 
    zIndex: 10 
  },
  requestBtnContainer: { 
    alignItems: 'center', 
    marginTop: 50, 
    marginBottom: 16 
  },
  requestBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ea4c89',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
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
  ntrpBadge: {
    backgroundColor: '#ec4899',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ntrpText: { 
    fontSize: 12 
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
    marginBottom: 30 
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
    minHeight: 80,
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
  highlight: { 
    color: '#ea4c89', 
    textDecorationLine: 'underline' 
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