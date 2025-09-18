// app/(tabs)/register.tsx - 완전한 코드 (initial_price null 에러 해결)

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

    // 🔥 숫자 변환 및 유효성 검사 강화
    const basePriceNum = parseInt(formData.basePrice);
    const maleCountNum = parseInt(formData.maleCount) || 0;
    const femaleCountNum = parseInt(formData.femaleCount) || 0;
    const ntrpMinNum = parseFloat(formData.ntrpMin);
    const ntrpMaxNum = parseFloat(formData.ntrpMax);

    // 🔍 디버깅: 변환된 값들 확인
    console.log('🔍 입력값 변환 결과:', {
      basePrice: basePriceNum,
      maleCount: maleCountNum,
      femaleCount: femaleCountNum,
      ntrpMin: ntrpMinNum,
      ntrpMax: ntrpMaxNum,
      types: {
        basePrice: typeof basePriceNum,
        maleCount: typeof maleCountNum,
        femaleCount: typeof femaleCountNum,
      }
    });

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
      
      // 🔥 가격 필드 명시적으로 안전하게 설정
      const safeBasePrice = Number(basePriceNum);
      const safeInitialPrice = Number(basePriceNum);    // 기본 가격과 동일
      const safeCurrentPrice = Number(basePriceNum);    // 기본 가격과 동일
      const safeMaxPrice = Number(basePriceNum * 3);    // 기본 가격의 3배

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
        basePrice: safeBasePrice,         // ✅ 안전한 숫자
        initialPrice: safeInitialPrice,   // ✅ 절대 null/undefined 아님
        currentPrice: safeCurrentPrice,   // ✅ 절대 null/undefined 아님
        maxPrice: safeMaxPrice,           // ✅ 절대 null/undefined 아님
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

      // 🔍 디버깅: 생성된 매치 객체 확인
      console.log('🔍 생성된 매치 객체:', {
        id: newMatch.id,
        title: newMatch.title,
        basePrice: newMatch.basePrice,
        initialPrice: newMatch.initialPrice,
        currentPrice: newMatch.currentPrice,
        maxPrice: newMatch.maxPrice,
        seller: newMatch.seller.name,
        types: {
          basePrice: typeof newMatch.basePrice,
          initialPrice: typeof newMatch.initialPrice,
          currentPrice: typeof newMatch.currentPrice,
          maxPrice: typeof newMatch.maxPrice,
        },
        nullCheck: {
          basePriceIsNull: newMatch.basePrice === null,
          initialPriceIsNull: newMatch.initialPrice === null,
          currentPriceIsNull: newMatch.currentPrice === null,
          maxPriceIsNull: newMatch.maxPrice === null,
        }
      });

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
          ntrpMin: '3.0',
          ntrpMax: '4.5',
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
      console.error('❌ 매치 등록 중 오류:', error);
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

          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeItem}>
              <Text style={styles.inputLabel}>날짜 *</Text>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={16} color="#6b7280" />
                <Text style={styles.dateTimeText}>{formatDate(formData.date)}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateTimeItem}>
              <Text style={styles.inputLabel}>시작 시간 *</Text>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={16} color="#6b7280" />
                <Text style={styles.dateTimeText}>{formatTime(formData.time)}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateTimeItem}>
              <Text style={styles.inputLabel}>종료 시간 *</Text>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Clock size={16} color="#6b7280" />
                <Text style={styles.dateTimeText}>{formatTime(formData.endTime)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>테니스 코트 *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.court}
              onChangeText={(text) => setFormData({...formData, court: text})}
              placeholder="예) 양재 테니스 코트"
              placeholderTextColor="#9ca3af"
            />
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
        </View>

        {/* 매치 설정 카드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>매치 설정</Text>
          
          {/* 매치 유형 4개로 확장 */}
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
            <Text style={styles.inputLabel}>모집 인원 *</Text>
            <View style={styles.participantRow}>
              <View style={styles.participantInput}>
                <Text style={styles.participantLabel}>남성</Text>
                <TextInput
                  style={styles.participantTextInput}
                  value={formData.maleCount}
                  onChangeText={(text) => setFormData({...formData, maleCount: text})}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
                <Text style={styles.participantUnit}>명</Text>
              </View>
              
              <Text style={styles.participantSeparator}>+</Text>
              
              <View style={styles.participantInput}>
                <Text style={styles.participantLabel}>여성</Text>
                <TextInput
                  style={styles.participantTextInput}
                  value={formData.femaleCount}
                  onChangeText={(text) => setFormData({...formData, femaleCount: text})}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
                <Text style={styles.participantUnit}>명</Text>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NTRP 범위 *</Text>
            <View style={styles.ntrpRow}>
              <View style={styles.ntrpInput}>
                <Text style={styles.ntrpLabel}>최소</Text>
                <TextInput
                  style={styles.ntrpTextInput}
                  value={formData.ntrpMin}
                  onChangeText={(text) => setFormData({...formData, ntrpMin: text})}
                  placeholder="3.0"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                />
              </View>
              
              <Text style={styles.ntrpSeparator}>-</Text>
              
              <View style={styles.ntrpInput}>
                <Text style={styles.ntrpLabel}>최대</Text>
                <TextInput
                  style={styles.ntrpTextInput}
                  value={formData.ntrpMax}
                  onChangeText={(text) => setFormData({...formData, ntrpMax: text})}
                  placeholder="4.5"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
        </View>

        {/* 가격 설정 카드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>가격 설정</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>기본 가격 *</Text>
            <View style={styles.priceInputContainer}>
              <TextInput
                style={styles.priceInput}
                value={formData.basePrice}
                onChangeText={(text) => setFormData({...formData, basePrice: text})}
                placeholder="20000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
              <Text style={styles.priceUnit}>원</Text>
            </View>
            <Text style={styles.priceHint}>
              💡 인기가 높아지면 최대 3배까지 가격이 올라갑니다
            </Text>
          </View>

          <View style={styles.adOption}>
            <View style={styles.adOptionContent}>
              <Text style={styles.adOptionTitle}>광고 활성화</Text>
              <Text style={styles.adOptionDescription}>
                더 많은 사용자에게 노출됩니다 (+10% 수수료)
              </Text>
            </View>
            <Switch
              value={formData.adEnabled}
              onValueChange={(value) => setFormData({...formData, adEnabled: value})}
              trackColor={{ false: '#d1d5db', true: '#16a34a' }}
              thumbColor={formData.adEnabled ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* 등록 버튼 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <DollarSign size={20} color="#ffffff" />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? '등록 중...' : '매치 판매 시작'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 날짜/시간 선택기 */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
      
      {showTimePicker && (
        <DateTimePicker
          value={formData.time}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}
      
      {showEndTimePicker && (
        <DateTimePicker
          value={formData.endTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
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
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    marginBottom: 16,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateTimeItem: {
    flex: 1,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#111827',
  },
  matchTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  matchTypeButton: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
  },
  matchTypeButtonActive: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  matchTypeEmoji: {
    fontSize: 20,
  },
  matchTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  matchTypeTextActive: {
    color: '#16a34a',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  participantInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  participantLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  participantTextInput: {
    flex: 1,
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 4,
  },
  participantUnit: {
    fontSize: 14,
    color: '#6b7280',
  },
  participantSeparator: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  ntrpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ntrpInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  ntrpLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  ntrpTextInput: {
    flex: 1,
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 4,
  },
  ntrpSeparator: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  priceUnit: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  priceHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  adOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 4,
  },
  adOptionContent: {
    flex: 1,
  },
  adOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  adOptionDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  bottomPadding: {
    height: 20,
  },
});