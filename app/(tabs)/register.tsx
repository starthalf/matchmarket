// app/(tabs)/register.tsx - v2 기준 완전한 버전 (null 에러 해결)

import React, { useState } from 'react';
import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, MapPin, Users, DollarSign } from 'lucide-react-native';
import { UserRound } from 'lucide-react-native';
import { CertificationBadge } from '../../components/CertificationBadge';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../contexts/AuthContext';
import { useMatches } from '../../contexts/MatchContext';
import { Match } from '../../types/tennis';
import { router } from 'expo-router';
import { useSafeStyles } from '../../constants/Styles';

export default function RegisterScreen() {
  const { user: currentUser } = useAuth();
  const { addMatch } = useMatches();
  const safeStyles = useSafeStyles();
  
  const [formData, setFormData] = useState({
    title: '',
    date: new Date(),
    time: new Date(),
    endTime: new Date(),
    court: '',
    description: '',
    basePrice: '',
    matchType: '혼복' as '단식' | '남복' | '여복' | '혼복',
    maleCount: '2',
    femaleCount: '2',
    adEnabled: false,
    ntrpMin: '3.0',
    ntrpMax: '4.5',
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (!currentUser) {
      router.replace('/auth/login');
    }
  }, [currentUser]);
  
  if (!currentUser) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <View style={styles.loadingContainer}>
          <Text>로그인이 필요합니다...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSubmit = async () => {
  if (!formData.title || !formData.court || !formData.basePrice || 
      (!formData.maleCount && !formData.femaleCount) || !formData.ntrpMin || !formData.ntrpMax) {
    Alert.alert('입력 오류', '모든 필수 항목을 입력해주세요.');
    return;
  }

  if (!currentUser) {
    Alert.alert('오류', '로그인 정보가 없습니다. 다시 로그인해주세요.');
    router.replace('/auth/login');
    return;
  }

  // 숫자 변환 및 유효성 검사
  const basePriceNum = parseInt(formData.basePrice);
  const maleCountNum = parseInt(formData.maleCount) || 0;
  const femaleCountNum = parseInt(formData.femaleCount) || 0;
  const ntrpMinNum = parseFloat(formData.ntrpMin);
  const ntrpMaxNum = parseFloat(formData.ntrpMax);

  if (isNaN(basePriceNum) || basePriceNum <= 0) {
    Alert.alert('입력 오류', '올바른 가격을 입력해주세요.');
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
    console.log('새 매치 ID 생성:', newMatchId); // 디버깅용
    
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
      matchType: formData.matchType,
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

    console.log('매치 객체 생성 완료:', newMatch); // 디버깅용

// MatchContext에 매치 추가
console.log('새 매치 추가 중:', newMatchId);
addMatch(newMatch);
console.log('매치 추가 완료');

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
  ntrpMin: '3.0',
  ntrpMax: '4.5',
});

// 🔥 Alert 없이 바로 이동
console.log('매치 상세페이지로 바로 이동:', newMatchId);
router.replace(`/match/${newMatchId}`);
    }
  }]
);

} catch (error) {  // 🔥 이 부분이 빠져있었습니다!
  console.error('매치 등록 중 오류:', error);
  Alert.alert('등록 실패', '매치 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
} finally {
  setIsSubmitting(false);
}
};

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit'
    }).replace(/\./g, '/').replace(/ /g, '').slice(0, -1);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({...formData, date: selectedDate});
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setFormData({...formData, time: selectedTime});
    }
  };

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setFormData({...formData, endTime: selectedTime});
    }
  };

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={safeStyles.safeHeader}>
        <View style={safeStyles.safeHeaderContent}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>매치 판매</Text>
            <DollarSign size={24} color="#16a34a" />
          </View>
          <Text style={styles.subtitle}>당신의 테니스를 판매하세요. 인기가 높으면 가격이 올라갑니다</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 판매자 정보 카드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>판매자 정보</Text>
          <View style={styles.sellerInfo}>
            <View style={styles.sellerBasic}>
              <UserRound size={20} color="#6b7280" />
              <Text style={styles.sellerName}>{currentUser.name}</Text>
              <Text style={styles.sellerDetails}>
                {currentUser.gender} · {currentUser.ageGroup} · NTRP {currentUser.ntrp}
              </Text>
            </View>
            <View style={styles.certificationContainer}>
              <CertificationBadge
                type="ntrp" 
                status={currentUser.certification.ntrp}
                size="small"
              />
              <CertificationBadge
                type="career" 
                status={currentUser.certification.career}
                size="small"
              />
            </View>
          </View>
        </View>

        {/* 매치 정보 카드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>매치 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>판매 매치 제목 *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.title}
              onChangeText={(text) => setFormData({...formData, title: text})}
              placeholder="예) 강남에서 함께 치실 분을 위한 매치!"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeItem}>
              <Text style={styles.inputLabel}>날짜 *</Text>
              <TouchableOpacity 
                style={styles.dateTimeInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={16} color="#6b7280" />
                <Text style={styles.dateTimeText}>{formatDate(formData.date)}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateTimeItem}>
              <Text style={styles.inputLabel}>시작 *</Text>
              <TouchableOpacity 
                style={styles.dateTimeInput}
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={16} color="#6b7280" />
                <Text style={styles.dateTimeText}>{formatTime(formData.time)}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateTimeItem}>
              <Text style={styles.inputLabel}>종료 *</Text>
              <TouchableOpacity 
                style={styles.dateTimeInput}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Clock size={16} color="#6b7280" />
                <Text style={styles.dateTimeText}>{formatTime(formData.endTime)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>테니스 코트 *</Text>
            <View style={styles.inputWithIcon}>
              <MapPin size={20} color="#6b7280" />
              <TextInput
                style={styles.textInputWithIcon}
                value={formData.court}
                onChangeText={(text) => setFormData({...formData, court: text})}
                placeholder="예) 양재 테니스 코트"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>매치 설명</Text>
            <TextInput
              style={styles.textArea}
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              placeholder="판매하는 매치에 대한 자세한 설명을 입력하세요..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* 매치 유형 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>매치 유형 *</Text>
            <View style={styles.matchTypeGrid}>
              <TouchableOpacity
                style={[
                  styles.matchTypeButton,
                  formData.matchType === '단식' && styles.matchTypeButtonActive
                ]}
                onPress={() => setFormData({...formData, matchType: '단식'})}
              >
                <Text style={styles.matchTypeEmoji}>🎾</Text>
                <Text style={[
                  styles.matchTypeText,
                  formData.matchType === '단식' && styles.matchTypeTextActive
                ]}>
                  단식 (1:1)
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.matchTypeButton,
                  formData.matchType === '남복' && styles.matchTypeButtonActive
                ]}
                onPress={() => setFormData({...formData, matchType: '남복'})}
              >
                <Text style={styles.matchTypeEmoji}>👨‍🤝‍👨</Text>
                <Text style={[
                  styles.matchTypeText,
                  formData.matchType === '남복' && styles.matchTypeTextActive
                ]}>
                  남복 (2:2)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.matchTypeButton,
                  formData.matchType === '여복' && styles.matchTypeButtonActive
                ]}
                onPress={() => setFormData({...formData, matchType: '여복'})}
              >
                <Text style={styles.matchTypeEmoji}>👩‍🤝‍👩</Text>
                <Text style={[
                  styles.matchTypeText,
                  formData.matchType === '여복' && styles.matchTypeTextActive
                ]}>
                  여복 (2:2)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.matchTypeButton,
                  formData.matchType === '혼복' && styles.matchTypeButtonActive
                ]}
                onPress={() => setFormData({...formData, matchType: '혼복'})}
              >
                <Text style={styles.matchTypeEmoji}>👫</Text>
                <Text style={[
                  styles.matchTypeText,
                  formData.matchType === '혼복' && styles.matchTypeTextActive
                ]}>
                  혼복 (2:2)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>판매 기본 가격 *</Text>
            <View style={styles.inputWithIcon}>
              <Text style={styles.wonSymbol}>₩</Text>
              <TextInput
                style={styles.textInputWithIcon}
                value={formData.basePrice}
                onChangeText={(text) => setFormData({...formData, basePrice: text})}
                placeholder="코트비+공값의 1/N을 입력하세요 (예: 35000)"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* 모집 인원 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>모집 인원 *</Text>
            <View style={styles.participantContainer}>
              <View style={styles.participantItem}>
                <UserRound size={20} color="#3b82f6" />
                <Text style={styles.participantLabel}>남성</Text>
                <TextInput
                  style={styles.participantInput}
                  value={formData.maleCount}
                  onChangeText={(text) => setFormData({...formData, maleCount: text})}
                  keyboardType="numeric"
                />
                <Text style={styles.participantUnit}>명</Text>
              </View>

              <View style={styles.participantItem}>
                <UserRound size={20} color="#ec4899" />
                <Text style={styles.participantLabel}>여성</Text>
                <TextInput
                  style={styles.participantInput}
                  value={formData.femaleCount}
                  onChangeText={(text) => setFormData({...formData, femaleCount: text})}
                  keyboardType="numeric"
                />
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
        </View>

        {/* 가격 정보 카드 */}
        <View style={styles.priceInfoCard}>
          <Text style={styles.priceInfoTitle}>💡 AI 기반 실시간 가격 변동</Text>
          <Text style={styles.priceInfoText}>
            인기도에 기반해 가격이 증가합니다. 판매자가 설정한 
            <Text style={styles.priceHighlight}> 코트비+공값</Text> 이하로는 떨어지지 않습니다.
          </Text>
        </View>

        {/* 광고 수익 배분 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>광고 수익 배분</Text>
          
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>광고 수익 배분 참여</Text>
              <Text style={styles.switchDescription}>
                매치 페이지에 광고가 표시되고 수익의 50%를 받습니다 (준비중)
              </Text>
            </View>
            <Switch
              value={formData.adEnabled}
              onValueChange={(value) => setFormData({...formData, adEnabled: value})}
              disabled={true}
              trackColor={{ false: '#d1d5db', true: '#86efac' }}
              thumbColor={'#9ca3af'}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
          <Text style={styles.submitButtonText}>
            {isSubmitting ? '등록 중...' : '매치 판매하기'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={formData.time}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
      {showEndTimePicker && (
        <DateTimePicker
          value={formData.endTime}
          mode="time"
          display="default"
          onChange={onEndTimeChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  sellerInfo: {
    gap: 12,
  },
  sellerBasic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sellerDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  certificationContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
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
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  textInputWithIcon: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  wonSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateTimeItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateTimeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
  },
  dateTimeText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 6,
    fontWeight: '500',
  },
  matchTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  matchTypeButton: {
    flex: 1,
    minWidth: '48%',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  matchTypeButtonActive: {
    borderColor: '#ec4899',
    backgroundColor: '#fdf2f8',
  },
  matchTypeEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  matchTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  matchTypeTextActive: {
    color: '#ec4899',
  },
  participantContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  participantItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participantLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  participantInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
    width: 50,
  },
  participantUnit: {
    fontSize: 14,
    color: '#6b7280',
  },
  ntrpRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  ntrpInputItem: {
    alignItems: 'center',
    gap: 6,
  },
  ntrpLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  ntrpInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
    width: 60,
  },
  ntrpSeparator: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
  },
  ntrpHint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  priceInfoCard: {
    backgroundColor: '#fef3c7',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  priceInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  priceInfoText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  priceHighlight: {
    fontWeight: '700',
    color: '#b45309',
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
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#ec4899',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  bottomPadding: {
    height: 20,
  },
});