import React, { useState } from 'react';
import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { Calendar, Clock, MapPin, Users, DollarSign } from 'lucide-react-native';
import { UserRound } from 'lucide-react-native';
import { CertificationBadge } from '../../components/CertificationBadge';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';

export default function RegisterScreen() {
  const { user: currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    date: new Date(),
    time: new Date(),
    endTime: new Date(),
    court: '',
    description: '',
    basePrice: '',
    matchType: '복식' as '단식' | '복식',
    maleCount: '2',
    femaleCount: '2',
    adEnabled: false,
    ntrpMin: '',
    ntrpMax: '',
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  useEffect(() => {
    if (!currentUser) {
      router.replace('/auth/login');
    }
  }, [currentUser]);
  
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>로그인이 필요합니다...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSubmit = () => {
    if (!formData.title || !formData.court || !formData.basePrice || 
        (!formData.maleCount && !formData.femaleCount) || !formData.ntrpMin || !formData.ntrpMax) {
      Alert.alert('입력 오류', '모든 필수 항목을 입력해주세요.');
      return;
    }

    Alert.alert(
      '매치 판매 등록 완료',
      '매치가 성공적으로 판매 등록되었습니다!\n실시간 가격 시스템이 활성화됩니다.',
      [{ text: '확인', onPress: () => {
        // 폼 초기화
        setFormData({
          title: '',
          date: new Date(),
          time: new Date(),
          endTime: new Date(),
          court: '',
          description: '',
          basePrice: '',
          matchType: '복식',
          maleCount: '2',
          femaleCount: '2',
          adEnabled: false,
          ntrpMin: '',
          ntrpMax: '',
        });
      }}]
    );
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>매치 판매</Text>
          <DollarSign size={24} color="#16a34a" />
        </View>
        <Text style={styles.subtitle}>당신의 테니스를 판매하세요</Text>
        <Text style={styles.subtitle}>인기가 높으면 가격이 올라갑니다</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 판매자 정보 카드 */}
        <View style={styles.sellerPreview}>
          <Text style={styles.sectionTitle}>매치 판매자 정보</Text>
          <View style={styles.sellerInfo}>
            <View style={styles.sellerBasic}>
              <Text style={styles.sellerName}>{currentUser.name}</Text>
              <CertificationBadge 
                ntrpCert={currentUser.certification.ntrp}
                careerCert={currentUser.certification.career}
                youtubeCert={currentUser.certification.youtube}
                instagramCert={currentUser.certification.instagram}
                size="medium"
              />
            </View>
            <Text style={styles.sellerDetails}>
              {currentUser.gender} · {currentUser.ageGroup} · NTRP {currentUser.ntrp} · {currentUser.careerType}
            </Text>
          </View>
        </View>

        {/* 매치 기본 정보 */}
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

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>날짜 *</Text>
              <TouchableOpacity 
                style={styles.inputWithIcon}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={18} color="#6b7280" />
                <Text style={styles.dateTimeText}>
                  {formatDate(formData.date)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>시간 *</Text>
              <TouchableOpacity 
                style={styles.inputWithIcon}
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={18} color="#6b7280" />
                <Text style={styles.dateTimeText}>
                  {formatTime(formData.time)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>종료 시간 *</Text>
              <TouchableOpacity 
                style={styles.inputWithIcon}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Clock size={18} color="#6b7280" />
                <Text style={styles.dateTimeText}>
                  {formatTime(formData.endTime)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={formData.date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
          
          {/* Time Picker */}
          {showTimePicker && (
            <DateTimePicker
              value={formData.time}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
            />
          )}
          
          {/* End Time Picker */}
          {showEndTimePicker && (
            <DateTimePicker
              value={formData.endTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onEndTimeChange}
            />
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>코트 위치 *</Text>
            <View style={styles.inputWithIcon}>
              <MapPin size={18} color="#6b7280" />
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
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              placeholder="판매하는 매치에 대한 자세한 설명을 입력하세요..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* 가격 및 인원 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>매치 설정</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>매치 유형 *</Text>
            <View style={styles.matchTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.matchTypeButton,
                  formData.matchType === '단식' && styles.matchTypeButtonActive
                ]}
                onPress={() => setFormData({
                  ...formData, 
                  matchType: '단식',
                  maleCount: '1',
                  femaleCount: '0'
                })}
              >
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
                  formData.matchType === '복식' && styles.matchTypeButtonActive
                ]}
                onPress={() => setFormData({
                  ...formData, 
                  matchType: '복식',
                  maleCount: '2',
                  femaleCount: '2'
                })}
              >
                <Text style={[
                  styles.matchTypeText,
                  formData.matchType === '복식' && styles.matchTypeTextActive
                ]}>
                  복식 (2:2)
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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>모집 인원 *</Text>
            <View style={styles.genderCountContainer}>
              <View style={styles.genderCountItem}>
                <UserRound size={16} color="#3b82f6" />
                <Text style={styles.genderLabel}>남성</Text>
                <TextInput
                  style={styles.genderCountInput}
                  value={formData.maleCount}
                  onChangeText={(text) => setFormData({...formData, maleCount: text})}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
                <Text style={styles.genderUnit}>명</Text>
              </View>
              
              <View style={styles.genderCountItem}>
                <UserRound size={16} color="#ec4899" />
                <Text style={styles.genderLabel}>여성</Text>
                <TextInput
                  style={styles.genderCountInput}
                  value={formData.femaleCount}
                  onChangeText={(text) => setFormData({...formData, femaleCount: text})}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
                <Text style={styles.genderUnit}>명</Text>
              </View>
            </View>
            
          </View>

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

        {/* 가격 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>판매 가격 정보</Text>
          
          <View style={styles.priceNote}>
            <Text style={styles.noteText}>
              💡 AI 기반 실시간 가격 변동
            </Text>
            <Text style={styles.noteSubtext}>
              인기도에 기반해 가격이 증가합니다. 판매자가 설정한 코트비+공값 이하로는 떨어지지 않습니다.
            </Text>
          </View>
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

          {formData.adEnabled && (
            <View style={styles.adBenefit}>
              <Text style={styles.adBenefitText}>
                ✅ 광고 수익의 50% 배분
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>매치 판매하기</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
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
  sellerPreview: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  sellerInfo: {
    gap: 8,
  },
  sellerBasic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sellerDetails: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
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
    height: 100,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    gap: 8,
  },
  textInputWithIcon: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  dateTimeText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    paddingVertical: 2,
  },
  priceNote: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  noteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  noteSubtext: {
    fontSize: 12,
    color: '#3730a3',
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  adBenefit: {
    backgroundColor: '#fdf2f8',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  adBenefitText: {
    fontSize: 13,
    color: '#be185d',
    lineHeight: 18,
  },
  matchTypeContainer: {
    flexDirection: 'row',
    gap: 12,
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
    borderColor: '#d1d5db',
    backgroundColor: '#fdf2f8',
  },
  matchTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  matchTypeTextActive: {
    color: '#ec4899',
  },
  genderCountContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderCountItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  genderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    minWidth: 24,
  },
  genderCountInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#ec4899',
    textAlign: 'center',
    paddingVertical: 4,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    minWidth: 40,
  },
  genderUnit: {
    fontSize: 12,
    color: '#6b7280',
    minWidth: 16,
  },
  totalCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ec4899',
    textAlign: 'center',
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: '#fdf2f8',
    borderRadius: 6,
  },
  ntrpRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ntrpInputItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  ntrpLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    minWidth: 24,
  },
  ntrpInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    textAlign: 'center',
    paddingVertical: 4,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    minWidth: 40,
  },
  ntrpSeparator: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    paddingHorizontal: 6,
  },
  ntrpHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    lineHeight: 16,
  },
  submitButton: {
    backgroundColor: '#ec4899',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  bottomPadding: {
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});