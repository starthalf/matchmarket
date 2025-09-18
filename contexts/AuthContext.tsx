import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { User } from '../types/tennis';
import { mockUsers, updateCurrentUser } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

interface SupabaseUser {
  id: string;
  name: string;
  gender: '남성' | '여성';
  age_group: '20대' | '30대' | '40대' | '50대+';
  ntrp: number;
  experience: number;
  play_style: '공격형' | '수비형' | '올라운드';
  career_type: '동호인' | '선수';
  certification_ntrp: 'none' | 'pending' | 'verified';
  certification_career: 'none' | 'pending' | 'verified';
  certification_youtube: 'none' | 'pending' | 'verified';
  certification_instagram: 'none' | 'pending' | 'verified';
  profile_image?: string;
  view_count: number;
  like_count: number;
  avg_rating: number;
  created_at: string;
  updated_at: string;
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
  careerType: '동호인' | '선수';
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
      if (!supabase) {
        console.warn('Supabase가 설정되지 않음. 모의 데이터 사용.');
        // Fallback to mock data
        let storedUserId: string | null = null;
        
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            storedUserId = localStorage.getItem('userId');
          }
        } else {
          storedUserId = await AsyncStorage.getItem('userId');
        }
        
        if (storedUserId) {
          const foundUser = mockUsers.find(u => u.id === storedUserId);
          if (foundUser && mounted.current) {
            setUser(foundUser);
          }
        }
        return;
      }

      // Supabase 세션 확인
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('세션 확인 오류:', error);
        return;
      }

      if (session?.user) {
        // 사용자 프로필 정보 가져오기
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('사용자 프로필 조회 오류:', profileError);
          return;
        }

        if (userProfile && mounted.current) {
          const user = convertSupabaseUserToUser(userProfile);
          setUser(user);
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

  // Supabase 사용자를 앱 User 타입으로 변환
  const convertSupabaseUserToUser = (supabaseUser: SupabaseUser): User => {
    return {
      id: supabaseUser.id,
      name: supabaseUser.name,
      gender: supabaseUser.gender,
      ageGroup: supabaseUser.age_group,
      ntrp: supabaseUser.ntrp,
      experience: supabaseUser.experience,
      playStyle: supabaseUser.play_style,
      careerType: supabaseUser.career_type,
      certification: {
        ntrp: supabaseUser.certification_ntrp,
        career: supabaseUser.certification_career,
        youtube: supabaseUser.certification_youtube,
        instagram: supabaseUser.certification_instagram,
      },
      profileImage: supabaseUser.profile_image,
      viewCount: supabaseUser.view_count,
      likeCount: supabaseUser.like_count,
      avgRating: supabaseUser.avg_rating,
    };
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!supabase) {
        console.warn('Supabase가 설정되지 않음. 모의 데이터로 로그인 시도.');
        // Fallback to mock data
        const foundUser = mockUsers.find(u => u.name === email);
        
        if (!foundUser) {
          return { success: false, error: '존재하지 않는 계정입니다.' };
        }

        if (password !== '1234') {
          return { success: false, error: '비밀번호가 올바르지 않습니다.' };
        }

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
      }

      // Supabase 인증 로그인
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // 사용자 프로필 정보 가져오기
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('사용자 프로필 조회 오류:', profileError);
          return { success: false, error: '사용자 프로필을 찾을 수 없습니다.' };
        }

        if (mounted.current) {
          const user = convertSupabaseUserToUser(userProfile);
          setUser(user);
        }
        return { success: true };
      }

      return { success: false, error: '로그인에 실패했습니다.' };
    } catch (error) {
      console.error('로그인 실패:', error);
      return { success: false, error: '로그인 중 오류가 발생했습니다.' };
    }
  };

  const signup = async (userData: SignupData): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!supabase) {
        console.warn('Supabase가 설정되지 않음. 모의 데이터로 회원가입 시도.');
        // Fallback to mock data
        const existingUser = mockUsers.find(u => u.name === userData.email);
        if (existingUser) {
          return { success: false, error: '이미 존재하는 이메일입니다.' };
        }

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

        mockUsers.push(newUser);
        
        if (mounted.current) {
          setUser(newUser);
        }
        
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            localStorage.setItem('userId', newUser.id);
          }
        } else {
          await AsyncStorage.setItem('userId', newUser.id);
        }
        
        return { success: true };
      }

      // Supabase 인증 회원가입
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // 사용자 프로필 정보를 users 테이블에 저장
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            name: userData.name,
            gender: userData.gender,
            age_group: userData.ageGroup,
            ntrp: userData.ntrp,
            experience: userData.experience,
            play_style: userData.playStyle,
            career_type: userData.careerType,
          });

        if (profileError) {
          console.error('프로필 저장 오류:', profileError);
          return { success: false, error: '프로필 저장에 실패했습니다.' };
        }

        // 생성된 프로필 정보 가져오기
// 수정된 코드
let userProfile;
let fetchError;

// 프로필이 생성될 때까지 잠시 대기
await new Promise(resolve => setTimeout(resolve, 500));

const { data: profileData, error: profileError } = await supabase
  .from('users')
  .select('*')
  .eq('id', data.user.id);

if (profileError) {
  console.error('프로필 조회 오류:', profileError);
  return { success: false, error: '프로필 조회에 실패했습니다.' };
}

if (!profileData || profileData.length === 0) {
  console.error('프로필이 생성되지 않았습니다.');
  return { success: false, error: '프로필 생성에 실패했습니다.' };
}

userProfile = profileData[0];

        if (mounted.current) {
          const user = convertSupabaseUserToUser(userProfile);
          setUser(user);
        }

        return { success: true };
      }

      return { success: false, error: '회원가입에 실패했습니다.' };
    } catch (error) {
      console.error('회원가입 실패:', error);
      return { success: false, error: '회원가입 중 오류가 발생했습니다.' };
    }
  };

  const logout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      
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

  // Supabase 인증 상태 변경 리스너
  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // 로그인 시 프로필 정보 가져오기
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userProfile && mounted.current) {
            const user = convertSupabaseUserToUser(userProfile);
            setUser(user);
          }
        } else if (event === 'SIGNED_OUT') {
          if (mounted.current) {
            setUser(null);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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