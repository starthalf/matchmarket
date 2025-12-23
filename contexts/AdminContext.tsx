// contexts/AdminContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminService, AdminUser } from '../lib/adminService';
import { supabase } from '../lib/supabase';

// 데모 관리자 이메일 목록
const DEMO_ADMIN_EMAILS = ['admin@demo.com', 'hcgkhlee@gmail.com'];

interface AdminContextType {
  adminUser: AdminUser | null;
  isAdminLoading: boolean;
  isAdmin: boolean;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => Promise<void>;
  checkAdminStatus: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  const checkAdminStatus = async () => {
    setIsAdminLoading(true);
    try {
      const isAdminResult = await AdminService.isCurrentUserAdmin();
      if (isAdminResult) {
        // 현재 로그인된 사용자 이메일 가져오기
        let currentEmail = 'admin@demo.com';
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) {
            currentEmail = user.email;
          }
        }
        
        const dummyAdminUser: AdminUser = {
          id: 'demo-admin-id',
          userId: 'demo-user-id', 
          email: currentEmail,
          role: 'admin',
          permissions: ['read', 'write', 'admin'],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setAdminUser(dummyAdminUser);
      } else {
        setAdminUser(null);
      }
    } catch (error) {
      console.error('관리자 상태 확인 오류:', error);
      setAdminUser(null);
    } finally {
      setIsAdminLoading(false);
    }
  };

  // 초기 체크
  useEffect(() => {
    checkAdminStatus();
  }, []);

  // ✅ Supabase auth 상태 변경 감지 - 로그인/로그아웃 시 자동으로 관리자 상태 체크
  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AdminContext: auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // 로그인 시 관리자 여부 체크
          if (session.user.email && DEMO_ADMIN_EMAILS.includes(session.user.email)) {
            const demoAdminUser: AdminUser = {
              id: 'demo-admin-id',
              userId: session.user.id,
              email: session.user.email,
              role: 'admin',
              permissions: ['read', 'write', 'admin'],
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            setAdminUser(demoAdminUser);
            console.log('AdminContext: 관리자 로그인 감지됨:', session.user.email);
          } else {
            // 일반 사용자인 경우에도 DB 체크
            await checkAdminStatus();
          }
        } else if (event === 'SIGNED_OUT') {
          setAdminUser(null);
          console.log('AdminContext: 로그아웃 감지됨');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const adminLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 데모 환경에서의 간단한 로그인 처리
      if (DEMO_ADMIN_EMAILS.includes(email)) {
        const demoAdminUser: AdminUser = {
          id: 'demo-admin-id',
          userId: 'demo-user-id',
          email: email, 
          role: 'admin',
          permissions: ['read', 'write', 'admin'],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setAdminUser(demoAdminUser);
        return { success: true };
      }

      // 실제 Supabase 로그인
      const result = await AdminService.adminLogin(email, password);
      
      if (result.success && result.adminUser) {
        setAdminUser(result.adminUser);
      }
      
      return { success: result.success, error: result.error };
    } catch (error) {
      console.error('관리자 로그인 오류:', error);
      return { success: false, error: '로그인 중 오류가 발생했습니다.' };
    }
  };

  const adminLogout = async () => {
    try {
      // Supabase 로그아웃
      if (supabase) {
        await supabase.auth.signOut();
      }
      
      setAdminUser(null);
    } catch (error) {
      console.error('관리자 로그아웃 오류:', error);
    }
  };

  return (
    <AdminContext.Provider value={{
      adminUser,
      isAdminLoading,
      isAdmin: !!adminUser,
      adminLogin,
      adminLogout,
      checkAdminStatus
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}