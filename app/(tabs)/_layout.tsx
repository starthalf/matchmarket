// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Users, Plus, ClipboardList, MessageCircle } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useMatches } from '../../contexts/MatchContext';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const { unreadCount } = useChat();
  const { matches } = useMatches();
  // 🔥 신규 참가 신청 알림
  const [hasNewApplication, setHasNewApplication] = React.useState(false);
  
  React.useEffect(() => {
    const checkNotification = async () => {
      const value = await AsyncStorage.getItem('hasNewMatchApplication');
      setHasNewApplication(value === 'true');
    };
    checkNotification();
    
    // 1초마다 체크 (실시간 업데이트)
    const interval = setInterval(checkNotification, 1000);
    return () => clearInterval(interval);
  }, []);

  // 입금이 필요한 매치 개수 계산
  const paymentNeededCount = matches.filter(match => {
    const myApplication = match.applications?.find(app => app.userId === user?.id);
    if (!myApplication || myApplication.status !== 'approved' || !myApplication.approvedAt) {
      return false;
    }
    
    // 5분 이내인지 확인
    const approvedTime = new Date(myApplication.approvedAt).getTime();
    const now = new Date().getTime();
    const elapsedSeconds = Math.floor((now - approvedTime) / 1000);
    const remainingSeconds = Math.max(0, 300 - elapsedSeconds);
    
    return remainingSeconds > 0;
  }).length;

  // 로딩 중인 경우만 로딩 화면 표시
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ec4899" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ec4899',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "매치찾기",
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          title: "매치판매",
          tabBarIcon: ({ size, color }) => (
            <Plus size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e: any) => {
            if (!user) {
              e.preventDefault();
              router.push('/auth/login');
            }
          },
        }}
      />
      <Tabs.Screen
        name="match-management"
        options={{
          title: "매치관리",
          tabBarIcon: ({ size, color }) => (
            <ClipboardList size={size} color={color} />
          ),
          // 입금 필요 배지 표시
          tabBarBadge: paymentNeededCount > 0 ? '' : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#ef4444',
            minWidth: 8,
            height: 8,
            borderRadius: 4,
            top: 8,
            right: -4,
          },
        }}
        listeners={{
          tabPress: (e: any) => {
            if (!user) {
              e.preventDefault();
              router.push('/auth/login');
            }
          },
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "채팅",
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={size} color={color} />
          ),
          // 빨간 점 배지 표시 (읽지 않은 메시지가 있을 때만)
          tabBarBadge: unreadCount > 0 ? '' : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#ef4444',
            minWidth: 8,
            height: 8,
            borderRadius: 4,
            top: 8,
            right: -4,
          },
        }}
        listeners={{
          tabPress: (e: any) => {
            if (!user) {
              e.preventDefault();
              router.push('/auth/login');
            }
          },
        }}
      />
    </Tabs>
  );
}