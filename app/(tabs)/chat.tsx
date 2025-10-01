// app/(tabs)/chat.tsx - 완전 구현 버전
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Send, Users, Calendar, Search } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useMatches } from '../../contexts/MatchContext';
import { ChatRoom, ChatMessage } from '../../types/tennis';
import { useSafeStyles } from '../../constants/Styles';
import { router } from 'expo-router';

export default function ChatScreen() {
  const { user } = useAuth();
  const { matches } = useMatches();
  const safeStyles = useSafeStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // 내가 참여한 매치들에서 채팅방 생성
  const myChatRooms: ChatRoom[] = matches
    .filter(match => {
      // 내가 판매자이거나, 승인된 참여신청이 있는 매치
      return match.sellerId === user?.id || 
             match.applications?.some(app => 
               app.userId === user?.id && app.status === 'approved'
             );
    })
    .map(match => ({
      id: `chat_${match.id}`,
      matchId: match.id,
      participantIds: [
        match.sellerId,
        ...(match.applications?.filter(app => app.status === 'approved').map(app => app.userId) || [])
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
      participantCount: 1 + (match.applications?.filter(app => app.status === 'approved').length || 0)
    }));

  // 검색 필터링
  const filteredRooms = myChatRooms.filter(room =>
    searchQuery === '' ||
    (room as any).matchTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

// 메시지 전송
const sendMessage = () => {
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

  // 현재 메시지 리스트에 추가
  const updatedMessages = [...messages, newMessage];
  setMessages(updatedMessages);
  
  // 채팅방별 메시지 저장소에도 저장
  setRoomMessages(prev => ({
    ...prev,
    [selectedRoom.id]: updatedMessages
  }));
  
  // 채팅방의 lastMessage도 업데이트
  setSelectedRoom(prev => {
    if (!prev) return prev;
    return {
      ...prev,
      lastMessage: newMessage,
      updatedAt: new Date().toISOString()
    };
  });

  setMessageInput('');
};

// 채팅방별 메시지를 저장하는 state 추가
  const [roomMessages, setRoomMessages] = useState<{ [key: string]: ChatMessage[] }>({});

  // 채팅방 선택시 메시지 로드
  useEffect(() => {
    if (selectedRoom) {
      // 해당 채팅방의 저장된 메시지가 있으면 불러오기
      if (roomMessages[selectedRoom.id]) {
        setMessages(roomMessages[selectedRoom.id]);
      } else {
        // 처음 들어가는 채팅방이면 초기 메시지 생성
        const initialMessages: ChatMessage[] = [
          {
            id: `msg_${selectedRoom.id}_1`,
            roomId: selectedRoom.id,
            senderId: 'system',
            senderName: 'System',
            message: '매치 채팅이 시작되었습니다. 서로 예의를 지켜주세요.',
            type: 'system',
            timestamp: selectedRoom.createdAt,
            isRead: true
          }
        ];
        setMessages(initialMessages);
        setRoomMessages(prev => ({ ...prev, [selectedRoom.id]: initialMessages }));
      }
    }
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
          // 채팅방 목록
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>채팅</Text>
              <Text style={styles.headerSubtitle}>
                매치 참여자들과 소통하세요
              </Text>
            </View>

            {/* 검색바 */}
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
                          {formatTime(room.lastMessage?.timestamp || room.updatedAt)}
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
                        {room.lastMessage?.message || '메시지가 없습니다'}
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
          // 채팅방 화면
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

            <ScrollView style={styles.messageList} showsVerticalScrollIndicator={false}>
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
    numberOfLines: 1,
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