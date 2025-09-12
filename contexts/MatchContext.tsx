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
        
        // 각 매치의 대기자 목록을 Supabase에서 동기화 (오류 발생해도 계속 진행)
        const syncedMatches = await Promise.allSettled(
          allMatches.map(match => WaitlistManager.syncWaitingListFromDB(match))
        );
        
        // 성공한 매치들만 추출
        const successfulMatches = syncedMatches
          .filter((result): result is PromiseFulfilledResult<Match> => result.status === 'fulfilled')
          .map(result => result.value);
        
        // 실패한 매치들은 원본 데이터 사용
        const failedMatches = syncedMatches
          .map((result, index) => result.status === 'rejected' ? allMatches[index] : null)
          .filter((match): match is Match => match !== null);
        
        const finalMatches = [...successfulMatches, ...failedMatches];
        
        if (mounted.current) {
          setMatches([...finalMatches]);
        }
        
        // 새로운 더미 매치 생성 필요한지 확인
        const shouldGenerate = await DataGenerator.shouldGenerateNewMatches();
        if (shouldGenerate) {
          console.log('새로운 더미 매치 생성 중... (10개)');
          const newMatches = await DataGenerator.generateAndSaveDailyMatches(10); // 20개에서 10개로 변경
          
          if (newMatches.length > 0) {
            // 새 매치들을 맨 앞에 추가
            if (mounted.current) {
              setMatches(prev => [...newMatches, ...prev]);
            }
            try {
              await DataGenerator.updateLastGenerationDate();
            } catch (updateError: any) {
              console.log('ℹ️ 마지막 생성 날짜 업데이트 실패 (환경변수 미설정):', updateError?.message);
            }
            console.log(`✅ ${newMatches.length}개의 새로운 더미 매치가 생성되었습니다.`);
            
            // 더미 매치 개수 확인
            try {
              const totalDummyCount = await DataGenerator.getDummyMatchCount();
              console.log(`📊 총 더미 매치 개수: ${totalDummyCount}개`);
            } catch (countError: any) {
              console.log('ℹ️ 더미 매치 개수 조회 실패 (환경변수 미설정):', countError?.message);
            }
          } else {
            console.log('ℹ️ Supabase 연결 문제로 더미 매치 생성을 건너뜁니다.');
          }
        } else {
          console.log('ℹ️ 오늘은 이미 더미 매치가 생성되었거나 Supabase 연결이 불가능합니다.');
        }
        
      } catch (supabaseError: any) {
        console.log('ℹ️ Supabase 관련 작업 중 오류 발생 (정상적으로 로컬 데이터 사용):', {
          message: supabaseError?.message || '알 수 없는 오류',
          name: supabaseError?.name,
          code: supabaseError?.code
        });
      }
      
    } catch (error: any) {
      console.error('매치 로딩 중 예상치 못한 오류:', {
        message: error?.message || '알 수 없는 오류',
        name: error?.name,
        stack: error?.stack
      });
      
      // 오류 발생해도 최소한 기본 매치는 표시
      if (mounted.current) {
        setMatches([...mockMatches]);
      }
    } finally {
      // 로딩 완료
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
    setMatches(prev => 
      prev.map(match => 
        match.id === updatedMatch.id ? updatedMatch : match
      )
    );
  };

  const addMatch = async (newMatch: Match): Promise<boolean> => {
    try {
      if (!supabaseAdmin) {
        console.warn('Supabase Admin 클라이언트가 초기화되지 않음');
        // 로컬에만 추가
        setMatches(prev => [newMatch, ...prev]);
        return true;
      }

      // Supabase에 저장
      const supabaseMatch = DataGenerator.matchToSupabaseFormat(newMatch);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('매치 저장 시간 초과')), 10000);
      });

      const insertPromise = supabaseAdmin
        .from('matches')
        .insert(supabaseMatch);

      const { error } = await Promise.race([insertPromise, timeoutPromise]);

      if (error) {
        console.error('매치 저장 오류:', error);
        // 오류 발생해도 로컬에는 추가
        setMatches(prev => [newMatch, ...prev]);
        return false;
      }

      // 성공 시 로컬에도 추가
      setMatches(prev => [newMatch, ...prev]);
      console.log('✅ 새 매치가 성공적으로 저장되었습니다.');
      return true;

    } catch (error: any) {
      if (error?.message?.includes('시간 초과')) {
        console.error('매치 저장 시간 초과');
      } else if (error?.message?.includes('Failed to fetch')) {
        console.error('네트워크 연결 오류로 매치 저장 실패');
      } else {
        console.error('매치 저장 중 예상치 못한 오류:', error?.message);
      }
      
      // 오류 발생해도 로컬에는 추가
      setMatches(prev => [newMatch, ...prev]);
      return false;
    }
  };

  const value: MatchContextType = {
    matches,
    isLoadingMatches,
    refreshMatches,
    updateMatch,
    addMatch,
  };

  return (
    <MatchContext.Provider value={value}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatches() {
  const context = useContext(MatchContext);
  if (context === undefined) {
    throw new Error('useMatches must be used within a MatchProvider');
  }
  
  // displayMatches 계산을 여기서 수행
  const displayMatches = context.matches.filter(match => !match.isClosed);
  
  return {
    ...context,
    displayMatches,
  };
}