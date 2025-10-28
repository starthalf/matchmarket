/**
 * 날짜 관련 유틸리티 함수
 * "10-27" 형식을 안전하게 파싱하고 비교할 수 있도록 지원
 */

/**
 * "MM-DD" 또는 "YYYY-MM-DD" 형식의 날짜 문자열을 현재 연도를 포함한 Date 객체로 변환
 * @param dateStr 날짜 문자열 (예: "10-27" 또는 "2024-10-27")
 * @param timeStr 시간 문자열 (예: "19:00" 또는 "19:00-22:00")
 * @returns Date 객체
 */
export function parseMatchDate(dateStr: string, timeStr?: string): Date {
  // dateStr이 없으면 현재 날짜 반환
  if (!dateStr) {
    return new Date();
  }

  // 연도가 포함되어 있는지 확인
  const hasYear = dateStr.includes('-') && dateStr.split('-').length === 3;

  let fullDateStr: string;

  if (hasYear) {
    // 이미 "YYYY-MM-DD" 형식
    fullDateStr = dateStr;
  } else {
    // "MM-DD" 형식 → 현재 연도 추가
    const currentYear = new Date().getFullYear();
    fullDateStr = `${currentYear}-${dateStr}`;
  }

  // 시간 문자열 처리
  let timePartStr = '00:00';
  if (timeStr) {
    // "19:00-22:00" 형식이면 시작 시간만 사용
    timePartStr = timeStr.split('-')[0].trim();
  }

  // ISO 8601 형식으로 조합: "YYYY-MM-DDTHH:mm"
  const isoDateStr = `${fullDateStr}T${timePartStr}`;

  const parsedDate = new Date(isoDateStr);

  // 파싱 실패 시 로그 출력
  if (isNaN(parsedDate.getTime())) {
    console.error('❌ 날짜 파싱 실패:', { dateStr, timeStr, fullDateStr, isoDateStr });
    return new Date(); // 실패 시 현재 날짜 반환
  }

  return parsedDate;
}

/**
 * 매치가 이미 지난 시간인지 확인
 * @param dateStr 날짜 문자열
 * @param timeStr 시간 문자열
 * @returns true면 이미 지남
 */
export function isMatchExpired(dateStr: string, timeStr?: string): boolean {
  const now = new Date();
  const matchDateTime = parseMatchDate(dateStr, timeStr);
  return now > matchDateTime;
}

/**
 * 매치까지 남은 시간(시간 단위)
 * @param dateStr 날짜 문자열
 * @param timeStr 시간 문자열
 * @returns 남은 시간(시간 단위), 음수면 이미 지남
 */
export function getHoursUntilMatch(dateStr: string, timeStr?: string): number {
  const now = new Date();
  const matchDateTime = parseMatchDate(dateStr, timeStr);
  const diffMs = matchDateTime.getTime() - now.getTime();
  return diffMs / (1000 * 60 * 60);
}

/**
 * 오늘 날짜인지 확인
 * @param dateStr 날짜 문자열
 * @returns true면 오늘
 */
export function isToday(dateStr: string): boolean {
  const today = new Date();
  const matchDate = parseMatchDate(dateStr);

  return (
    today.getFullYear() === matchDate.getFullYear() &&
    today.getMonth() === matchDate.getMonth() &&
    today.getDate() === matchDate.getDate()
  );
}
