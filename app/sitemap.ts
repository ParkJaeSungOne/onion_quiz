import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export const revalidate = 300; // 5분마다 sitemap 갱신 (신규 AI 퀴즈 즉시 수집 유도)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://kkado-kkado.com';

  // 1. 기본 메인 및 고정 서비스 페이지 등록
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/guestbook`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ];

  try {
    // 2. 데이터베이스에서 모든 성향 테스트 조회
    const quizzes = await prisma.quiz.findMany({
      select: {
        id: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // 3. 테스트별 상세 경로 동적 매핑 (우선순위 0.9로 최상위 상향)
    const quizRoutes = quizzes.map((quiz) => ({
      url: `${baseUrl}/quiz/${quiz.id}`,
      lastModified: quiz.createdAt || new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));

    return [...staticRoutes, ...quizRoutes];
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    return staticRoutes;
  }
}
