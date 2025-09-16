import React, { useState } from 'react';
import { Calendar, Clock, MapPin, DollarSign, Users, ChevronRight, ArrowLeft, User } from 'lucide-react';

const MatchSellPage = () => {
  const [matchType, setMatchType] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    date: '09/16',
    time: '20:56',
    endTime: '20:56',
    court: '',
    description: '',
    basePrice: '',
    maleCount: 2,
    femaleCount: 2,
    ntrpMin: 3.0,
    ntrpMax: 4.5
  });

  const matchTypes = [
    { id: 'single', label: '단식 (1:1)', icon: '🎾' },
    { id: 'doubles', label: '복식 (2:2)', icon: '🏸', selected: true },
    { id: 'mixed', label: '혼복 (1:1)', icon: '⚡' },
    { id: 'group', label: '그룹', icon: '👥' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">매치 판매</h1>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div className="w-6 h-6"></div>
        </div>
        <p className="text-center text-sm text-gray-600 pb-3">
          당신의 테니스를 판매하세요인기가 높으면 가격이 올라갑니다
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* 매치 정보 카드 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">매치 정보</h2>
          
          {/* 판매 매치 제목 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              판매 매치 제목 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="예) 강남에서 함께 치실 분을 위한 매치!"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 날짜/시간 정보 */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">날짜 *</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.date}
                  readOnly
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50"
                />
                <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">시간 *</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.time}
                  readOnly
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50"
                />
                <Clock className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">종료 시간 *</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.endTime}
                  readOnly
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50"
                />
                <Clock className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* 코트 위치 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">코트 위치 *</label>
            <div className="relative">
              <input
                type="text"
                value="예) 강남 테니스클럽 A코트"
                readOnly
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 pl-10"
              />
              <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* 매치 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">매치 설명</label>
            <textarea
              value="판매하는 매치에 대한 자세한 설명을 입력하세요..."
              readOnly
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 h-20 resize-none"
            />
          </div>
        </div>

        {/* 매치 설정 카드 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">매치 설정</h2>
          
          {/* 매치 유형 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">매치 유형 *</label>
            <div className="grid grid-cols-2 gap-2">
              {matchTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setMatchType(type.id)}
                  className={`p-3 rounded-lg border-2 text-center font-medium transition-all ${
                    type.selected || matchType === type.id
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg mb-1">{type.icon}</div>
                  <div className="text-sm">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 판매 기본 가격 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">판매 기본 가격 *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="코트비+공값의 1/N을 입력하세요 (예: 35000)"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg pl-8"
              />
              <span className="absolute left-3 top-3.5 text-gray-500 font-medium">#</span>
            </div>
          </div>

          {/* 모집 인원 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">모집 인원 *</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">남성</span>
                <input
                  type="number"
                  value={formData.maleCount}
                  onChange={(e) => setFormData({...formData, maleCount: parseInt(e.target.value)})}
                  className="w-16 px-2 py-1 border border-gray-200 rounded text-center"
                />
                <span className="text-sm text-gray-500">명</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-pink-500" />
                <span className="text-sm font-medium text-gray-700">여성</span>
                <input
                  type="number"
                  value={formData.femaleCount}
                  onChange={(e) => setFormData({...formData, femaleCount: parseInt(e.target.value)})}
                  className="w-16 px-2 py-1 border border-gray-200 rounded text-center"
                />
                <span className="text-sm text-gray-500">명</span>
              </div>
            </div>
          </div>

          {/* 모집 실력 범위 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">모집 실력 (NTRP) *</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">최소</span>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="7.0"
                  value={formData.ntrpMin}
                  onChange={(e) => setFormData({...formData, ntrpMin: parseFloat(e.target.value)})}
                  className="w-16 px-2 py-1 border border-gray-200 rounded text-center"
                />
              </div>
              <span className="text-gray-400">~</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">최대</span>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="7.0"
                  value={formData.ntrpMax}
                  onChange={(e) => setFormData({...formData, ntrpMax: parseFloat(e.target.value)})}
                  className="w-16 px-2 py-1 border border-gray-200 rounded text-center"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              참가자의 NTRP 실력 범위를 설정하세요 (1.0-7.0)
            </p>
          </div>
        </div>

        {/* 가격 정보 카드 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
              💡
            </div>
            <h3 className="font-bold text-gray-900">AI 기반 실시간 가격 변동</h3>
          </div>
          <p className="text-sm text-gray-700 mb-4">
            인기도에 기반해 가격이 증가합니다. 판매자가 설정한 
            <span className="font-semibold text-blue-700"> 코트비+공값</span> 이하로는 떨어지지 않습니다.
          </p>
        </div>

        {/* 광고 수익 배분 카드 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3">광고 수익 배분</h3>
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-800 mb-2">광고 수익 배분 참여</h4>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">
                매치 페이지에 광고가 표시되고 수익의 50%를 받습니다 (준비중)
              </span>
              <div className="w-11 h-6 bg-gray-300 rounded-full relative transition-colors">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 매치 판매하기 버튼 */}
        <button className="w-full bg-pink-500 text-white font-bold py-4 rounded-xl text-lg hover:bg-pink-600 transition-colors">
          매치 판매하기
        </button>

        {/* 하단 여백 */}
        <div className="h-8"></div>
      </div>
    </div>
  );
};

export default MatchSellPage;