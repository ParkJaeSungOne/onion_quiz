import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const revalidate = 1800; // 30분 캐싱

export async function GET() {
  try {
    const quizzes = await prisma.quiz.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        createdAt: true
      }
    });

    const baseUrl = 'https://kkado-kkado.com';

    const xmlItems = quizzes.map((quiz) => {
      const pubDate = new Date(quiz.createdAt).toUTCString();
      const safeTitle = quiz.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeDesc = (quiz.description || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      return `
    <item>
      <title><![CDATA[${safeTitle}]]></title>
      <link>${baseUrl}/quiz/${quiz.id}</link>
      <guid>${baseUrl}/quiz/${quiz.id}</guid>
      <description><![CDATA[${safeDesc || safeTitle} - 까도까도 팩폭 성향 테스트]]></description>
      <category><![CDATA[${quiz.category}]]></category>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>까도까도 성향테스트 연구소</title>
    <link>${baseUrl}</link>
    <description>요즘 핫한 밈이랑 뼈 때리는 팩폭 성향 테스트만 매일 배달함 🧅</description>
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${xmlItems}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('Failed to generate Feed:', error);
    return new Response('<error>Failed to generate Feed</error>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' }
    });
  }
}
