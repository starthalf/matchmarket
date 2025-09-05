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
      const isAdmin = await AdminService.isCurrentUserAdmin();
      if (!isAdmin) {
        setAdminUser(null);
      }
      // 관리자인 경우 추가 정보 로드 필요
    } catch (error) {
      console.error('관리자 상태 확인 오류:', error);
      setAdminUser(null);
    } finally {
      setIsAdminLoading(false);
    }
  };

  const adminLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const result = await AdminService.adminLogin(email, password);
    
    if (result.success && result.adminUser) {
      setAdminUser(result.adminUser);
    }
    
    return { success: result.success, error: result.error };
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