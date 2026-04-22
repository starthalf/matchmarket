// contexts/MatchContext.tsx - 자동 더미 생성 비활성화

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Match } from '../types/tennis';
import { mockMatches } from '../data/mockData';
import { DataGenerator } from '../utils/dataGenerator';
import { WaitlistManager } from '../utils/waitlistManager';
import { supabaseAdmin } from '../lib/supabase';
import { isMatchExpired } from '../utils/dateHelper';

interface MatchContextType {
  matches: Match[];
  isLoadingMatches: boolean;
  refreshMatches: () => Promise<void>;
  updateMatch: (updatedMatch: Match) => Promise<void>;  // 👈 void를 Promise<void>로 변경
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

  // 앱 로드 시 Supabase에서 모든 매치 가져오기 (자동 더미 생성 제거)
  useEffect(() => {
    loadMatches();
  }, []);

  // 자동 마감 체크: 날짜가 지난 매치 자동 마감
 // ✅ 수정된 코드 (43번째 줄) - 로딩 완료 후에만 체크 시작
useEffect(() => {
  // 로딩 중이거나 매치가 없으면 스킵
  if (isLoadingMatches || matches.length === 0) {
    return;
  }

  const checkAndCloseExpiredMatches = () => {
    let hasChanges = false;

    setMatches(prev => {
      const updated = prev.map(match => {
        if (!match.isClosed) {
          // 종료 시간 기준으로 체크
          const isExpired = isMatchExpired(match.date, match.endTime);

          if (isExpired) {
            hasChanges = true;
            console.log(`🔒 자동 마감: ${match.title} (날짜: ${match.date}, 종료: ${match.endTime})`);

            // Supabase에도 업데이트
            supabaseAdmin
              .from('matches')
              .update({ is_closed: true })
              .eq('id', match.id)
              .then(({ error }) => {
                if (error) {
                  console.error('Supabase 자동 마감 업데이트 실패:', error);
                } else {
                  console.log(`✅ Supabase 자동 마감 완료: ${match.title}`);
                }
              });

            return { ...match, isClosed: true };
          }
        }
        return match;
      });

      if (hasChanges) {
        console.log('✅ 자동 마감 체크 완료: 일부 매치가 마감되었습니다.');
      }

      return hasChanges ? updated : prev;
    });
  };

  // 로딩 완료 후 즉시 체크
  console.log('🔍 MatchContext: 매치 로드 완료 - 자동 마감 체크 실행');
  checkAndCloseExpiredMatches();

  // 1분마다 체크
  const interval = setInterval(() => {
    console.log('🔍 MatchContext: 1분 주기 자동 마감 체크 실행');
    checkAndCloseExpiredMatches();
  }, 60000);

  return () => clearInterval(interval);
}, [isLoadingMatches, matches.length]); // 로딩 완료 & 매치 개수 변경 시 실행

  // Supabase 실시간 구독: 다른 사용자의 매치 변경사항 실시간 반영
  useEffect(() => {
    const subscription = supabaseAdmin
      .channel('matches_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches'
        },
        (payload) => {
          console.log('📡 실시간 매치 업데이트 감지:', payload);

          // 변경된 매치 데이터를 로컬 상태에 반영
          setMatches(prev =>
            prev.map(match => {
              if (match.id === payload.new.id) {
                return {
                  ...match,
                  isClosed: payload.new.is_closed,
                  isCompleted: payload.new.is_completed,
                  applications: payload.new.applications || match.applications,
                  participants: payload.new.participants || match.participants,
                  currentApplicants: {
                    male: payload.new.current_applicants_male || 0,
                    female: payload.new.current_applicants_female || 0,
                    total: payload.new.current_applicants_total || 0
                  }
                };
              }
              return match;
            })
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadMatches = async () => {
    try {
      console.log('매치 데이터 로딩 시작...');
      
      // 1. 기본 매치 먼저 설정 (Supabase 연결 실패해도 앱이 작동하도록)
      if (mounted.current) {
        setMatches([...mockMatches]);
      }
      
      // 2. Supabase에서 데이터 가져오기 (자동 더미 생성 없음)
      try {
        const allMatches = await DataGenerator.getAllMatches(mockMatches);
        
        // 웹에서 대량 병렬 요청 방지 — 동기화 스킵하고 로컬 데이터 사용
        const syncedMatches = allMatches.map(match => ({
          status: 'fulfilled' as const,
          value: match
        }));
        
        // 성공한 매치들만 추출
        const successfulMatches = syncedMatches
          .filter((result): result is PromiseFulfilledResult<Match> => result.status === 'fulfilled')
          .map(result => result.value);
        
        // 실패한 매치들은 원본 데이터 사용
        const failedMatches = syncedMatches
          .map((result, index) => result.status === 'rejected' ? 
            allMatches[index] : null)
          .filter((match): match is Match => match !== null);
        
        const finalMatches = [...successfulMatches, ...failedMatches];
        
        if (mounted.current) {
          setMatches([...finalMatches]);
        }
        
        console.log(`✅ 총 ${finalMatches.length}개 매치 로드 완료`);
        
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

  const updateMatch = async (updatedMatch: Match) => {
  console.log('=== MatchContext: updateMatch 호출됨 ===');
  console.log('MatchContext: updateMatch called for match ID:', updatedMatch.id);
  console.log('MatchContext: 업데이트할 매치 제목:', updatedMatch.title);
  console.log('MatchContext: 현재 matches 배열 길이:', matches.length);
  
  // 1. 로컬 상태 즉시 업데이트
  setMatches(prev => 
    prev.map(match => 
      match.id === updatedMatch.id ? updatedMatch : match
    )
  );
  
  // 2. Supabase에도 UPDATE 시도
  try {
    const { error } = await supabaseAdmin
      .from('matches')
      .update({
        is_closed: updatedMatch.isClosed,
        is_completed: updatedMatch.isCompleted,
        current_price: updatedMatch.currentPrice,
        applications: updatedMatch.applications || [],
        participants: updatedMatch.participants || [],
        current_applicants_male: updatedMatch.currentApplicants?.male || 0,
        current_applicants_female: updatedMatch.currentApplicants?.female || 0,
        current_applicants_total: updatedMatch.currentApplicants?.total || 0,
      })
      .eq('id', updatedMatch.id);
    
    if (error) {
      console.error('Supabase 업데이트 오류:', error);
      // 에러가 나도 로컬에는 이미 반영되어 있음
    } else {
      console.log('✅ 매치 업데이트가 Supabase에 저장됨');
    }
  } catch (error) {
    console.error('Supabase 저장 중 예외:', error);
    // 로컬에는 이미 반영되어 있으므로 계속 진행
  }
  
  console.log('=== MatchContext: updateMatch 완료 ===');
};

const addMatch = async (newMatch: Match): Promise<boolean> => {
  try {
    console.log('새 매치 추가 중:', newMatch.id);
    
    // Supabase에 저장 시도
    const success = await DataGenerator.saveMatchToSupabase(newMatch);
    
    if (success) {
      console.log('✅ 새 매치가 Supabase에 저장되었습니다');
      // 로컬 상태에도 추가
      setMatches(prev => [newMatch, ...prev]);
      return true;
    } else {
      console.log('⚠️ Supabase 저장 실패, 로컬 상태에만 추가합니다');
      // Supabase 저장 실패해도 로컬에는 추가
      setMatches(prev => [newMatch, ...prev]);
      return true; // 사용자에게는 성공으로 보고
    }
  } catch (error) {
    console.error('매치 추가 중 오류:', error);
    return false;
  }
};

  return (
    <MatchContext.Provider value={{
      matches,
      isLoadingMatches,
      refreshMatches,
      updateMatch,
      addMatch,
    }}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch() {
  const context = useContext(MatchContext);
  if (context === undefined) {
    throw new Error('useMatch must be used within a MatchProvider');
  }
  return context;
}

// Backward compatibility
export const useMatches = useMatch;