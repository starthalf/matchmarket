import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/tennis';
import { mockUsers } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  gender: '남성' | '여성';
  ageGroup: '20대' | '30대' | '40대' | '50대+';
  ntrp: number;
  experience: number;
  playStyle: '공격형' | '수비형' | '올라운드';
  careerType: '동호인' | '대학선수' | '실업선수';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(false);

  // 앱 시작 시 저장된 로그인 정보 확인
  useEffect(() => {
    mounted.current = true;
    checkStoredAuth();
    return () => {
      mounted.current = false;
    };
  }, []);

  const checkStoredAuth = async () => {
    try {
      let storedUserId: string | null = null;
      
      if (Platform.OS === 'web') {
        // 웹에서는 localStorage 사용
        if (typeof window !== 'undefined') {
          storedUserId = localStorage.getItem('userId');
        }
      } else {
        // 네이티브에서는 AsyncStorage 사용
        storedUserId = await AsyncStorage.getItem('userId');
      }
      
      if (storedUserId) {
        // 실제로는 서버에서 사용자 정보를 가져와야 함
        const foundUser = mockUsers.find(u => u.id === storedUserId);
        if (foundUser) {
          if (mounted.current) {
            setUser(foundUser);
          }
        }
      }
    } catch (error) {
      console.error('저장된 인증 정보 확인 실패:', error);
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 실제로는 서버 API 호출
      // 여기서는 mockUsers에서 이메일로 찾기 (시뮬레이션)
      const foundUser = mockUsers.find(u => u.name === email); // 임시로 name을 email로 사용
      
      if (!foundUser) {
        return { success: false, error: '존재하지 않는 계정입니다.' };
      }

      // 비밀번호 확인 (실제로는 해시 비교)
      if (password !== '1234') { // 임시 비밀번호
        return { success: false, error: '비밀번호가 올바르지 않습니다.' };
      }

      // 로그인 성공
      if (mounted.current) {
        setUser(foundUser);
      }
      
      // 플랫폼별 저장
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          localStorage.setItem('userId', foundUser.id);
        }
      } else {
        await AsyncStorage.setItem('userId', foundUser.id);
      }
      
      return { success: true };
    } catch (error) {
      console.error('로그인 실패:', error);
      return { success: false, error: '로그인 중 오류가 발생했습니다.' };
    }
  };

  const signup = async (userData: SignupData): Promise<{ success: boolean; error?: string }> => {
    try {
      // 실제로는 서버 API 호출
      // 여기서는 새 사용자 생성 시뮬레이션
      
      // 이메일 중복 확인
      const existingUser = mockUsers.find(u => u.name === userData.email);
      if (existingUser) {
        return { success: false, error: '이미 존재하는 이메일입니다.' };
      }

      // 새 사용자 생성
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: userData.name,
        gender: userData.gender,
        ageGroup: userData.ageGroup,
        ntrp: userData.ntrp,
        experience: userData.experience,
        playStyle: userData.playStyle,
        careerType: userData.careerType,
        certification: { 
          ntrp: 'none', 
          career: 'none', 
          youtube: 'none', 
          instagram: 'none' 
        },
        viewCount: 0,
        likeCount: 0,
        avgRating: 0,
      };

      // mockUsers에 추가 (실제로는 서버에 저장)
      mockUsers.push(newUser);
      
      // 자동 로그인
      if (mounted.current) {
        setUser(newUser);
      }
      
      // 플랫폼별 저장
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          localStorage.setItem('userId', newUser.id);
        }
      } else {
        await AsyncStorage.setItem('userId', newUser.id);
      }
      
      return { success: true };
    } catch (error) {
      console.error('회원가입 실패:', error);
      return { success: false, error: '회원가입 중 오류가 발생했습니다.' };
    }
  };

  const logout = async () => {
    try {
      if (mounted.current) {
        setUser(null);
      }
      
      // 플랫폼별 삭제
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('userId');
        }
      } else {
        await AsyncStorage.removeItem('userId');
      }
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}