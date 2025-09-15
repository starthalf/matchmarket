// app/(tabs)/register.tsx - 완전한 코드 (매치 타입과 인원수 독립적 관리)

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useMatch } from '../../contexts/MatchContext';
import { useAuth } from '../../contexts/AuthContext';
import { Match, MatchTypeHelper } from '../../types/tennis';
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
  Trophy,
  Info,
} from 'lucide-react-native';

// FormData 타입
interface FormData {
  title: string;
  date: Date;
  time: Date;
  endTime: Date;
  court: string;
  description: string;
  basePrice: string;
  matchType: '단식' | '남복' | '여복' | '혼복'; // 경기 방식
  maleCount: string;    // 모집할 남성 인원 (매치 타입과 독립적)
  femaleCount: string;  // 모집할 여성 인원 (매치 타입과 독립적)
  adEnabled: boolean;
  ntrpMin: string;
  ntrpMax: string;
}

export default function RegisterScreen() {
  const { addMatch } = useMatch();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // 폼 데이터 상태
  const [formData, setFormData] = useState<FormData>({
    title: '',
    date: new Date(),
    time: new Date(),
    endTime: new Date(),
    court: '',
    description: '',
    basePrice: '',
    matchType: '혼복', // 기본 경기 방식
    maleCount: '2',     // 기본 남성 모집 인원
    femaleCount: '2',   // 기본 여성 모집 인원
    adEnabled: false,
    ntrpMin: '',
    ntrpMax: '',
  });

  // 시간 포맷팅 함수
  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 날짜 포맷팅 함수
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // 매치 타입 변경 핸들러 (인원수 자동 조정 없음)
  const handleMatchTypeChange = (matchType: FormData['matchType']) => {
    setFormData(prev => ({
      ...prev,
      matchType,
    }));
  };

  // 날짜/시간 변경 핸들러들
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setFormData(prev => ({ ...prev, time: selectedTime }));
      
      // 종료 시간을 시작 시간 + 2시간으로 자동 설정
      const endTime = new Date(selectedTime);
      endTime.setHours(endTime.getHours() + 2);
      setFormData(prev => ({ ...prev, endTime }));
    }
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setFormData(prev => ({ ...prev, endTime: selectedTime }));
    }
  };

  // 폼 검증 및 제출
  const handleSubmit = async () => {
    if (!currentUser) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    // 필수 필드 검증
    if (!formData.title.trim()) {
      Alert.alert('입력 오류', '매치 제목을 입력해주세요.');
      return;
    }

    if (!formData.court.trim()) {
      Alert.alert('입력 오류', '코트명을 입력해주세요.');
      return;
    }

    if (!formData.basePrice || isNaN(Number(formData.basePrice))) {
      Alert.alert('입력 오류', '올바른 기본 가격을 입력해주세요.');
      return;
    }

    const maleCountNum = parseInt(formData.maleCount) || 0;
    const femaleCountNum = parseInt(formData.femaleCount) || 0;
    const basePriceNum = parseInt(formData.basePrice);
    const ntrpMinNum = parseFloat(formData.ntrpMin) || 1.0;
    const ntrpMaxNum = parseFloat(formData.ntrpMax) || 7.0;

    // 가격 검증
    if (basePriceNum < 5000 || basePriceNum > 200000) {
      Alert.alert('입력 오류', '기본 가격은 5,000원 이상 200,000원 이하로 입력해주세요.');
      return;
    }

    // 인원수 검증
    if (maleCountNum + femaleCountNum === 0) {
      Alert.alert('입력 오류', '최소 1명 이상의 참가자가 필요합니다.');
      return;
    }

    // 매치 타입별 성별 제한 검증
    if (formData.matchType === '남복' && femaleCountNum > 0) {
      Alert.alert('입력 오류', '남자복식에서는 여성 참가자를 모집할 수 없습니다.');
      return;
    }

    if (formData.matchType === '여복' && maleCountNum > 0) {
      Alert.alert('입력 오류', '여자복식에서는 남성 참가자를 모집할 수 없습니다.');
      return;
    }

    // NTRP 검증
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
        sellerId: currentUser.id,
        seller: currentUser,
        title: formData.title,
        date: formData.date.toISOString().split('T')[0],
        time: formatTime(formData.time),
        endTime: formatTime(formData.endTime),
        court: formData.court,
        description: formData.description || '매치에 대한 설명이 없습니다.',
        basePrice: basePriceNum,
        initialPrice: basePriceNum,
        currentPrice: basePriceNum,
        maxPrice: basePriceNum * 3,
        expectedViews: Math.floor(Math.random() * 500) + 200,
        expectedWaitingApplicants: Math.floor(Math.random() * 5) + 1,
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
        matchType: formData.matchType, // 경기 방식
        waitingApplicants: 0,
        waitingList: [],
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
          time: new Date(),
          endTime: new Date(),
          court: '',
          description: '',
          basePrice: '',
          matchType: '혼복',
          maleCount: '2',
          femaleCount: '2',
          adEnabled: false,
          ntrpMin: '',
          ntrpMax: '',
        });

        Alert.alert(
          '매치 등록 완료! 🎾',
          '매치가 성공적으로 등록되었습니다!\n실시간 가격 시스템이 활성화됩니다.',
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.mainTitle}>새로운 매치 등록</Text>
        <Text style={styles.subtitle}>
          함께할 테니스 파트너를 찾아보세요
        </Text>

        {/* 매치 제목 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>매치 제목</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            placeholder="예: 강남 테니스장에서 함께 치실 분!"
            maxLength={50}
          />
        </View>

        {/* 매치 타입 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>경기 방식</Text>
          <Text style={styles.sectionDescription}>
            어떤 방식으로 경기를 진행할지 선택하세요
          </Text>
          
          <View style={styles.matchTypeGrid}>
            {[
              { value: '단식', label: '단식', icon: '🎾', desc: '개인전 방식' },
              { value: '남복', label: '남자복식', icon: '👨‍🤝‍👨', desc: '남성만 참여' },
              { value: '여복', label: '여자복식', icon: '👩‍🤝‍👩', desc: '여성만 참여' },
              { value: '혼복', label: '혼합복식', icon: '👫', desc: '남녀 모두 참여' },
            ].map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.matchTypeCard,
                  formData.matchType === type.value && styles.matchTypeCardActive,
                ]}
                onPress={() => handleMatchTypeChange(type.value as FormData['matchType'])}
              >
                <Text style={styles.matchTypeIcon}>{type.icon}</Text>
                <Text style={[
                  styles.matchTypeLabel,
                  formData.matchType === type.value && styles.matchTypeLabelActive,
                ]}>
                  {type.label}
                </Text>
                <Text style={styles.matchTypeDesc}>{type.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 모집 인원 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>모집 인원</Text>
          <Text style={styles.sectionDescription}>
            참가를 원하는 인원수를 설정하세요
          </Text>

          <View style={styles.participantInputs}>
            {/* 남성 인원 */}
            <View style={styles.participantInput}>
              <Text style={styles.participantLabel}>남성</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.participantCount,
                  formData.matchType === '여복' && styles.inputDisabled,
                ]}
                value={formData.maleCount}
                onChangeText={(text) => {
                  if (formData.matchType !== '여복') {
                    setFormData(prev => ({ ...prev, maleCount: text }));
                  }
                }}
                placeholder="0"
                keyboardType="numeric"
                maxLength={2}
                editable={formData.matchType !== '여복'}
              />
              <Text style={styles.participantUnit}>명</Text>
            </View>

            {/* 여성 인원 */}
            <View style={styles.participantInput}>
              <Text style={styles.participantLabel}>여성</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.participantCount,
                  formData.matchType === '남복' && styles.inputDisabled,
                ]}
                value={formData.femaleCount}
                onChangeText={(text) => {
                  if (formData.matchType !== '남복') {
                    setFormData(prev => ({ ...prev, femaleCount: text }));
                  }
                }}
                placeholder="0"
                keyboardType="numeric"
                maxLength={2}
                editable={formData.matchType !== '남복'}
              />
              <Text style={styles.participantUnit}>명</Text>
            </View>
          </View>

          {/* 매치 타입별 안내 메시지 */}
          <View style={styles.matchTypeInfo}>
            <Info size={16} color="#0369a1" />
            <Text style={styles.infoText}>
              {formData.matchType === '단식' && '단식은 개인전 방식입니다. 원하는 만큼 참가자를 모집하세요.'}
              {formData.matchType === '남복' && '남자복식은 남성만 참여할 수 있습니다. 여성 인원은 0으로 고정됩니다.'}
              {formData.matchType === '여복' && '여자복식은 여성만 참여할 수 있습니다. 남성 인원은 0으로 고정됩니다.'}
              {formData.matchType === '혼복' && '혼합복식은 남녀 모두 참여할 수 있습니다. 원하는 비율로 설정하세요.'}
            </Text>
          </View>
        </View>

        {/* 날짜 및 시간 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>매치 일정</Text>
          
          <View style={styles.dateTimeContainer}>
            {/* 날짜 선택 */}
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color="#3b82f6" />
              <Text style={styles.dateTimeText}>{formatDate(formData.date)}</Text>
            </TouchableOpacity>

            {/* 시작 시간 */}
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Clock size={20} color="#3b82f6" />
              <Text style={styles.dateTimeText}>{formatTime(formData.time)}</Text>
            </TouchableOpacity>

            {/* 종료 시간 */}
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Clock size={20} color="#6b7280" />
              <Text style={styles.dateTimeText}>{formatTime(formData.endTime)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 코트명 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>코트명</Text>
          <TextInput
            style={styles.input}
            value={formData.court}
            onChangeText={(text) => setFormData(prev => ({ ...prev, court: text }))}
            placeholder="예: A코트, 1번 코트"
            maxLength={20}
          />
        </View>

        {/* 기본 가격 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 가격</Text>
          <Text style={styles.sectionDescription}>
            참가자 1명당 기본 참가비를 설정하세요
          </Text>
          <View style={styles.priceInputContainer}>
            <DollarSign size={20} color="#6b7280" />
            <TextInput
              style={styles.priceInput}
              value={formData.basePrice}
              onChangeText={(text) => setFormData(prev => ({ ...prev, basePrice: text }))}
              placeholder="25000"
              keyboardType="numeric"
              maxLength={6}
            />
            <Text style={styles.priceUnit}>원</Text>
          </View>
        </View>

        {/* NTRP 요구사항 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NTRP 요구사항</Text>
          <View style={styles.ntrpInputs}>
            <View style={styles.ntrpInput}>
              <Text style={styles.ntrpLabel}>최소</Text>
              <TextInput
                style={[styles.input, styles.ntrpValue]}
                value={formData.ntrpMin}
                onChangeText={(text) => setFormData(prev => ({ ...prev, ntrpMin: text }))}
                placeholder="3.0"
                keyboardType="decimal-pad"
                maxLength={3}
              />
            </View>
            <Text style={styles.ntrpSeparator}>~</Text>
            <View style={styles.ntrpInput}>
              <Text style={styles.ntrpLabel}>최대</Text>
              <TextInput
                style={[styles.input, styles.ntrpValue]}
                value={formData.ntrpMax}
                onChangeText={(text) => setFormData(prev => ({ ...prev, ntrpMax: text }))}
                placeholder="4.5"
                keyboardType="decimal-pad"
                maxLength={3}
              />
            </View>
          </View>
        </View>

        {/* 매치 설명 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>매치 설명 (선택)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="매치에 대한 추가 정보나 참가자들에게 전하고 싶은 메시지를 적어주세요."
            multiline
            numberOfLines={4}
            maxLength={200}
            textAlignVertical="top"
          />
        </View>

        {/* 광고 활성화 */}
        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>광고 활성화</Text>
              <Text style={styles.switchDescription}>
                광고를 통해 추가 수익을 얻고 더 많은 참가자를 모집하세요
              </Text>
            </View>
            <Switch
              value={formData.adEnabled}
              onValueChange={(value) => setFormData(prev => ({ ...prev, adEnabled: value }))}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={formData.adEnabled ? '#3b82f6' : '#f3f4f6'}
            />
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
      </View>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={formData.time}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={formData.endTime}
          mode="time"
          display="default"
          onChange={handleEndTimeChange}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },

  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },

  section: {
    marginBottom: 32,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },

  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },

  inputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
  },

  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  matchTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },

  matchTypeCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  matchTypeCardActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },

  matchTypeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },

  matchTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },

  matchTypeLabelActive: {
    color: '#3b82f6',
  },

  matchTypeDesc: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },

  participantInputs: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },

  participantInput: {
    flex: 1,
    alignItems: 'center',
  },

  participantLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },

  participantCount: {
    textAlign: 'center',
    width: '100%',
    fontSize: 18,
    fontWeight: '600',
  },

  participantUnit: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },

  matchTypeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
    gap: 8,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0369a1',
    lineHeight: 18,
  },

  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },

  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },

  dateTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },

  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },

  priceInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    textAlign: 'right',
  },

  priceUnit: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 8,
  },

  ntrpInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  ntrpInput: {
    flex: 1,
    alignItems: 'center',
  },

  ntrpLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },

  ntrpValue: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },

  ntrpSeparator: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '600',
  },

  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  switchInfo: {
    flex: 1,
    marginRight: 16,
  },

  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },

  switchDescription: {
    fontSize: 14,
    color: '#6b7280',
  },

  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },

  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },

  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },

  bottomPadding: {
    height: 40,
  },
});