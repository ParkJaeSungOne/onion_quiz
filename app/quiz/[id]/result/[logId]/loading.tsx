import React from 'react';
import QuizUnifiedLoader from '@/components/QuizUnifiedLoader';

export default function QuizResultLoading() {
  return (
    <QuizUnifiedLoader 
      title="🏆 팩폭 결과 리포트 작성 중..." 
      subtitle="유저님의 성향 점수를 집계하여 뼈 때리는 결과 카드를 불러오고 있습니다 ⚡" 
    />
  );
}
