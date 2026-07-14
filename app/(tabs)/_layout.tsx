import { Tabs } from 'expo-router';
import { Users, Plus, ClipboardList, MessageCircle, Wallet } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useMatches } from '../../contexts/MatchContext';
import { router } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

/**
 * ⚠️ 라벨을 직접 렌더링하는 이유
 * ------------------------------------------------------------------
 * @react-navigation/bottom-tabs v7 + react-native-web 조합에서
 * tabBarShowLabel / tabBarLabelStyle 이 웹에서 제대로 안 먹습니다.
 * (라벨이 잘리거나 아예 사라짐)
 *
 * → tabBarShowLabel: false 로 라이브러리 라벨을 끄고,
 *   tabBarIcon 안에서 [아이콘 + 텍스트] 세로 스택을 직접 그립니다.
 *   이러면 높이/줄간격/색을 100% 우리가 통제하므로 잘릴 수도, 사라질 수도 없습니다.
 */

const TAB_BAR_CONTENT_HEIGHT = 58;

type TabItemProps = {
  icon: React.ReactNode;
  label: string;
  color: string;
  showDot?: boolean;
};

function TabItem({ icon, label, color, showDot }: TabItemProps) {
  return (
    <View style={styles.item}>
      <View style={styles.iconWrap}>
        {icon}
        {showDot && <View style={styles.dot} />}
      </View>
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const { unreadCount } = useChat();
  const { matches } = useMatches();
  const insets = useSafeAreaInsets();

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
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const showMyMatchDot =
    hasNewApplication || hasRejected || hasPaymentConfirmed || paymentNeededCount > 0;
  const showChatDot = hasNewChatRoom || unreadCount > 0;

  return (
    <>
      <ToastNotification />
      <AppToast />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.accent,
          tabBarInactiveTintColor: Colors.textTertiary,
          // 라이브러리 라벨은 끈다 (아래 TabItem에서 직접 그림)
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopWidth: Hairline,
            borderTopColor: Colors.border,
            height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
            paddingTop: 0,
            paddingBottom: insets.bottom,
            elevation: 0,
          },
          // 아이콘 컨테이너가 탭 전체를 채우도록
          tabBarIconStyle: {
            width: '100%',
            height: '100%',
            flex: 1,
          },
          tabBarItemStyle: {
            paddingTop: 0,
            paddingBottom: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '매치찾기',
            tabBarIcon: ({ color, focused }) => (
              <TabItem
                label="매치찾기"
                color={color}
                icon={
                  <Users
                    size={TAB_ICON_SIZE}
                    color={color}
                    strokeWidth={focused ? 2.2 : IconStroke}
                  />
                }
              />
            ),
          }}
        />

        <Tabs.Screen
          name="chat"
          options={{
            title: '채팅',
            tabBarIcon: ({ color, focused }) => (
              <TabItem
                label="채팅"
                color={color}
                showDot={showChatDot}
                icon={
                  <MessageCircle
                    size={TAB_ICON_SIZE}
                    color={color}
                    strokeWidth={focused ? 2.2 : IconStroke}
                  />
                }
              />
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
              <TabItem
                label="나의매치"
                color={color}
                showDot={showMyMatchDot}
                icon={
                  <ClipboardList
                    size={TAB_ICON_SIZE}
                    color={color}
                    strokeWidth={focused ? 2.2 : IconStroke}
                  />
                }
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

        <Tabs.Screen
          name="register"
          options={{
            title: '매치판매',
            tabBarIcon: ({ color, focused }) => (
              <TabItem
                label="매치판매"
                color={color}
                icon={
                  <Plus size={TAB_ICON_SIZE} color={color} strokeWidth={focused ? 2.4 : 2} />
                }
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

        <Tabs.Screen
          name="earnings"
          options={{
            title: '수익관리',
            tabBarIcon: ({ color, focused }) => (
              <TabItem
                label="수익관리"
                color={color}
                icon={
                  <Wallet
                    size={TAB_ICON_SIZE}
                    color={color}
                    strokeWidth={focused ? 2.2 : IconStroke}
                  />
                }
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
  item: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 6,
    paddingBottom: 4,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'center',
    includeFontPadding: false,
  },
  dot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.danger,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
});
