export interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl?: string;
  buttonText: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
  priority: number; // 높을수록 우선 표시
  targetAudience?: {
    gender?: '남성' | '여성';
    ageGroups?: ('20대' | '30대' | '40대' | '50대+')[];
    ntrpRange?: { min: number; max: number };
  };
  schedule?: {
    startDate: string;
    endDate: string;
    showTimes?: string[]; // 특정 시간대에만 표시
  };
  viewCount: number;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdDisplaySettings {
  showFrequency: 'always' | 'once_per_day' | 'once_per_session';
  displayDelay: number; // 앱 시작 후 몇 초 뒤에 표시할지
  autoCloseAfter?: number; // 자동으로 닫힐 시간 (초)
}