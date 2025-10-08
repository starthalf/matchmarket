// contexts/ChatContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useMatches } from './MatchContext';
import { supabaseAdmin } from '../lib/supabase';

interface ChatContextType {
  unreadCount: number;
  markAllAsRead: () => void;
}

const ChatContext = createContext<ChatContextType>({
  unreadCount: 0,
  markAllAsRead: () => {}
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { matches } = useMatches();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastCheckedTime, setLastCheckedTime] = useState<string>(new Date().toISOString());

  // 내가 참여한 채팅방 ID 목록
  const myChatRoomIds = matches
    .filter(match => {
      return match.sellerId === user?.id || 
             match.applications?.some(app => 
               app.userId === user?.id && app.status === 'approved'
             );
    })
    .map(match => `chat_${match.id}`);

  // 읽지 않은 메시지 개수 확인
  const checkUnreadMessages = async () => {
    if (!user || myChatRoomIds.length === 0) {
      setUnreadCount(0);
      return;
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('chat_messages')
        .select('id', { count: 'exact', head: false })
        .in('room_id', myChatRoomIds)
        .neq('sender_id', user.id) // 내가 보낸 메시지는 제외
        .gte('timestamp', lastCheckedTime); // 마지막 확인 시간 이후

      if (!error && data) {
        setUnreadCount(data.length);
      }
    } catch (error) {
      console.error('읽지 않은 메시지 확인 오류:', error);
    }
  };

  // 모든 메시지를 읽음 처리
  const markAllAsRead = () => {
    setLastCheckedTime(new Date().toISOString());
    setUnreadCount(0);
  };

  // 초기 로드 시 읽지 않은 메시지 확인
  useEffect(() => {
    if (user && myChatRoomIds.length > 0) {
      checkUnreadMessages();
    }
  }, [user, myChatRoomIds.length]);

  // 실시간 구독으로 새 메시지 감지
  useEffect(() => {
    if (!user || myChatRoomIds.length === 0) return;

    const subscription = supabaseAdmin
      .channel('all_chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMsg = payload.new;
          
          // 내 채팅방이고, 내가 보낸 메시지가 아닐 때만
          if (
            myChatRoomIds.includes(newMsg.room_id) &&
            newMsg.sender_id !== user.id &&
            new Date(newMsg.timestamp) > new Date(lastCheckedTime)
          ) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, myChatRoomIds, lastCheckedTime]);

  return (
    <ChatContext.Provider value={{ unreadCount, markAllAsRead }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);