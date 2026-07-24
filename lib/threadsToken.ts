import prisma from '@/lib/prisma';

/**
 * DB에 저장된 최신 Threads 장기 토큰을 가져오며, 없을 경우 환경변수 fallback 사용
 */
export async function getThreadsToken(): Promise<string> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'THREADS_ACCESS_TOKEN' }
    });
    if (setting && setting.value.trim()) {
      return setting.value.trim();
    }
  } catch (err) {
    console.warn('[ThreadsToken] DB read error, fallback to env:', err);
  }

  const envToken = process.env.THREADS_ACCESS_TOKEN || '';
  return envToken.replace(/["']/g, '').trim();
}

/**
 * DB에 새로운 Threads 장기 토큰 저장/갱신
 */
export async function saveThreadsToken(token: string): Promise<boolean> {
  const cleanToken = token.replace(/["']/g, '').trim();
  if (!cleanToken) return false;

  try {
    await prisma.systemSetting.upsert({
      where: { key: 'THREADS_ACCESS_TOKEN' },
      update: { value: cleanToken },
      create: { key: 'THREADS_ACCESS_TOKEN', value: cleanToken }
    });
    return true;
  } catch (err) {
    console.error('[ThreadsToken] DB save error:', err);
    return false;
  }
}

/**
 * Meta Graph API를 호출하여 현재 장기 토큰을 60일 자동 연장하고 DB에 즉시 갱신
 */
export async function autoRenewThreadsToken(): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const currentToken = await getThreadsToken();
    if (!currentToken) {
      return { success: false, error: 'No token available to renew' };
    }

    const renewUrl = `https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${currentToken}`;
    const res = await fetch(renewUrl, { cache: 'no-store' });
    const data = await res.json();

    if (res.ok && data.access_token) {
      const newToken = data.access_token;
      await saveThreadsToken(newToken);
      console.log('[ThreadsToken Auto-Renew] Token successfully renewed for another 60 days!');
      return { success: true, token: newToken };
    } else {
      const errorMsg = data.error?.message || JSON.stringify(data);
      console.warn('[ThreadsToken Auto-Renew Warning]:', errorMsg);
      return { success: false, error: errorMsg };
    }
  } catch (err: any) {
    console.error('[ThreadsToken Auto-Renew Error]:', err);
    return { success: false, error: err.message };
  }
}
