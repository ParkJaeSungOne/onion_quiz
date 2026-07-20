import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export const revalidate = 3600; // 1시간마다 sitemap 캐시 갱신

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://kkado-kkado.com';

  // 1. 기본 페이지 등록
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
  ];

  try {
    // 2. 데이터베이스에서 모든 성향 테스트 조회
    const quizzes = await prisma.quiz.findMany({
      select: {
        id: true,
        createdAt: true,
      },
    });

    // 3. 테스트별 상세 경로 동적 매핑
    const quizRoutes = quizzes.map((quiz) => ({
      url: `${baseUrl}/quiz/${quiz.id}`,
      lastModified: quiz.createdAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...routes, ...quizRoutes];
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    return routes;
  }
}
