import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  UserRound, 
  Plus,
  Minus,
  Info
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useMatches } from '../../contexts/MatchContext';
import { Match, MatchApplication } from '../../types/tennis';
import { useSafeStyles } from '../../constants/Styles';

interface FormData {
  title: string;
  date: Date;
  time: Date;
  endTime: Date;
  court: string;
  description: string;
  basePrice: string;
  matchType: '단식' | '남복' | '여복' | '혼복';
  maleCount: string;
  femaleCount: string;
  adEnabled: boolean;
  ntrpMin: string;
  ntrpMax: string;
}

export default function RegisterScreen() {
  const { user } = useAuth();
  const { addMatch } = useMatches();
  const safeStyles = useSafeStyles();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    date: new Date(),
    time: (() => {
      const now = new Date();
      now.setHours(18, 0, 0, 0); // 기본 시간 오후 6시
      return now;
    })(),
    endTime: (() => {
      const now = new Date();
      now.setHours(20, 0, 0, 0); // 기본 종료 시간 오후 8시
      return now;
    })(),
    court: '',
    description: '',
    basePrice: '',
    matchType: '혼복',
    maleCount: '2',
    femaleCount: '2',
    adEnabled: false,
    ntrpMin: '3.0',
    ntrpMax: '4.5',
  });

  if (!user) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <View style={styles.loginPrompt}>
          <Plus size={48} color="#9ca3af" />
          <Text style={styles.loginPromptTitle}>로그인이 필요합니다</Text>
          <Text style={styles.loginPromptText}>
            매치를 등록하려면 로그인해주세요
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>로그인하기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatTime = (date: Date) => {
    return date.toTimeString().slice(0, 5);
  };

  const handleSubmit = async () => {
    // 유효성 검사
    if (!formData.title.trim()) {
      Alert.alert('입력 오류', '매치 제목을 입력해주세요.');
      return;
    }

    if (!formData.court.trim()) {
      Alert.alert('입력 오류', '테니스 코트를 입력해주세요.');
      return;
    }

    const basePriceNum = parseInt(formData.basePrice);
    if (isNaN(basePriceNum) || basePriceNum <= 0) {
      Alert.alert('입력 오류', '올바른 기본가격을 입력해주세요.');
      return;
    }

    const maleCountNum = parseInt(formData.maleCount);
    const femaleCountNum = parseInt(formData.femaleCount);
    const ntrpMinNum = parseFloat(formData.ntrpMin);
    const ntrpMaxNum = parseFloat(formData.ntrpMax);

    if (isNaN(maleCountNum) || isNaN(femaleCountNum) || maleCountNum < 0 || femaleCountNum < 0) {
      Alert.alert('입력 오류', '참가자 수를 올바르게 입력해주세요.');
      return;
    }

    if (maleCountNum + femaleCountNum === 0) {
      Alert.alert('입력 오류', '최소 1명 이상의 참가자가 필요합니다.');
      return;
    }

    if (isNaN(ntrpMinNum) || isNaN(ntrpMaxNum) || ntrpMinNum > ntrpMaxNum) {
      Alert.alert('입력 오류', 'NTRP 범위를 올바르게 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 새로운 매치 객체 생성
      const newMatchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newMatch: Match = {
        id: newMatchId,
        sellerId: user.id,
        seller: user,
        title: formData.title,
        date: formData.date.toISOString().split('T')[0],
        time: formatTime(formData.time),
        endTime: formatTime(formData.endTime),
        court: formData.court,
        description: formData.description || '매치에 대한 설명이 없습니다.',
        basePrice: basePriceNum,
        currentPrice: basePriceNum,
        maxPrice: Math.min(200000, basePriceNum * 3), // 최대 20만원
        expectedViews: Math.floor(Math.random() * 500) + 200,
        expectedParticipants: {
          male: maleCountNum,
          female: femaleCountNum,
          total: maleCountNum + femaleCountNum,
        },
        currentApplicants: {
          male: 0,
          female: 0,
          total: 0,
        },
        matchType: formData.matchType,
        applications: [], // 🆕 참여신청 목록 초기화
        participants: [],
        adEnabled: formData.adEnabled,
        ntrpRequirement: {
          min: ntrpMinNum,
          max: ntrpMaxNum,
        },
        weather: '맑음',
        location: '서울',
        createdAt: new Date().toISOString(),
        isClosed: false,
      };

      // MatchContext에 매치 추가
      const success = await addMatch(newMatch);

      if (success) {
        // 폼 초기화
        setFormData({
          title: '',
          date: new Date(),
          time: (() => {
            const now = new Date();
            now.setHours(18, 0, 0, 0);
            return now;
          })(),
          endTime: (() => {
            const now = new Date();
            now.setHours(20, 0, 0, 0);
            return now;
          })(),
          court: '',
          description: '',
          basePrice: '',
          matchType: '혼복',
          maleCount: '2',
          femaleCount: '2',
          adEnabled: false,
          ntrpMin: '3.0',
          ntrpMax: '4.5',
        });

        Alert.alert(
          '매치 등록 완료! 🎾',
          '매치가 성공적으로 등록되었습니다!\n간소화된 실시간 가격 시스템이 활성화됩니다.',
          [{ 
            text: '매치 보기', 
            onPress: () => {
              router.push(`/match/${newMatch.id}`);
            }
          }]
        );
      } else {
        Alert.alert('등록 실패', '매치 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('매치 등록 중 오류:', error);
      Alert.alert('등록 실패', '매치 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const adjustParticipantCount = (type: 'male' | 'female', increment: boolean) => {
    const currentValue = parseInt(type === 'male' ? formData.maleCount : formData.femaleCount);
    const newValue = Math.max(0, increment ? currentValue + 1 : currentValue - 1);
    
    setFormData({
      ...formData,
      [type === 'male' ? 'maleCount' : 'femaleCount']: newValue.toString()
    });
  };

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>매치 등록</Text>
        <Text style={styles.headerSubtitle}>새로운 테니스 매치를 등록하세요</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* 기본 정보 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>기본 정보</Text>
          
          {/* 매치 제목 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>매치 제목 *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.title}
              onChangeText={(text) => setFormData({...formData, title: text})}
              placeholder="예: 강남 프리미엄 복식 매치"
              placeholderTextColor="#9ca3af"
              maxLength={50}
            />
          </View>

          {/* 날짜 선택 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>날짜 *</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color="#6b7280" />
              <Text style={styles.dateButtonText}>
                {formData.date.toLocaleDateString('ko-KR')}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.date}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setFormData({...formData, date: selectedDate});
                  }
                }}
              />
            )}
          </View>

          {/* 시간 선택 */}
          <View style={styles.timeRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>시작 시간 *</Text>
              <TouchableOpacity 
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={20} color="#6b7280" />
                <Text style={styles.timeButtonText}>
                  {formatTime(formData.time)}
                </Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={formData.time}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(false);
                    if (selectedTime) {
                      setFormData({...formData, time: selectedTime});
                    }
                  }}
                />
              )}
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>종료 시간 *</Text>
              <TouchableOpacity 
                style={styles.timeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Clock size={20} color="#6b7280" />
                <Text style={styles.timeButtonText}>
                  {formatTime(formData.endTime)}
                </Text>
              </TouchableOpacity>
              {showEndTimePicker && (
                <DateTimePicker
                  value={formData.endTime}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowEndTimePicker(false);
                    if (selectedTime) {
                      setFormData({...formData, endTime: selectedTime});
                    }
                  }}
                />
              )}
            </View>
          </View>

          {/* 테니스 코트 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>테니스 코트 *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.court}
              onChangeText={(text) => setFormData({...formData, court: text})}
              placeholder="예: 강남구 테니스장 A코트"
              placeholderTextColor="#9ca3af"
              maxLength={100}
            />
          </View>

          {/* 기본가격 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>기본가격 (코트비 + 공값) *</Text>
            <View style={styles.priceInputContainer}>
              <TextInput
                style={styles.priceInput}
                value={formData.basePrice}
                onChangeText={(text) => setFormData({...formData, basePrice: text})}
                placeholder="25000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                maxLength={10}
              />
              <Text style={styles.priceUnit}>원</Text>
            </View>
            <Text style={styles.inputHint}>
              실제 지불할 코트비와 공값을 합산하여 입력해주세요
            </Text>
          </View>
        </View>

        {/* 매치 설정 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>매치 설정</Text>

          {/* 매치 타입 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>매치 타입 *</Text>
            <View style={styles.matchTypeGrid}>
              {(['단식', '남복', '여복', '혼복'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.matchTypeButton,
                    formData.matchType === type && styles.matchTypeButtonActive
                  ]}
                  onPress={() => setFormData({...formData, matchType: type})}
                >
                  <Text style={[
                    styles.matchTypeText,
                    formData.matchType === type && styles.matchTypeTextActive
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 모집 인원 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>모집 인원 *</Text>
            <View style={styles.participantContainer}>
              {/* 남성 인원 */}
              <View style={styles.participantItem}>
                <UserRound size={20} color="#3b82f6" />
                <Text style={styles.participantLabel}>남성</Text>
                <TouchableOpacity 
                  style={styles.countButton}
                  onPress={() => adjustParticipantCount('male', false)}
                >
                  <Minus size={16} color="#6b7280" />
                </TouchableOpacity>
                <TextInput
                  style={styles.participantInput}
                  value={formData.maleCount}
                  onChangeText={(text) => setFormData({...formData, maleCount: text})}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <TouchableOpacity 
                  style={styles.countButton}
                  onPress={() => adjustParticipantCount('male', true)}
                >
                  <Plus size={16} color="#6b7280" />
                </TouchableOpacity>
                <Text style={styles.participantUnit}>명</Text>
              </View>

              {/* 여성 인원 */}
              <View style={styles.participantItem}>
                <UserRound size={20} color="#ec4899" />
                <Text style={styles.participantLabel}>여성</Text>
                <TouchableOpacity 
                  style={styles.countButton}
                  onPress={() => adjustParticipantCount('female', false)}
                >
                  <Minus size={16} color="#6b7280" />
                </TouchableOpacity>
                <TextInput
                  style={styles.participantInput}
                  value={formData.femaleCount}
                  onChangeText={(text) => setFormData({...formData, femaleCount: text})}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <TouchableOpacity 
                  style={styles.countButton}
                  onPress={() => adjustParticipantCount('female', true)}
                >
                  <Plus size={16} color="#6b7280" />
                </TouchableOpacity>
                <Text style={styles.participantUnit}>명</Text>
              </View>
            </View>
          </View>

          {/* NTRP 범위 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>모집 실력 (NTRP) *</Text>
            <View style={styles.ntrpRangeContainer}>
              <View style={styles.ntrpInputItem}>
                <Text style={styles.ntrpLabel}>최소</Text>
                <TextInput
                  style={styles.ntrpInput}
                  value={formData.ntrpMin}
                  onChangeText={(text) => setFormData({...formData, ntrpMin: text})}
                  placeholder="3.0"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
              
              <Text style={styles.ntrpSeparator}>~</Text>
              
              <View style={styles.ntrpInputItem}>
                <Text style={styles.ntrpLabel}>최대</Text>
                <TextInput
                  style={styles.ntrpInput}
                  value={formData.ntrpMax}
                  onChangeText={(text) => setFormData({...formData, ntrpMax: text})}
                  placeholder="4.5"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <Text style={styles.ntrpHint}>
              참가자의 NTRP 실력 범위를 설정하세요 (1.0-7.0)
            </Text>
          </View>

          {/* 매치 설명 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>매치 설명</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              placeholder="매치에 대한 설명을 입력하세요 (선택사항)"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              maxLength={300}
            />
          </View>

          {/* 광고 옵션 */}
          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>프리미엄 광고</Text>
                <Text style={styles.switchDescription}>
                  매치를 상단에 노출하여 더 많은 참여자를 모집할 수 있습니다
                </Text>
              </View>
              <Switch
                value={formData.adEnabled}
                onValueChange={(value) => setFormData({...formData, adEnabled: value})}
                trackColor={{ false: '#d1d5db', true: '#fbbf24' }}
                thumbColor={formData.adEnabled ? '#f59e0b' : '#9ca3af'}
              />
            </View>
          </View>
        </View>

        {/* 새로운 가격 시스템 안내 */}
        <View style={styles.priceInfoCard}>
          <Text style={styles.priceInfoTitle}>💡 간소화된 실시간 가격 변동</Text>
          <Text style={styles.priceInfoText}>
            새로운 가격 시스템:{'\n'}
            • 조회수 500회 이상: 최대 10% 할증{'\n'}
            • 신청자 모집인원 10배 이상: 최대 100% 할증{'\n'}
            • 10시간 전부터: 최대 20% 할인{'\n'}
            • 기본가격 아래로는 절대 하락하지 않음
          </Text>
          <View style={styles.priceInfoNote}>
            <Info size={14} color="#1e40af" />
            <Text style={styles.priceInfoNoteText}>
              최대가격은 20만원으로 제한됩니다
            </Text>
          </View>
        </View>

        {/* 등록 버튼 */}
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? '등록 중...' : '매치 등록하기'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loginPromptTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  loginPromptText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    gap: 8,
  },
  timeButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  priceInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  priceUnit: {
    paddingRight: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  matchTypeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  matchTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  matchTypeButtonActive: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  matchTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  matchTypeTextActive: {
    color: '#ffffff',
  },
  participantContainer: {
    gap: 12,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  participantLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    width: 40,
  },
  countButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  participantInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
    width: 60,
  },
  participantUnit: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  ntrpRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  ntrpInputItem: {
    alignItems: 'center',
    gap: 8,
  },
  ntrpLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  ntrpInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
    width: 60,
  },
  ntrpSeparator: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500',
  },
  ntrpHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  priceInfoCard: {
    backgroundColor: '#dbeafe',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  priceInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 8,
  },
  priceInfoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    marginBottom: 12,
  },
  priceInfoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  priceInfoNoteText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#ec4899',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  bottomPadding: {
    height: 32,
  },
});