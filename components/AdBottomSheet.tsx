import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Linking,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { X, ExternalLink, Sparkles } from 'lucide-react-native';
import { Ad } from '../types/ad';
import { AdManager } from '../data/mockAds';

interface AdBottomSheetProps {
  ad: Ad | null;
  visible: boolean;
  onClose: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

export function AdBottomSheet({ ad, visible, onClose }: AdBottomSheetProps) {
  const [hideToday, setHideToday] = useState(false);

  if (!ad) return null;

  const handleClose = () => {
    if (hideToday) {
      AdManager.hideAdsToday();
    }
    onClose();
  };

  const handleAdClick = async () => {
    // 클릭수 증가
    AdManager.incrementClickCount(ad.id);
    
    // 외부 링크 열기
    if (ad.linkUrl) {
      try {
        const supported = await Linking.canOpenURL(ad.linkUrl);
        if (supported) {
          await Linking.openURL(ad.linkUrl);
        } else {
          Alert.alert('오류', '링크를 열 수 없습니다.');
        }
      } catch (error) {
        Alert.alert('오류', '링크를 여는 중 오류가 발생했습니다.');
      }
    }
    
    handleClose();
  };

  const handleBackdropPress = () => {
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={handleBackdropPress}
        />
        
        {/* 상단 컨트롤 (바텀시트 바깥) */}
        <View style={styles.topControls}>
          <TouchableOpacity 
            style={styles.hideOption}
            onPress={() => setHideToday(!hideToday)}
          >
            <View style={[
              styles.checkbox, 
              hideToday && styles.checkboxChecked
            ]}>
              {hideToday && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.hideOptionText}>
              오늘 하루 그만보기
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.topCloseText}>닫기</Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.bottomSheet, { backgroundColor: ad.backgroundColor }]}>
          <View style={styles.handle} />
          
          <View style={styles.content}>
            <ScrollView 
              style={styles.scrollableContent}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.textSection}>
                <Text style={[styles.adTitle, { color: ad.textColor }]}>
                  {ad.title}
                </Text>
                <Text style={[styles.adDescription, { color: ad.textColor }]}>
                  {ad.description}
                </Text>
              </View>
              
              {ad.imageUrl && (
                <View style={styles.imageSection}>
                  <Image 
                    source={{ uri: ad.imageUrl }} 
                    style={styles.adImage}
                    resizeMode="contain"
                  />
                </View>
              )}
            </ScrollView>
            
            {/* 하단 고정 버튼 */}
            <View style={styles.bottomButton}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: ad.textColor }]}
                onPress={handleAdClick}
              >
                <Text style={[styles.actionButtonText, { color: ad.backgroundColor }]}>
                  {ad.buttonText}
                </Text>
                <ExternalLink size={16} color={ad.backgroundColor} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: screenHeight * 0.5, // 화면 높이의 50%로 고정
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  topCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  textSection: {
    marginBottom: 16,
  },
  adTitle: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 12,
    textAlign: 'left',
  },
  adDescription: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    opacity: 0.9,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  adImage: {
    width: '100%',
    height: 100,
    borderRadius: 16,
  },
  bottomButton: {
    paddingHorizontal: 4,
    paddingVertical: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  hideOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 0,
    paddingVertical: 8,
    borderRadius: 20,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#ffffff',
  },
  checkmark: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
  hideOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});