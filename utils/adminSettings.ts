import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
// 관리자 설정 관리 유틸리티
export interface AdminSettings {
  // 시스템 설정
  maintenanceMode: boolean;
  autoBackup: boolean;
  debugMode: boolean;
  
  // 알림 설정
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  
  // 결제 설정
  platformFee: string;
  withdrawalFee: string;
  minWithdrawalAmount: string;
  withdrawalPeriod: string; // 출금 주기 (일)
  
  // 보안 설정
  twoFactorAuth: boolean;
  sessionTimeout: string;
  maxLoginAttempts: string;
}

export class AdminSettingsManager {
  private static STORAGE_KEY = 'admin_settings';
  
  // 기본 설정값
  private static DEFAULT_SETTINGS: AdminSettings = {
    maintenanceMode: false,
    autoBackup: true,
    debugMode: false,
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    platformFee: '15',
    withdrawalFee: '0',
    minWithdrawalAmount: '10000',
    withdrawalPeriod: '14', // 기본 14일
    twoFactorAuth: true,
    sessionTimeout: '30',
    maxLoginAttempts: '5',
  };

  /**
   * 설정 저장
   */
  static async saveSettings(settings: AdminSettings): Promise<void> {
    try {
      const settingsJson = JSON.stringify(settings);
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.STORAGE_KEY, settingsJson);
        }
      } else {
        await AsyncStorage.setItem(this.STORAGE_KEY, settingsJson);
      }
    } catch (error) {
      console.error('설정 저장 오류:', error);
    }
  }

  /**
   * 설정 불러오기
   */
  static async getSettings(): Promise<AdminSettings> {
    try {
      let stored: string | null = null;
      
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          stored = localStorage.getItem(this.STORAGE_KEY);
        }
      } else {
        stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      }
      
      if (stored) {
        try {
          return { ...this.DEFAULT_SETTINGS, ...JSON.parse(stored) };
        } catch (error) {
          console.error('설정 파싱 오류:', error);
        }
      }
    } catch (error) {
      console.error('설정 불러오기 오류:', error);
    }
    return this.DEFAULT_SETTINGS;
  }

  /**
   * 출금 주기 가져오기 (일수)
   */
  static async getWithdrawalPeriod(): Promise<number> {
    const settings = await this.getSettings();
    return parseInt(settings.withdrawalPeriod) || 14;
  }

  /**
   * 특정 설정값 업데이트
   */
  static async updateSetting(key: keyof AdminSettings, value: any): Promise<void> {
    const settings = await this.getSettings();
    settings[key] = value;
    await this.saveSettings(settings);
  }
}