// contexts/AdminContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminService, AdminUser } from '../lib/adminService';

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

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    setIsAdminLoading(true);
    try {
      const isAdminResult = await AdminService.isCurrentUserAdmin();
      if (isAdminResult) {
        // 관리자인 경우 더미 AdminUser 객체 생성
        const dummyAdminUser: AdminUser = {
          id: 'demo-admin-id',
          userId: 'demo-user-id', 
          email: 'admin@demo.com',
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

  const adminLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 데모 환경에서의 간단한 로그인 처리
      if (email === 'admin@demo.com' && password === 'admin123') {
        const demoAdminUser: AdminUser = {
          id: 'demo-admin-id',
          userId: 'demo-user-id',
          email: 'admin@demo.com', 
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
      const { supabase } = await import('../lib/supabase');
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
      isAdmin: !!adminUser, // adminUser가 있으면 관리자
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