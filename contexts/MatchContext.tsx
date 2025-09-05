import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Match } from '../types/tennis';
import { mockMatches } from '../data/mockData';
import { DataGenerator } from '../utils/dataGenerator';
import { WaitlistManager } from '../utils/waitlistManager';
import { supabaseAdmin } from '../lib/supabase';

interface MatchContextType {
  matches: Match[];
  isLoadingMatches: boolean;
  refreshMatches: () => Promise<void>;
  updateMatch: (updatedMatch: Match) => void;
  addMatch: (newMatch: Match) => Promise<boolean>;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export function MatchProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const mounted = useRef(false);

  // Track component mount status
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // 앱 로드 시 Supabase에서 모든 매치 가져오기 및 매일 새로운 더미 매치 생성
  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      console.log('매치 데이터 로딩 시작...');
      
      // 1. 기본 매치 먼저 설정 (Supabase 연결 실패해도 앱이 작동하도록)
      if (mounted.current) {
        setMatches([...mockMatches]);
      }
      
      // 2. Supabase 연결이 가능한 경우에만 추가 로직 실행
      try {
        // 모든 매치 가져오기
        const allMatches = await DataGenerator.getAllMatches(mockMatches);
        
        // 각 매치의 대기자 목록을 Supabase에서 동기화
        const syncedMatches = await Promise.all(
          allMatches.map(match => WaitlistManager.syncWaitingListFromDB(match))
        );
        
        if (mounted.current) {
          setMatches([...syncedMatches]);
        }
        
        // 새로운 더미 매치 생성 필요한지 확인
        const shouldGenerate = await DataGenerator.shouldGenerateNewMatches();
        if (shouldGenerate) {
          console.log('새로운 더미 매치 생성 중...');
          const newMatches = await DataGenerator.generateAndSaveDailyMatches(20);
          
          if (newMatches.length > 0) {
            // 새 매치들을 맨 앞에 추가
            if (mounted.current) {
              setMatches(prev => [...newMatches, ...prev]);
            }
            DataGenerator.updateLastGenerationDate();
            console.log(`✅ ${newMatches.length}개의 새로운 더미 매치가 생성되었습니다.`);
            
            // 더미 매치 개수 확인
            const totalDummyCount = await DataGenerator.getDummyMatchCount();
            console.log(`📊 총 더미 매치 개수: ${totalDummyCount}개`);
          } else {
            console.log('Supabase 연결 문제로 더미 매치 생성을 건너뜁니다.');
          }
        } else {
          console.log('오늘은 이미 더미 매치가 생성되었습니다.');
        }
      } catch (supabaseError) {
        console.warn('⚠️ Supabase 관련 작업 실패 (네이티브 환경에서는 정상):', supabaseError);
        // Supabase 연결 실패해도 기본 매치는 표시
        if (mounted.current) {
          setMatches([...mockMatches]);
        }
      }
    } catch (error) {
      console.warn('⚠️ 매치 로딩 중 오류:', error);
      // 최종 fallback: 기본 매치만 표시
      if (mounted.current) {
        setMatches([...mockMatches]);
      }
    } finally {
      if (mounted.current) {
        setIsLoadingMatches(false);
      }
    }
  };

  const refreshMatches = async () => {
    setIsLoadingMatches(true);
    await loadMatches();
  };

  const updateMatch = (updatedMatch: Match) => {
    setMatches(prevMatches =>
      prevMatches.map(match =>
        match.id === updatedMatch.id ? updatedMatch : match
      )
    );
  };

  const addMatch = async (newMatch: Match): Promise<boolean> => {
    try {
      // 로컬 상태에 먼저 추가하여 즉각적인 UI 반영
      setMatches(prev => [newMatch, ...prev]);

      // Supabase에 저장
      if (supabaseAdmin) {
        try {
          // Match 객체를 Supabase 형식으로 변환
          const supabaseMatchData = {
            id: newMatch.id,
            seller_id: newMatch.sellerId,
            seller_name: newMatch.seller.name,
            seller_gender: newMatch.seller.gender,
            seller_age_group: newMatch.seller.ageGroup,
            seller_ntrp: newMatch.seller.ntrp,
            seller_experience: newMatch.seller.experience,
            seller_play_style: newMatch.seller.playStyle,
            seller_career_type: newMatch.seller.careerType,
            seller_certification_ntrp: newMatch.seller.certification.ntrp,
            seller_certification_career: newMatch.seller.certification.career,
            seller_certification_youtube: newMatch.seller.certification.youtube,
            seller_certification_instagram: newMatch.seller.certification.instagram,
            seller_profile_image: newMatch.seller.profileImage,
            seller_view_count: newMatch.seller.viewCount,
            seller_like_count: newMatch.seller.likeCount,
            seller_avg_rating: newMatch.seller.avgRating,
            title: newMatch.title,
            date: newMatch.date,
            time: newMatch.time,
            end_time: newMatch.endTime,
            court: newMatch.court,
            description: newMatch.description,
            base_price: newMatch.basePrice,
            initial_price: newMatch.initialPrice,
            current_price: newMatch.currentPrice,
            max_price: newMatch.maxPrice,
            expected_views: newMatch.expectedViews,
            expected_waiting_applicants: newMatch.expectedWaitingApplicants,
            expected_participants_male: newMatch.expectedParticipants.male,
            expected_participants_female: newMatch.expectedParticipants.female,
            expected_participants_total: newMatch.expectedParticipants.total,
            current_applicants_male: newMatch.currentApplicants.male,
            current_applicants_female: newMatch.currentApplicants.female,
            current_applicants_total: newMatch.currentApplicants.total,
            match_type: newMatch.matchType,
            waiting_applicants: newMatch.waitingApplicants,
            ad_enabled: newMatch.adEnabled,
            ntrp_min: newMatch.ntrpRequirement.min,
            ntrp_max: newMatch.ntrpRequirement.max,
            weather: newMatch.weather,
            location: newMatch.location,
            is_dummy: false,
          };

          const { error } = await supabaseAdmin
            .from('matches')
            .insert(supabaseMatchData);

          if (error) {
            console.error('Supabase에 매치 저장 실패:', error);
            // Supabase 저장 실패 시에도 로컬에는 유지 (오프라인 지원)
            console.log('로컬 상태에는 매치가 유지됩니다.');
          } else {
            console.log('✅ 매치가 Supabase에 성공적으로 저장됨:', newMatch.id);
          }
        } catch (supabaseError) {
          console.warn('Supabase 저장 중 오류 (네이티브 환경에서는 정상):', supabaseError);
          // Supabase 연결 실패해도 로컬에는 매치 유지
        }
      } else {
        console.log('Supabase Admin 클라이언트가 설정되지 않음. 로컬에만 저장됩니다.');
      }
      
      return true;
    } catch (error) {
      console.error('매치 추가 중 오류 발생:', error);
      // 오류 발생 시 로컬 상태 롤백
      setMatches(prev => prev.filter(match => match.id !== newMatch.id));
      return false;
    }
  };
  return (
    <MatchContext.Provider value={{ matches, isLoadingMatches, refreshMatches, updateMatch, addMatch }}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatches() {
  const context = useContext(MatchContext);
  if (context === undefined) {
    throw new Error('useMatches must be used within a MatchProvider');
  }
  return context;
}