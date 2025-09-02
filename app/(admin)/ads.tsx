import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  Switch,
  Image,
} from 'react-native';
import { Plus, Eye, MousePointer, CreditCard as Edit, Trash2, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react-native';
import { mockAds, AdManager } from '../../data/mockAds';
import { Ad } from '../../types/ad';

export default function AdminAdsScreen() {
  const [ads, setAds] = useState(mockAds);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    buttonText: '',
    backgroundColor: '#8b5cf6',
    textColor: '#ffffff',
    priority: '1',
    targetGender: 'all' as 'all' | '남성' | '여성',
    targetAgeGroups: [] as string[],
    ntrpMin: '',
    ntrpMax: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      linkUrl: '',
      buttonText: '',
      backgroundColor: '#8b5cf6',
      textColor: '#ffffff',
      priority: '1',
      targetGender: 'all',
      targetAgeGroups: [],
      ntrpMin: '',
      ntrpMax: '',
    });
  };

  const handleAddAd = () => {
    setEditingAd(null);
    resetForm();
    setShowAddModal(true);
  };

  const handleEditAd = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl || '',
      buttonText: ad.buttonText,
      backgroundColor: ad.backgroundColor,
      textColor: ad.textColor,
      priority: ad.priority.toString(),
      targetGender: ad.targetAudience?.gender || 'all',
      targetAgeGroups: ad.targetAudience?.ageGroups || [],
      ntrpMin: ad.targetAudience?.ntrpRange?.min.toString() || '',
      ntrpMax: ad.targetAudience?.ntrpRange?.max.toString() || '',
    });
    setShowAddModal(true);
  };

  const handleSaveAd = () => {
    if (!formData.title || !formData.description || !formData.buttonText) {
      Alert.alert('입력 오류', '필수 항목을 모두 입력해주세요.');
      return;
    }

    const adData = {
      title: formData.title,
      description: formData.description,
      imageUrl: formData.imageUrl,
      linkUrl: formData.linkUrl || undefined,
      buttonText: formData.buttonText,
      backgroundColor: formData.backgroundColor,
      textColor: formData.textColor,
      isActive: true,
      priority: parseInt(formData.priority) || 1,
      targetAudience: {
        gender: formData.targetGender !== 'all' ? formData.targetGender : undefined,
        ageGroups: formData.targetAgeGroups.length > 0 ? formData.targetAgeGroups as any : undefined,
        ntrpRange: formData.ntrpMin && formData.ntrpMax ? {
          min: parseFloat(formData.ntrpMin),
          max: parseFloat(formData.ntrpMax),
        } : undefined,
      },
    };

    if (editingAd) {
      // 수정
      const success = AdManager.updateAd(editingAd.id, adData);
      if (success) {
        setAds([...mockAds]);
        Alert.alert('완료', '광고가 수정되었습니다.');
      }
    } else {
      // 추가
      AdManager.addAd(adData);
      setAds([...mockAds]);
      Alert.alert('완료', '새 광고가 추가되었습니다.');
    }

    setShowAddModal(false);
    resetForm();
  };

  const handleToggleAd = (adId: string) => {
    const success = AdManager.toggleAdStatus(adId);
    if (success) {
      setAds([...mockAds]);
    }
  };

  const handleDeleteAd = (adId: string) => {
    const ad = ads.find(a => a.id === adId);
    if (!ad) return;

    Alert.alert(
      '광고 삭제',
      `"${ad.title}" 광고를 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => {
          const success = AdManager.deleteAd(adId);
          if (success) {
            setAds([...mockAds]);
            Alert.alert('완료', '광고가 삭제되었습니다.');
          }
        }}
      ]
    );
  };

  const handleAgeGroupToggle = (ageGroup: string) => {
    const newAgeGroups = formData.targetAgeGroups.includes(ageGroup)
      ? formData.targetAgeGroups.filter(ag => ag !== ageGroup)
      : [...formData.targetAgeGroups, ageGroup];
    
    setFormData({ ...formData, targetAgeGroups: newAgeGroups });
  };

  const activeAdsCount = ads.filter(ad => ad.isActive).length;
  const totalViews = ads.reduce((sum, ad) => sum + ad.viewCount, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clickCount, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>광고 관리</Text>
        <Text style={styles.subtitle}>앱 내 광고 생성 및 관리</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 광고 현황 요약 */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>광고 현황</Text>
          
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <ToggleRight size={24} color="#16a34a" />
              <Text style={styles.summaryAmount}>{activeAdsCount}개</Text>
              <Text style={styles.summaryLabel}>활성 광고</Text>
            </View>
            <View style={styles.summaryCard}>
              <Eye size={24} color="#3b82f6" />
              <Text style={styles.summaryAmount}>{String(totalViews.toLocaleString())}</Text>
              <Text style={styles.summaryLabel}>총 조회수</Text>
            </View>
            <View style={styles.summaryCard}>
              <MousePointer size={24} color="#ec4899" />
              <Text style={styles.summaryAmount}>{String(totalClicks)}</Text>
              <Text style={styles.summaryLabel}>총 클릭수</Text>
            </View>
          </View>
        </View>
        {/* 광고 추가 버튼 */}
        <View style={styles.addSection}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddAd}>
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>새 광고 추가</Text>
          </TouchableOpacity>
        </View>

        {/* 광고 목록 */}
        <View style={styles.adsSection}>
          <Text style={styles.sectionTitle}>광고 목록 ({ads.length})</Text>
          
          {ads.map((ad) => (
            <View key={ad.id} style={styles.adCard}>
              <View style={styles.adHeader}>
                <View style={styles.adInfo}>
                  <Text style={styles.adTitle} numberOfLines={1}>
                    {ad.title}
                  </Text>
                  <Text style={styles.adDescription} numberOfLines={2}>
                    {ad.description}
                  </Text>
                </View>
                <View style={styles.adControls}>
                  <TouchableOpacity onPress={() => handleToggleAd(ad.id)}>
                    {ad.isActive ? (
                      <ToggleRight size={24} color="#16a34a" />
                    ) : (
                      <ToggleLeft size={24} color="#9ca3af" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              
              {ad.imageUrl && (
                <View style={styles.adPreview}>
                  <Image 
                    source={{ uri: ad.imageUrl }} 
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                </View>
              )}
              
              <View style={styles.adStats}>
                <View style={styles.statItem}>
                  <Eye size={14} color="#6b7280" />
                  <Text style={styles.statText}>{ad.viewCount}</Text>
                </View>
                <View style={styles.statItem}>
                  <MousePointer size={14} color="#6b7280" />
                  <Text style={styles.statText}>{ad.clickCount}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.priorityText}>우선순위: {ad.priority}</Text>
                </View>
              </View>
              
              <View style={styles.adActions}>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => handleEditAd(ad)}
                >
                  <Edit size={16} color="#3b82f6" />
                  <Text style={styles.editButtonText}>수정</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteAd(ad.id)}
                >
                  <Trash2 size={16} color="#dc2626" />
                  <Text style={styles.deleteButtonText}>삭제</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 광고 추가/수정 모달 */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingAd ? '광고 수정' : '새 광고 추가'}
            </Text>
            <TouchableOpacity onPress={handleSaveAd}>
              <Text style={styles.modalSaveText}>저장</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>기본 정보</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>제목 *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.title}
                  onChangeText={(text) => setFormData({...formData, title: text})}
                  placeholder="광고 제목을 입력하세요"
                  placeholderTextColor="#9ca3af"
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>설명 *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.description}
                  onChangeText={(text) => setFormData({...formData, description: text})}
                  placeholder="광고 설명을 입력하세요"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>이미지 URL</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.imageUrl}
                  onChangeText={(text) => setFormData({...formData, imageUrl: text})}
                  placeholder="https://example.com/image.jpg"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>링크 URL</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.linkUrl}
                  onChangeText={(text) => setFormData({...formData, linkUrl: text})}
                  placeholder="https://example.com"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>버튼 텍스트 *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.buttonText}
                  onChangeText={(text) => setFormData({...formData, buttonText: text})}
                  placeholder="예: 보러가기, 구매하기"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>디자인</Text>
              
              <View style={styles.colorRow}>
                <View style={styles.colorGroup}>
                  <Text style={styles.inputLabel}>배경색</Text>
                  <View style={styles.colorOptions}>
                    {['#8b5cf6', '#16a34a', '#dc2626', '#f59e0b', '#3b82f6', '#ec4899'].map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          formData.backgroundColor === color && styles.colorOptionSelected
                        ]}
                        onPress={() => setFormData({...formData, backgroundColor: color})}
                      />
                    ))}
                  </View>
                </View>
                
                <View style={styles.colorGroup}>
                  <Text style={styles.inputLabel}>텍스트색</Text>
                  <View style={styles.colorOptions}>
                    {['#ffffff', '#000000'].map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          formData.textColor === color && styles.colorOptionSelected,
                          color === '#ffffff' && styles.whiteColorOption
                        ]}
                        onPress={() => setFormData({...formData, textColor: color})}
                      />
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>우선순위</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.priority}
                  onChangeText={(text) => setFormData({...formData, priority: text})}
                  placeholder="1"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
                <Text style={styles.inputHint}>낮은 숫자일수록 먼저 표시됩니다</Text>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>타겟 설정</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>성별</Text>
                <View style={styles.radioGroup}>
                  {[
                    { key: 'all', label: '전체' },
                    { key: '남성', label: '남성' },
                    { key: '여성', label: '여성' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.radioButton,
                        formData.targetGender === option.key && styles.radioButtonActive
                      ]}
                      onPress={() => setFormData({...formData, targetGender: option.key as any})}
                    >
                      <Text style={[
                        styles.radioText,
                        formData.targetGender === option.key && styles.radioTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>나이대</Text>
                <View style={styles.checkboxGroup}>
                  {['20대', '30대', '40대', '50대+'].map((ageGroup) => (
                    <TouchableOpacity
                      key={ageGroup}
                      style={[
                        styles.checkboxButton,
                        formData.targetAgeGroups.includes(ageGroup) && styles.checkboxButtonActive
                      ]}
                      onPress={() => handleAgeGroupToggle(ageGroup)}
                    >
                      <Text style={[
                        styles.checkboxText,
                        formData.targetAgeGroups.includes(ageGroup) && styles.checkboxTextActive
                      ]}>
                        {ageGroup}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NTRP 범위</Text>
                <View style={styles.ntrpRow}>
                  <TextInput
                    style={[styles.textInput, styles.ntrpInput]}
                    value={formData.ntrpMin}
                    onChangeText={(text) => setFormData({...formData, ntrpMin: text})}
                    placeholder="최소"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                  <Text style={styles.ntrpSeparator}>~</Text>
                  <TextInput
                    style={[styles.textInput, styles.ntrpInput]}
                    value={formData.ntrpMax}
                    onChangeText={(text) => setFormData({...formData, ntrpMax: text})}
                    placeholder="최대"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* 미리보기 */}
            {formData.title && (
              <View style={styles.previewSection}>
                <Text style={styles.modalSectionTitle}>미리보기</Text>
                <View style={[styles.previewCard, { backgroundColor: formData.backgroundColor }]}>
                  <Text style={[styles.previewTitle, { color: formData.textColor }]}>
                    {formData.title}
                  </Text>
                  <Text style={[styles.previewDescription, { color: formData.textColor, opacity: 0.9 }]}>
                    {formData.description}
                  </Text>
                  {formData.imageUrl && (
                    <Image 
                      source={{ uri: formData.imageUrl }} 
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={[styles.previewButton, { backgroundColor: formData.textColor }]}>
                    <Text style={[styles.previewButtonText, { color: formData.backgroundColor }]}>
                      {formData.buttonText}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
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
  summarySection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  addSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  adsSection: {
    marginHorizontal: 16,
  },
  adCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  adInfo: {
    flex: 1,
    marginRight: 12,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  adDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  adControls: {
    alignItems: 'center',
  },
  adPreview: {
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
  },
  adStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  priorityText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  adActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#dbeafe',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  bottomPadding: {
    height: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a',
  },
  modalContent: {
    flex: 1,
    paddingTop: 16,
  },
  modalSection: {
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
  modalSectionTitle: {
    fontSize: 16,
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
  inputHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 20,
  },
  colorGroup: {
    flex: 1,
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#374151',
  },
  whiteColorOption: {
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  radioButtonActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  radioText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  radioTextActive: {
    color: '#ffffff',
  },
  checkboxGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkboxButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  checkboxButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkboxText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  checkboxTextActive: {
    color: '#ffffff',
  },
  ntrpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ntrpInput: {
    flex: 1,
  },
  ntrpSeparator: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  previewSection: {
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
  previewCard: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  previewDescription: {
    fontSize: 14,
    fontWeight: '500',
  },
  previewButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});