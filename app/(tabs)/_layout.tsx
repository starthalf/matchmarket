import { Tabs } from 'expo-router';
import { Users, Plus, ClipboardList, MessageCircle, DollarSign } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useMatches } from '../../contexts/MatchContext';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import React from 'react';
import { getUnreadNotificationCount, subscribeToNotifications, markNotificationsAsRead } from '../../lib/supabase';
import { ToastNotification } from '../../components/ToastNotification';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const { unreadCount } = useChat();
  const { matches } = useMatches();

  const [hasNewApplication, setHasNewApplication] = React.useState(false);
  const [hasNewChatRoom, setHasNewChatRoom] = React.useState(false);
  const [hasRejected, setHasRejected] = React.useState(false);
  const [hasPaymentConfirmed, setHasPaymentConfirmed] = React.useState(false);
  
  React.useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      const appCount = await getUnreadNotificationCount(user.id, 'new_application');
      const chatCount = await getUnreadNotificationCount(user.id, 'new_chat_room');
      const rejectedCount = await getUnreadNotificationCount(user.id, 'rejected');
      const paymentCount = await getUnreadNotificationCount(user.id, 'payment_confirmed');
      
      setHasNewApplication(appCount > 0);
      setHasNewChatRoom(chatCount > 0);
      setHasRejected(rejectedCount > 0);
      setHasPaymentConfirmed(paymentCount > 0);
    };

    loadNotifications();

    const unsubscribe = subscribeToNotifications(user.id, (payload) => {
      console.log('새 알림:', payload);
      loadNotifications();
    });

    return () => unsubscribe();
  }, [user]);

  const paymentNeededCount = matches.filter(match => {
    const myApplication = match.applications?.find(app => app.userId === user?.id);
    if (!myApplication || myApplication.status !== 'approved' || !myApplication.approvedAt) {
      return false;
    }
    
    const approvedTime = new Date(myApplication.approvedAt).getTime();
    const now = new Date().getTime();
    const elapsedSeconds = Math.floor((now - approvedTime) / 1000);
    const remainingSeconds = Math.max(0, 300 - elapsedSeconds);
    
    return remainingSeconds > 0;
  }).length;

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ec4899" />
      </View>
    );
  }

  return (
    <>
      <ToastNotification />
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
          name="chat"
          options={{
            title: "채팅",
            tabBarIcon: ({ size, color }) => (
              <View style={{ position: 'relative' }}>
                <MessageCircle size={size} color={color} />
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
                await markNotificationsAsRead(user.id, 'new_chat_room');
                setHasNewChatRoom(false);
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
                {(hasNewApplication || hasRejected || hasPaymentConfirmed || paymentNeededCount > 0) && (
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
          name="earnings"
          options={{
            title: "수익관리",
            tabBarIcon: ({ size, color }) => (
              <DollarSign size={size} color={color} />
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
      </Tabs>
    </>
  );
}