import { Tabs } from 'expo-router';
import { Users, Plus, ClipboardList, MessageCircle, Wallet } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useMatches } from '../../contexts/MatchContext';
import { router } from 'expo-router';
import { View, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import React from 'react';
import {
  getUnreadNotificationCount,
  subscribeToNotifications,
  markNotificationsAsRead,
} from '../../lib/supabase';
import { ToastNotification } from '../../components/ToastNotification';
import { AppToast } from '../../components/AppToast';
import { Colors, Hairline, IconStroke } from '../../constants/theme';

const TAB_ICON_SIZE = 22;

function Dot() {
  return <View style={styles.dot} />;
}

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

    const unsubscribe = subscribeToNotifications(user.id, payload => {
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
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.textTertiary} />
      </View>
    );
  }

  return (
    <>
      <ToastNotification />
      <AppToast />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.text,
          tabBarInactiveTintColor: Colors.textTertiary,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopWidth: Hairline,
            borderTopColor: Colors.border,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'web' ? 8 : 6,
            height: Platform.OS === 'web' ? 64 : 76,
            elevation: 0,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: -0.1,
            marginTop: 2,
          },
          tabBarItemStyle: {
            paddingVertical: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '매치찾기',
            tabBarIcon: ({ color, focused }) => (
              <Users
                size={TAB_ICON_SIZE}
                color={color}
                strokeWidth={focused ? 2.2 : IconStroke}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: '채팅',
            tabBarIcon: ({ color, focused }) => (
              <View>
                <MessageCircle
                  size={TAB_ICON_SIZE}
                  color={color}
                  strokeWidth={focused ? 2.2 : IconStroke}
                />
                {(hasNewChatRoom || unreadCount > 0) && <Dot />}
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
            title: '나의매치',
            tabBarIcon: ({ color, focused }) => (
              <View>
                <ClipboardList
                  size={TAB_ICON_SIZE}
                  color={color}
                  strokeWidth={focused ? 2.2 : IconStroke}
                />
                {(hasNewApplication ||
                  hasRejected ||
                  hasPaymentConfirmed ||
                  paymentNeededCount > 0) && <Dot />}
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
            title: '매치판매',
            tabBarIcon: ({ color, focused }) => (
              <Plus size={TAB_ICON_SIZE} color={color} strokeWidth={focused ? 2.4 : 2} />
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
            title: '수익관리',
            tabBarIcon: ({ color, focused }) => (
              <Wallet
                size={TAB_ICON_SIZE}
                color={color}
                strokeWidth={focused ? 2.2 : IconStroke}
              />
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

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
  },
  dot: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.accent,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
});
