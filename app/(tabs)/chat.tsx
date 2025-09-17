import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  MessageCircle, 
  Send, 
  User,
  Calendar,
  MapPin,
  X,
  Circle
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useMatches } from '../../contexts/MatchContext';
import { router } from 'expo-router';
import { useSafeStyles } from '../../constants/Styles';

interface ChatRoom {
  id: string;
  matchId: string;
  matchTitle: string;
  matchDate: string;
  matchTime: string;
  matchCourt: string;
  participantId: string;
  participantName: string;
  participantGender: '남성' | '여성';
  participantProfileImage?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isSellerChat: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  type: 'text' | 'system';
}

export default function ChatScreen() {
  const { user } = useAuth();
  const { matches } = useMatches();
  const safeStyles = useSafeStyles();
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  if (!user) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <View style={styles.loginPrompt}>
          <MessageCircle size={48} color="#9ca3af" />
          <Text style={styles.loginPromptTitle}>로그인이 필요합니다</Text>
          <Text style={styles.loginPromptText}>
            채팅을 사용하려면 로그인해주세요
          </Text>
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

  // Mock 채팅방 데이터 생성
  const getChatRooms = (): ChatRoom[] => {
    const chatRooms: ChatRoom[] = [];

    // 내가 판매한 매치에서 입금 완료된 참가자들과의 채팅방
    matches.forEach(match => {
      if (match.sellerId === user.id && match.participants) {
        match.participants.forEach(participant => {
          if (participant.status === 'confirmed') {
            chatRooms.push({
              id: `chat_${match.id}_${participant.userId}`,
              matchId: match.id,
              matchTitle: match.title,
              matchDate: match.date,
              matchTime: match.time,
              matchCourt: match.court,
              participantId: participant.userId,
              participantName: participant.userName,
              participantGender: participant.gender,
              lastMessage: '안녕하세요! 매치 관련해서 문의드릴게요.',
              lastMessageTime: new Date().toISOString(),
              unreadCount: 1,
              isSellerChat: true
            });
          }
        });
      }
    });

    // 내가 참가한 매치에서 판매자와의 채팅방
    matches.forEach(match => {
      const myParticipation = match.participants?.find(p => p.userId === user.id);
      if (myParticipation && myParticipation.status === 'confirmed') {
        chatRooms.push({
          id: `chat_${match.id}_${match.sellerId}`,
          matchId: match.id,
          matchTitle: match.title,
          matchDate: match.date,
          matchTime: match.time,
          matchCourt: match.court,
          participantId: match.sellerId,
          participantName: match.seller.name,
          participantGender: match.seller.gender,
          lastMessage: '매치 준비는 어떻게 하고 계신가요?',
          lastMessageTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          unreadCount: 0,
          isSellerChat: false
        });
      }
    });

    return chatRooms.sort((a, b) => 
      new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
    );
  };

  const chatRooms = getChatRooms();
  const totalUnreadCount = chatRooms.reduce((sum, room) => sum + room.unreadCount, 0);

  const handleOpenChat = (chatRoom: ChatRoom) => {
    setSelectedChatRoom(chatRoom);
    // 채팅 메시지 로드 (Mock 데이터)
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        senderId: chatRoom.isSellerChat ? chatRoom.participantId : chatRoom.participantId,
        senderName: chatRoom.participantName,
        message: '안녕하세요! 매치 관련해서 문의드릴게요.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        type: 'text'
      },
      {
        id: '2',
        senderId: user.id,
        senderName: user.name,
        message: '안녕하세요! 무엇이든 편하게 물어보세요.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        type: 'text'
      }
    ];
    setChatMessages(mockMessages);
    setShowChatModal(true);
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedChatRoom) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      message: messageText.trim(),
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setChatMessages(prev => [...prev, newMessage]);
    setMessageText('');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else {
      return date.toLocaleDateString('ko-KR', { 
        month: 'numeric', 
        day: 'numeric' 
      });
    }
  };

  if (chatRooms.length === 0) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>채팅</Text>
        </View>
        <View style={styles.emptyState}>
          <MessageCircle size={48} color="#9ca3af" />
          <Text style={styles.emptyStateTitle}>채팅방이 없습니다</Text>
          <Text style={styles.emptyStateText}>
            매치 참여 후 입금이 완료되면 판매자와 채팅할 수 있습니다
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>채팅</Text>
        {totalUnreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        {chatRooms.map((chatRoom) => (
          <TouchableOpacity 
            key={chatRoom.id}
            style={styles.chatRoomCard}
            onPress={() => handleOpenChat(chatRoom)}
          >
            <View style={styles.chatRoomHeader}>
              <View style={styles.participantInfo}>
                {chatRoom.participantProfileImage ? (
                  <Image 
                    source={{ uri: chatRoom.participantProfileImage }}
                    style={styles.participantAvatar}
                  />
                ) : (
                  <View style={styles.participantAvatarPlaceholder}>
                    <User size={20} color="#6b7280" />
                  </View>
                )}
                <View style={styles.participantDetails}>
                  <View style={styles.participantNameRow}>
                    <Text style={styles.participantName}>
                      {chatRoom.participantName}
                    </Text>
                    {chatRoom.unreadCount > 0 && (
                      <View style={styles.unreadIndicator}>
                        <Circle size={8} color="#dc2626" fill="#dc2626" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.matchInfo}>
                    {chatRoom.matchTitle}
                  </Text>
                  <Text style={styles.matchDetails}>
                    {chatRoom.matchDate} {chatRoom.matchTime} · {chatRoom.matchCourt}
                  </Text>
                </View>
              </View>
              <View style={styles.chatRoomMeta}>
                <Text style={styles.lastMessageTime}>
                  {formatTime(chatRoom.lastMessageTime || '')}
                </Text>
                {chatRoom.unreadCount > 0 && (
                  <View style={styles.messageUnreadBadge}>
                    <Text style={styles.messageUnreadBadgeText}>
                      {chatRoom.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            {chatRoom.lastMessage && (
              <Text style={styles.lastMessage} numberOfLines={1}>
                {chatRoom.lastMessage}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 채팅 모달 */}
      <Modal
        visible={showChatModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.chatModalContainer}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setShowChatModal(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
            <View style={styles.chatTitleInfo}>
              <Text style={styles.chatTitle}>
                {selectedChatRoom?.participantName}
              </Text>
              <Text style={styles.chatSubtitle}>
                {selectedChatRoom?.matchTitle}
              </Text>
            </View>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.matchInfoBanner}>
            <View style={styles.matchInfoRow}>
              <Calendar size={14} color="#6b7280" />
              <Text style={styles.matchInfoText}>
                {selectedChatRoom?.matchDate} {selectedChatRoom?.matchTime}
              </Text>
            </View>
            <View style={styles.matchInfoRow}>
              <MapPin size={14} color="#6b7280" />
              <Text style={styles.matchInfoText}>
                {selectedChatRoom?.matchCourt}
              </Text>
            </View>
          </View>

          <ScrollView 
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {chatMessages.map((message) => (
              <View 
                key={message.id} 
                style={[
                  styles.messageWrapper,
                  message.senderId === user.id ? styles.myMessageWrapper : styles.otherMessageWrapper
                ]}
              >
                <View style={[
                  styles.messageBubble,
                  message.senderId === user.id ? styles.myMessage : styles.otherMessage
                ]}>
                  <Text style={[
                    styles.messageText,
                    message.senderId === user.id ? styles.myMessageText : styles.otherMessageText
                  ]}>
                    {message.message}
                  </Text>
                  <Text style={[
                    styles.messageTime,
                    message.senderId === user.id ? styles.myMessageTime : styles.otherMessageTime
                  ]}>
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.messageInputContainer}>
            <View style={styles.messageInputWrapper}>
              <TextInput
                style={styles.messageInput}
                placeholder="메시지를 입력하세요..."
                placeholderTextColor="#9ca3af"
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={[
                  styles.sendButton,
                  !messageText.trim() && styles.sendButtonDisabled
                ]}
                onPress={handleSendMessage}
                disabled={!messageText.trim()}
              >
                <Send size={20} color={messageText.trim() ? "#ffffff" : "#9ca3af"} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  unreadBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loginPromptTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  loginPromptText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  chatRoomCard: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  chatRoomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  participantInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  participantAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantDetails: {
    flex: 1,
  },
  participantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  unreadIndicator: {
    marginLeft: 'auto',
  },
  matchInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ec4899',
    marginBottom: 2,
  },
  matchDetails: {
    fontSize: 12,
    color: '#6b7280',
  },
  chatRoomMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  messageUnreadBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  messageUnreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 60,
  },
  chatModalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  chatTitleInfo: {
    alignItems: 'center',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  chatSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  matchInfoBanner: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0f2fe',
    gap: 4,
  },
  matchInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchInfoText: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageWrapper: {
    maxWidth: '80%',
  },
  myMessageWrapper: {
    alignSelf: 'flex-end',
  },
  otherMessageWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  myMessage: {
    backgroundColor: '#ec4899',
  },
  otherMessage: {
    backgroundColor: '#f3f4f6',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  myMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#111827',
  },
  messageTime: {
    fontSize: 10,
    textAlign: 'right',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherMessageTime: {
    color: '#9ca3af',
  },
  messageInputContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  messageInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    maxHeight: 100,
    lineHeight: 22,
  },
  sendButton: {
    backgroundColor: '#ec4899',
    borderRadius: 20,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#f3f4f6',
  },
});