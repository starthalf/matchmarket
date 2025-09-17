import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Shield,
  Eye,
  Heart,
  Star,
  Users,
  Send,
  X,
  Timer
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useMatches } from '../../contexts/MatchContext';
import { PriceDisplay } from '../../components/PriceDisplay';
import { useSafeStyles } from '../../constants/Styles';
import { Match, MatchApplication } from '../../types/tennis';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { matches, updateMatch } = useMatches();
  const safeStyles = useSafeStyles();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showPaymentTimer, setShowPaymentTimer] = useState(false);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(300); // 5분 = 300초

  const match = matches.find(m => m.id === id);

  if (!match) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>매치를 찾을 수 없습니다.</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 현재 사용자의 참여 상태 확인
  const myApplication = match.applications.find(app => app.userId === user?.id);
  const myParticipation = match.participants.find(p => p.userId === user?.id);
  const isOwnMatch = match.sellerId === user?.id;

  const currentTime = new Date();
  const matchDateTime = new Date(`${match.date}T${match.time}`);
  const hoursUntilMatch = Math.max(0, (matchDateTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60));

  // 결제 타이머 효과
  useEffect(() => {
    if (!showPaymentTimer) return;

    const timer = setInterval(() => {
      setPaymentTimeLeft(prev => {
        if (prev <= 1) {
          setShowPaymentTimer(false);
          Alert.alert('결제 시간 만료', '결제 시간이 만료되었습니다.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showPaymentTimer]);

  const handleApply = () => {
    if (!user) {
      Alert.alert('로그인 필요', '로그인이 필요합니다.', [
        { text: '확인', onPress: () => router.push('/auth/login') }
      ]);
      return;
    }

    if (isOwnMatch) {
      Alert.alert('알림', '본인이 등록한 매치입니다.');
      return;
    }

    if (myApplication) {
      Alert.alert('이미 신청함', '이미 참여신청을 하셨습니다.');
      return;
    }

    setShowApplicationModal(true);
  };

  const submitApplication = async () => {
    if (!user || !match) return;

    setIsSubmitting(true);

    try {
      // 새로운 참여신청 생성
      const new