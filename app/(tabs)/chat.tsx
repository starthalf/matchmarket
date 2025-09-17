import React, { useState, useEffect } from 'react';
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
  isSellerChat: boolean; // 판매자가 보내는 채팅인지 여부
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
            채