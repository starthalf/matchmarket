import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock, MapPin, Users, DollarSign, FileText, Settings } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useMatches } from '../../contexts/MatchContext';
import { Match } from '../../types/tennis';
import { useSafeStyles } from '../../constants/Styles';

export default function RegisterScreen() {
  const { user } = useAuth();
  const { addMatch } = useMatches();
  const safeStyles = useSafeStyles();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date(),
    time: new Date(),
    endTime: new Date(),
    court: '',
    basePrice: '',
    maxPrice: '',
    expectedMale: '',
    expectedFemale: '',
    matchType: '혼복' as '단식' | '남복' | '여복' | '혼복',
    ntrpMin: '',
    ntrpMax: '',
    location: '',
    adEnabled: true,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  if (!user) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>로그인이 필요합니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSubmit = async () => {
    // 유효성 검사
    if (!formData.title || !formData.court || !formData.basePrice) {
      Alert.alert('입력 오류', '필수 항목을 모두 입력해주세요.');
      return;
    }

    const basePrice = parseInt(formData.basePrice);
    const maxPrice = parseInt(formData.maxPrice) || basePrice * 3;
    const expectedMale = parseInt(formData.expectedMale) || 0;
    const expectedFemale = parseInt(formData.expectedFemale) || 0;
    const ntrpMin = parseFloat(formData.ntrpMin) || 3.0;
    const ntrpMax = parseFloat(formData.ntrpMax) || 5.0;

    if (expectedMale + expectedFemale === 0) {
      Alert.alert('입력 오류', '최소 1명 이상의 참가자를 모집해야 합니다.');
      return;
    }

    if (basePrice <= 0) {
      Alert.alert('입력 오류', '올바른 가격을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newMatch: Match = {
        id: `match_${Date.now()}`,
        sellerId: user.id,
        seller: user,
        title: formData.title,
        date: formData.date.toISOString().split('T')[0],
        time: formData.time.toTimeString().slice(0, 5),
        endTime: formData.endTime.toTimeString().slice(0, 5),
        court: formData.court,
        description: formData.description,
        basePrice: basePrice,
        initialPrice: basePrice,
        currentPrice: basePrice,
        maxPrice: maxPrice,
        expectedViews: 0,
        expectedWaitingApplicants: 0,
        expectedParticipants: {
          male: expectedMale,
          female: expectedFemale,
          total: expectedMale + expectedFemale,
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
          min: ntrpMin,
          max: ntrpMax,
        },
        weather: '맑음',
        location: formData.location,
        createdAt: new Date().toISOString(),
      };

      const success = await addMatch(newMatch);
      
      if (success) {
        Alert.alert(
          '매치 등록 완료',
          '매치가 성공적으로 등록되었습니다!',
          [
            { text: '확인', onPress: () => {
              // 폼 초기화
              setFormData({
                title: '',
                description: '',
                date: new Date(),
                time: new Date(),
                endTime: new Date(),
                court: '',
                basePrice: '',
                maxPrice: '',
                expectedMale: '',
                expectedFemale: '',
                matchType: '혼복',
                ntrpMin: '',
                ntrpMax: '',
                location: '',
                adEnabled: true,
              });
            }}
          ]
        );
      } else {
        Alert.alert('등록 실패', '매치 등록에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('매치 등록 오류:', error);
      Alert.alert('오류', '매치 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatTime = (time: Date) => {
    return time.toTimeString().slice(0, 5);
  };

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>매치 등록</Text>
            <Text style={styles.headerSubtitle}>새로운 테니스 매치를 등록하세요</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 기본 정보 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>기본 정보</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>매치 제목 *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.title}
                  onChangeText={(text) => setFormData({...formData, title: text})}
                  placeholder="예) 강남 테니스장에서 함께 치실 분!"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>매치 설명</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({...formData, description: text})}
                  placeholder="매치에 대한 상세 설명을 입력하세요"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>매치 타입 *</Text>
                <View style={styles.matchTypeButtons}>
                  {[
                    { key: '단식', label: '단식' },
                    { key: '남복', label: '남자복식' },
                    { key: '여복', label: '여자복식' },
                    { key: '혼복', label: '혼합복식' },
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.matchTypeButton,
                        formData.matchType === type.key && styles.matchTypeButtonActive
                      ]}
                      onPress={() => setFormData({...formData, matchType: type.key as any})}
                    >
                      <Text style={[
                        styles.matchTypeText,
                        formData.matchType === type.key && styles.matchTypeTextActive
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* 일정 및 장소 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>일정 및 장소</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>날짜 *</Text>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar size={16} color="#6b7280" />
                  <Text style={styles.dateTimeText}>{formatDate(formData.date)}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timeRow}>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.inputLabel}>시작 시간 *</Text>
                  <TouchableOpacity 
                    style={styles.dateTimeButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Clock size={16} color="#6b7280" />
                    <Text style={styles.dateTimeText}>{formatTime(formData.time)}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.timeInputGroup}>
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
                <Text style={styles.inputLabel}>테니스장 *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.court}
                  onChangeText={(text) => setFormData({...formData, court: text})}
                  placeholder="예) 강남 테니스장 A코트"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>지역</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.location}
                  onChangeText={(text) => setFormData({...formData, location: text})}
                  placeholder="예) 강남구"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* 참가자 모집 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>참가자 모집</Text>
              
              <View style={styles.participantRow}>
                <View style={styles.participantInputGroup}>
                  <Text style={styles.inputLabel}>남성 참가자</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.expectedMale}
                    onChangeText={(text) => setFormData({...formData, expectedMale: text})}
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.participantInputGroup}>
                  <Text style={styles.inputLabel}>여성 참가자</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.expectedFemale}
                    onChangeText={(text) => setFormData({...formData, expectedFemale: text})}
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.ntrpRow}>
                <View style={styles.ntrpInputGroup}>
                  <Text style={styles.inputLabel}>NTRP 최소</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.ntrpMin}
                    onChangeText={(text) => setFormData({...formData, ntrpMin: text})}
                    placeholder="3.0"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.ntrpInputGroup}>
                  <Text style={styles.inputLabel}>NTRP 최대</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.ntrpMax}
                    onChangeText={(text) => setFormData({...formData, ntrpMax: text})}
                    placeholder="5.0"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* 가격 설정 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>가격 설정</Text>
              
              <View style={styles.priceRow}>
                <View style={styles.priceInputGroup}>
                  <Text style={styles.inputLabel}>기본 가격 *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.basePrice}
                    onChangeText={(text) => setFormData({...formData, basePrice: text})}
                    placeholder="25000"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                  <Text style={styles.inputHint}>원</Text>
                </View>

                <View style={styles.priceInputGroup}>
                  <Text style={styles.inputLabel}>최대 가격</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.maxPrice}
                    onChangeText={(text) => setFormData({...formData, maxPrice: text})}
                    placeholder="75000"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                  <Text style={styles.inputHint}>원</Text>
                </View>
              </View>
            </View>

            {/* 추가 옵션 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>추가 옵션</Text>
              
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>광고 수익 공유</Text>
                  <Text style={styles.switchDescription}>
                    광고 수익의 50%를 받을 수 있습니다
                  </Text>
                </View>
                <Switch
                  value={formData.adEnabled}
                  onValueChange={(value) => setFormData({...formData, adEnabled: value})}
                  trackColor={{ false: '#e5e7eb', true: '#ec4899' }}
                  thumbColor={formData.adEnabled ? '#ffffff' : '#f9fafb'}
                />
              </View>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>

          {/* 등록 버튼 */}
          <View style={styles.submitSection}>
            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? '등록 중...' : '매치 판매하기'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 날짜/시간 피커 */}
          {showDatePicker && (
            <DateTimePicker
              value={formData.date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setFormData({...formData, date: selectedDate});
                }
              }}
              minimumDate={new Date()}
            />
          )}

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
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
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  matchTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  matchTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
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
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#374151',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInputGroup: {
    flex: 1,
  },
  participantRow: {
    flexDirection: 'row',
    gap: 12,
  },
  participantInputGroup: {
    flex: 1,
  },
  ntrpRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ntrpInputGroup: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInputGroup: {
    flex: 1,
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
  },
  submitSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#ec4899',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
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
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loginPromptText: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 20,
  },
});