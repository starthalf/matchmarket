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
      const newMatch: Match = {
        id: `match_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        sellerId: currentUser.id,
        seller: currentUser,
        title: formData.title,
        date: formData.date.toISOString().split('T')[0],
        time: formData.time.toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        endTime: formData.endTime.toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        court: formData.court,
        description: formData.description,
        basePrice: basePriceNum,
        initialPrice: basePriceNum,
        currentPrice: basePriceNum,
        maxPrice: basePriceNum * 2,
        expectedViews: 0,
        expectedWaitingApplicants: 0,
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
        location: formData.court,
        createdAt: new Date().toISOString(),
        isClosed: false,
      };

      await addMatch(newMatch);
      
      Alert.alert(
        '매치 등록 완료!',
        '매치가 성공적으로 등록되었습니다.',
        [
          {
            text: '확인',
            onPress: () => {
              router.replace('/(tabs)');
            }
          }
        ]
      );
    } catch (error) {
      console.error('매치 등록 실패:', error);
      Alert.alert('등록 실패', '매치 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate });
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setFormData({ ...formData, time: selectedTime });
    }
  };

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setFormData({ ...formData, endTime: selectedTime });
    }
  };

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={safeStyles.safeHeader}>
        <View style={safeStyles.safeHeaderContent}>
          <Text style={safeStyles.headerTitle}>매치 등록</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 판매자 프로필 카드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>판매자 정보</Text>
          <View style={styles.sellerCard}>
            <View style={styles.sellerHeader}>
              <View style={styles.sellerBasicInfo}>
                <Text style={styles.sellerName}>{currentUser.name}</Text>
                <View style={styles.sellerBadges}>
                  <CertificationBadge type="ntrp" status={currentUser.certification.ntrp} />
                  <CertificationBadge type="career" status={currentUser.certification.career} />
                </View>
              </View>
              <View style={styles.sellerStats}>
                <Text style={styles.sellerNtrp}>NTRP {currentUser.ntrp}</Text>
                <Text style={styles.sellerCareer}>{currentUser.careerType}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 매치 기본 정보 카드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>매치 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>매치 제목 *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.title}
              onChangeText={(text) => setFormData({...formData, title: text})}
              placeholder="매치 제목을 입력하세요"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* 날짜 및 시간 */}
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeItem}>
              <Text style={styles.inputLabel}>날짜 *</Text>
              <TouchableOpacity
                style={styles.dateTimeInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={16} color="#6b7280" />
                <Text style={styles.dateTimeText}>
                  {formData.date.toLocaleDateString('ko-KR')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateTimeItem}>
              <Text style={styles.inputLabel}>시작시간 *</Text>
              <TouchableOpacity
                style={styles.dateTimeInput}
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={16} color="#6b7280" />
                <Text style={styles.dateTimeText}>
                  {formData.time.toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateTimeItem}>
              <Text style={styles.inputLabel}>종료시간 *</Text>
              <TouchableOpacity
                style={styles.dateTimeInput}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Clock size={16} color="#6b7280" />
                <Text style={styles.dateTimeText}>
                  {formData.endTime.toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>테니스장 및 코트 *</Text>
            <View style={styles.inputWithIcon}>
              <MapPin size={20} color="#6b7280" />
              <TextInput
                style={styles.textInputWithIcon}
                value={formData.court}
                onChangeText={(text) => setFormData({...formData, court: text})}
                placeholder="예) 강남 테니스클럽 A코트"
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
        </View>

        {/* 매치 설정 카드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>매치 설정</Text>
          
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

          {/* 모집 인원 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>모집 인원 *</Text>
            <View style={styles.participantContainer}>
              <View style={styles.participantItem}>
                <Text style={styles.participantLabel}>남성</Text>
                <TextInput
                  style={styles.participantInput}
                  value={formData.maleCount}
                  onChangeText={(text) => setFormData({...formData, maleCount: text})}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
                <Text style={styles.participantUnit}>명</Text>
              </View>
              <View style={styles.participantItem}>
                <Text style={styles.participantLabel}>여성</Text>
                <TextInput
                  style={styles.participantInput}
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

          {/* NTRP 요구사항 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NTRP 요구사항 *</Text>
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
          </View>
        </View>

        {/* 가격 및 기타 설정 카드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>가격 설정</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>참가비 (1인당) *</Text>
            <View style={styles.inputWithIcon}>
              <DollarSign size={20} color="#6b7280" />
              <TextInput
                style={styles.textInputWithIcon}
                value={formData.basePrice}
                onChangeText={(text) => setFormData({...formData, basePrice: text})}
                placeholder="20000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
              <Text style={styles.wonSymbol}>원</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.switchContainer}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>광고 사용</Text>
                <Text style={styles.switchDescription}>매치를 더 많은 사람들에게 노출시킵니다</Text>
              </View>
              <Switch
                value={formData.adEnabled}
                onValueChange={(value) => setFormData({...formData, adEnabled: value})}
                trackColor={{ false: '#d1d5db', true: '#ec4899' }}
                thumbColor={formData.adEnabled ? '#ffffff' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* 등록 버튼 */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? '등록 중...' : '매치 등록하기'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
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
  content: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchInfo: {
    flex: 1,
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
  },
  submitSection: {
    padding: 20,
  },
  submitButton: {
    backgroundColor: '#ec4899',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  sellerCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sellerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerBasicInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  sellerBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  sellerStats: {
    alignItems: 'flex-end',
  },
  sellerNtrp: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  sellerCareer: {
    fontSize: 14,
    color: '#6b7280',
  },
});