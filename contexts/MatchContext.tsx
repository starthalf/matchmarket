import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Match } from '../types/tennis';
import { mockMatches } from '../data/mockData';
import { DataGenerator } from '../utils/dataGenerator';
import { WaitlistManager } from '../utils/waitlistManager';

interface MatchContextType {
  matches: Match[];
  isLoadingMatches: boolean;
  refreshMatches: () => Promise<void>;
  updateMatch: (updatedMatch: Match) => void;
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
      
      // 1. 먼저 모든 매치 가져오기
      const allMatches = await DataGenerator.getAllMatches(mockMatches);
      
      // 2. 각 매치의 대기자 목록을 Supabase에서 동기화
      const syncedMatches = await Promise.all(
        allMatches.map(match => WaitlistManager.syncWaitingListFromDB(match))
      );
      
      if (mounted.current) {
        setMatches([...syncedMatches]); // 동기화된 매치들로 설정
      }
      
      // 3. 새로운 더미 매치 생성 필요한지 확인
      const shouldGenerate = await DataGenerator.shouldGenerateNewMatches();
      if (shouldGenerate) {
        console.log('새로운 더미 매치 생성 중...');
        const newMatches = await DataGenerator.generateAndSaveDailyMatches(20);
        
        if (newMatches.length > 0) {
          // 새 매치들을 맨 앞에 추가
          if (mounted.current) {
            setMatches(prev => [...newMatches, ...prev]); // 이미 올바름
          }
          await DataGenerator.updateLastGenerationDate();
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
    } catch (error) {
      console.warn('⚠️ 매치 로딩 중 오류 (Supabase 연결 문제일 수 있음):', error);
      console.log('로컬 데이터만 사용합니다.');
      if (mounted.current) {
        setMatches([...mockMatches]); // 새로운 배열 참조 생성
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

  return (
    <MatchContext.Provider value={{ matches, isLoadingMatches, refreshMatches, updateMatch }}>
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