import { Tabs } from 'expo-router';
import { Users, Plus, ClipboardList, MessageCircle, Wallet } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useMatches } from '../../contexts/MatchContext';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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
 * 탭바 높이 계산
 * ------------------------------------------------------------------
 * 라벨이 잘리던 원인:
 *  1) height를 고정값(68)으로 박아놓고 padding까지 더해서 실제 콘텐츠 영역이 부족했음
 *  2) 웹/PWA standalone에서 하단 safe-area(홈 인디케이터)를 안 더해줘서 잘림
 *
 * 해결: 콘텐츠 높이를 명시적으로 계산하고 insets.bottom을 그 위에 더한다.
 *   아이콘(22) + 간격(4) + 라벨 lineHeight(15) = 41
 *   + 상단 패딩 8 + 하단 패딩 10 = 59  → 여유 두고 60
 */
const TAB_CONTENT_HEIGHT = 60;
const TAB_PADDING_TOP = 8;
const TAB_PADDING_BOTTOM = 10;

function Dot() {
  return <View style={styles.dot} />;
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

  return (
    <>
      <ToastNotification />
      <AppToast />
      <Tabs
        screenOptions={{
          headerShown: false,
          // 선택 시 핑크
          tabBarActiveTintColor: Colors.accent,
          tabBarInactiveTintColor: Colors.textTertiary,
          // 메뉴 이름 항상 표시
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopWidth: Hairline,
            borderTopColor: Colors.border,
            paddingTop: TAB_PADDING_TOP,
            // 홈 인디케이터/하단 노치만큼 더 준다 (잘림 방지의 핵심)
            paddingBottom: TAB_PADDING_BOTTOM + insets.bottom,
            height: TAB_CONTENT_HEIGHT + insets.bottom,
            elevation: 0,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            lineHeight: 15, // ← 명시 안 하면 웹에서 디센더(ㅈ, ㅍ 등)가 잘린다
            fontWeight: '600',
            letterSpacing: -0.2,
            includeFontPadding: false,
            margin: 0,
            padding: 0,
          },
          tabBarIconStyle: {
            marginTop: 0,
            marginBottom: 2,
          },
          tabBarItemStyle: {
            paddingVertical: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '매치찾기',
            tabBarLabel: '매치찾기',
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
            tabBarLabel: '채팅',
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
            tabBarLabel: '나의매치',
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
            tabBarLabel: '매치판매',
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
            tabBarLabel: '수익관리',
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
    backgroundColor: Colors.danger,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
});
