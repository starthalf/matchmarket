// app/(tabs)/chat.tsx - Supabase 실시간 채팅 버전
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Send, Users, Calendar, Search } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useMatches } from '../../contexts/MatchContext';
import { useChat } from '../../contexts/ChatContext';
import { ChatRoom, ChatMessage } from '../../types/tennis';
import { useSafeStyles } from '../../constants/Styles';
import { router } from 'expo-router';
import { supabaseAdmin } from '../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

export default function ChatScreen() {
  const { user } = useAuth();
  const { matches } = useMatches();
  const { markAllAsRead } = useChat();
  const safeStyles = useSafeStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roomLastMessages, setRoomLastMessages] = useState<{ [roomId: string]: ChatMessage }>({});
  const scrollViewRef = useRef<ScrollView>(null);

   // 🔥 이 부분 추가 - 채팅 화면 진입 시 알림 제거
  useEffect(() => {
    if (user) {
      AsyncStorage.removeItem(`hasNewChatRoom_${user.id}`);
    }
  }, [user]);

 // 내가 참여한 매치들에서 채팅방 생성
const myChatRooms: ChatRoom[] = matches
  .filter(match => {
    return match.sellerId === user?.id || 
           match.applications?.some(app => 
             app.userId === user?.id && 
             (app.status === 'approved' || app.status === 'confirmed')  // ✅ confirmed도 포함
           );
  })
  .map(match => ({
    id: `chat_${match.id}`,
    matchId: match.id,
    participantIds: [
      match.sellerId,
      ...(match.applications?.filter(app => 
        app.status === 'approved' || app.status === 'confirmed'  // ✅ confirmed도 포함
      ).map(app => app.userId) || [])
    ],
      lastMessage: {
        id: `msg_${match.id}_last`,
        roomId: `chat_${match.id}`,
        senderId: match.sellerId,
        senderName: match.seller.name,
        message: '매치가 생성되었습니다. 안전하고 즐거운 경기 되세요!',
        type: 'system',
        timestamp: match.createdAt,
        isRead: false
      },
      updatedAt: match.createdAt,
      createdAt: match.createdAt,
      matchTitle: match.title,
      matchDate: match.date,
      matchTime: match.time,
      participantCount: 1 + (match.applications?.filter(app => 
  app.status === 'approved' || app.status === 'confirmed'  // ✅ confirmed도 포함
).length || 0)
    }));

  // 검색 필터링
  const filteredRooms = myChatRooms.filter(room =>
    searchQuery === '' ||
    (room as any).matchTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 각 방의 최근 메시지 로드
  const loadRoomLastMessages = async () => {
    if (!user) return;

    try {
      for (const room of myChatRooms) {
        const { data, error } = await supabaseAdmin
          .from('chat_messages')
          .select('*')
          .eq('room_id', room.id)
          .order('timestamp', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const msg = data[0];
          const lastMsg: ChatMessage = {
            id: msg.id,
            roomId: msg.room_id,
            senderId: msg.sender_id,
            senderName: msg.sender_name,
            message: msg.message,
            type: msg.type as 'text' | 'system',
            timestamp: msg.timestamp,
            isRead: msg.is_read
          };

          setRoomLastMessages(prev => ({
            ...prev,
            [room.id]: lastMsg
          }));
        }
      }
    } catch (error) {
      console.error('최근 메시지 로드 오류:', error);
    }
  };

  // 채팅방 목록 변경 시 최근 메시지들 로드
  useEffect(() => {
    if (user && myChatRooms.length > 0) {
      loadRoomLastMessages();
    }
  }, [user, myChatRooms.length]);

  // Supabase에서 메시지 불러오기
  const loadMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('메시지 로드 오류:', error);
        return;
      }

      if (data && data.length > 0) {
        const loadedMessages: ChatMessage[] = data.map(msg => ({
          id: msg.id,
          roomId: msg.room_id,
          senderId: msg.sender_id,
          senderName: msg.sender_name,
          message: msg.message,
          type: msg.type as 'text' | 'system',
          timestamp: msg.timestamp,
          isRead: msg.is_read
        }));
        setMessages(loadedMessages);
      } else {
        // 첫 메시지가 없으면 시스템 메시지 생성
        createInitialMessage(roomId);
      }
    } catch (error) {
      console.error('메시지 로드 예외:', error);
    }
  };

  // 초기 시스템 메시지 생성
  const createInitialMessage = async (roomId: string) => {
    const initialMessage: ChatMessage = {
      id: `msg_${roomId}_system`,
      roomId: roomId,
      senderId: 'system',
      senderName: 'System',
      message: '매치 채팅이 시작되었습니다. 서로 예의를 지켜주세요.',
      type: 'system',
      timestamp: new Date().toISOString(),
      isRead: true
    };

    try {
      await supabaseAdmin
        .from('chat_messages')
        .insert({
          id: initialMessage.id,
          room_id: initialMessage.roomId,
          sender_id: initialMessage.senderId,
          sender_name: initialMessage.senderName,
          message: initialMessage.message,
          type: initialMessage.type,
          timestamp: initialMessage.timestamp,
          is_read: initialMessage.isRead
        });

      setMessages([initialMessage]);
    } catch (error) {
      console.error('초기 메시지 생성 오류:', error);
      setMessages([initialMessage]);
    }
  };

  // 메시지 전송 (Supabase에 저장)
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedRoom || !user) return;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId: selectedRoom.id,
      senderId: user.id,
      senderName: user.name,
      message: messageInput.trim(),
      type: 'text',
      timestamp: new Date().toISOString(),
      isRead: false
    };

    // 즉시 UI에 표시
    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');

    // 채팅 목록의 최근 메시지도 업데이트
    setRoomLastMessages(prev => ({
      ...prev,
      [selectedRoom.id]: newMessage
    }));

    // Supabase에 저장
    try {
      const { error } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          id: newMessage.id,
          room_id: newMessage.roomId,
          sender_id: newMessage.senderId,
          sender_name: newMessage.senderName,
          message: newMessage.message,
          type: newMessage.type,
          timestamp: newMessage.timestamp,
          is_read: newMessage.isRead
        });

      if (error) {
        console.error('메시지 저장 오류:', error);
        Alert.alert('오류', '메시지 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('메시지 전송 예외:', error);
      Alert.alert('오류', '메시지 전송 중 문제가 발생했습니다.');
    }

    // 스크롤을 최하단으로
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // 채팅방 선택시 메시지 로드
  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id);
    }
  }, [selectedRoom?.id]);

  // 실시간 메시지 구독 (새 메시지 자동 수신)
  useEffect(() => {
    if (!selectedRoom) return;

    const subscription = supabaseAdmin
      .channel(`chat_${selectedRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${selectedRoom.id}`
        },
        (payload) => {
          const newMsg = payload.new;
          const chatMessage: ChatMessage = {
            id: newMsg.id,
            roomId: newMsg.room_id,
            senderId: newMsg.sender_id,
            senderName: newMsg.sender_name,
            message: newMsg.message,
            type: newMsg.type,
            timestamp: newMsg.timestamp,
            isRead: newMsg.is_read
          };

          // 내가 보낸 메시지가 아닐 때만 추가 (중복 방지)
          setMessages(prev => {
            const exists = prev.some(m => m.id === chatMessage.id);
            if (exists) return prev;
            return [...prev, chatMessage];
          });

          // 채팅 목록의 최근 메시지도 업데이트
          setRoomLastMessages(prev => ({
            ...prev,
            [selectedRoom.id]: chatMessage
          }));

          // 새 메시지가 오면 스크롤 내리기
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedRoom?.id]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else {
      return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <View style={styles.emptyContainer}>
          <MessageCircle size={48} color="#9ca3af" />
          <Text style={styles.emptyTitle}>로그인이 필요합니다</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>로그인하기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={styles.container}>
        {!selectedRoom ? (
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>채팅</Text>
              <Text style={styles.headerSubtitle}>
                매치 참여자들과 소통하세요
              </Text>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="채팅방 검색"
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView style={styles.roomList} showsVerticalScrollIndicator={false}>
              {filteredRooms.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <MessageCircle size={48} color="#9ca3af" />
                  <Text style={styles.emptyStateTitle}>채팅방이 없습니다</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    매치에 참여하거나 등록하면{'\n'}채팅방이 생성됩니다
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => router.push('/(tabs)/index')}
                  >
                    <Text style={styles.emptyStateButtonText}>매치 찾아보기</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredRooms.map((room) => (
                  <TouchableOpacity
                    key={room.id}
                    style={styles.roomItem}
                    onPress={() => setSelectedRoom(room)}
                  >
                    <View style={styles.roomIcon}>
                      <Users size={24} color="#ec4899" />
                    </View>
                    
                    <View style={styles.roomContent}>
                      <View style={styles.roomHeader}>
                        <Text style={styles.roomTitle}>
                          {(room as any).matchTitle || '매치 채팅'}
                        </Text>
                        <Text style={styles.roomTime}>
                          {formatTime(roomLastMessages[room.id]?.timestamp || room.lastMessage?.timestamp || room.updatedAt)}
                        </Text>
                      </View>
                      
                      <View style={styles.roomInfo}>
                        <View style={styles.roomInfoRow}>
                          <Calendar size={14} color="#6b7280" />
                          <Text style={styles.roomInfoText}>
                            {(room as any).matchDate} {(room as any).matchTime}
                          </Text>
                        </View>
                        <Text style={styles.participantCount}>
                          {(room as any).participantCount}명 참여
                        </Text>
                      </View>
                      
                      <Text style={styles.lastMessage}>
                        {roomLastMessages[room.id]?.message || room.lastMessage?.message || '메시지가 없습니다'}
                      </Text>
                    </View>

                    {!room.lastMessage?.isRead && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>N</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </>
        ) : (
          <>
            <View style={styles.chatHeader}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setSelectedRoom(null)}
              >
                <Text style={styles.backButtonText}>← 뒤로</Text>
              </TouchableOpacity>
              <View style={styles.chatHeaderInfo}>
                <Text style={styles.chatHeaderTitle}>
                  {(selectedRoom as any).matchTitle}
                </Text>
                <Text style={styles.chatHeaderSubtitle}>
                  {(selectedRoom as any).participantCount}명 참여 중
                </Text>
              </View>
            </View>

            <ScrollView 
              ref={scrollViewRef}
              style={styles.messageList} 
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageItem,
                    message.senderId === user.id ? styles.myMessage : styles.otherMessage,
                    message.type === 'system' && styles.systemMessage
                  ]}
                >
                  {message.type === 'system' ? (
                    <Text style={styles.systemMessageText}>{message.message}</Text>
                  ) : (
                    <>
                      {message.senderId !== user.id && (
                        <Text style={styles.senderName}>{message.senderName}</Text>
                      )}
                      <View style={[
                        styles.messageBubble,
                        message.senderId === user.id ? styles.myMessageBubble : styles.otherMessageBubble
                      ]}>
                        <Text style={[
                          styles.messageText,
                          message.senderId === user.id ? styles.myMessageText : styles.otherMessageText
                        ]}>
                          {message.message}
                        </Text>
                      </View>
                      <Text style={styles.messageTime}>
                        {formatTime(message.timestamp)}
                      </Text>
                    </>
                  )}
                </View>
              ))}
            </ScrollView>

            <View style={styles.messageInputContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder="메시지를 입력하세요..."
                placeholderTextColor="#9ca3af"
                value={messageInput}
                onChangeText={setMessageInput}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  messageInput.trim() ? styles.sendButtonActive : styles.sendButtonInactive
                ]}
                onPress={sendMessage}
                disabled={!messageInput.trim()}
              >
                <Send size={20} color={messageInput.trim() ? "#ffffff" : "#9ca3af"} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  roomList: {
    flex: 1,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  roomIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roomContent: {
    flex: 1,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  roomTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  roomInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomInfoText: {
    fontSize: 12,
    color: '#6b7280',
  },
  participantCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#ec4899',
    fontWeight: '600',
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  chatHeaderSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  messageList: {
    flex: 1,
    padding: 16,
  },
  messageItem: {
    marginBottom: 16,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  systemMessage: {
    alignItems: 'center',
  },
  systemMessageText: {
    fontSize: 12,
    color: '#9ca3af',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    textAlign: 'center',
  },
  senderName: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: '#ec4899',
  },
  otherMessageBubble: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#111827',
  },
  messageTime: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
    marginHorizontal: 4,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  messageInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#ec4899',
  },
  sendButtonInactive: {
    backgroundColor: '#f3f4f6',
  },
});