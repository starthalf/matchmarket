// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Users, Plus, ClipboardList, MessageCircle } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useMatches } from '../../contexts/MatchContext';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import React from 'react';
import { getUnreadNotificationCount, subscribeToNotifications, markNotificationsAsRead } from '../../lib/supabase';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const { unreadCount } = useChat();
  const { matches } = useMatches();
  // 🔥 신규 참가 신청 알림
  const [hasNewApplication, setHasNewApplication] = React.useState(false);
  const [hasNewChatRoom, setHasNewChatRoom] = React.useState(false);  // ✅ 추가
  
  React.useEffect(() => {
    const checkNotification = async () => {
      const value = await AsyncStorage.getItem('hasNewMatchApplication');
      setHasNewApplication(value === 'true');
      
      // 🔥 채팅방 알림 체크
      if (user) {
        const chatNotif = await AsyncStorage.getItem(`hasNewChatRoom_${user.id}`);
        setHasNewChatRoom(chatNotif === 'true');
      }
    };
    checkNotification();
    
    // 1초마다 체크 (실시간 업데이트)
    const interval = setInterval(checkNotification, 1000);
    return () => clearInterval(interval);
  }, [user]);  // ✅ user 의존성 추가

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
            <View style={{ position: 'relative' }}>
              <ClipboardList size={size} color={color} />
              {/* 신규 참가 신청 알림 (우선순위 1) */}
              {hasNewApplication && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#ef4444',
                  }}
                />
              )}
              {/* 입금 필요 알림 (우선순위 2) */}
              {!hasNewApplication && paymentNeededCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#ef4444',
                  }}
                />
              )}
            </View>
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
        name="chat"
        options={{
          title: "채팅",
          tabBarIcon: ({ size, color }) => (
            <View style={{ position: 'relative' }}>
              <MessageCircle size={size} color={color} />
              {/* 🔥 새 채팅방 또는 읽지 않은 메시지 알림 */}
              {(hasNewChatRoom || unreadCount > 0) && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#ef4444',
                  }}
                />
              )}
            </View>
          ),
        }}
        listeners={{
          tabPress: async (e: any) => {
            if (!user) {
              e.preventDefault();
              router.push('/auth/login');
            } else {
              // 🔥 채팅 탭 클릭 시 알림 제거
              await AsyncStorage.removeItem(`hasNewChatRoom_${user.id}`);
              setHasNewChatRoom(false);
            }
          },
        }}
      />
    </Tabs>
  );
}