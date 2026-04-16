// contexts/AdminContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminService, AdminUser } from '../lib/adminService';
import { supabase } from '../lib/supabase';

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
        let currentEmail = '';
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) {
            currentEmail = user.email;
          }
        }
        
        const adminUserData: AdminUser = {
          id: 'admin-id',
          userId: 'admin-user-id', 
          email: currentEmail,
          role: 'admin',
          permissions: ['read', 'write', 'admin'],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setAdminUser(adminUserData);
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

  // Supabase auth 상태 변경 감지
  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AdminContext: auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await checkAdminStatus();
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
      // 실제 Supabase Auth + admin_users 테이블로 검증
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