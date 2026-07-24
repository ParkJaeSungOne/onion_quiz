/**
 * 🇰🇷 한국 표준시 (KST, UTC+9) 날짜 및 자정(00:00:00 KST) 계산 유틸리티
 */

export function getKstDateAndStart() {
  const now = new Date();
  // UTC 시간에 9시간을 더해 KST 시각 계산
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  const year = kstNow.getUTCFullYear();
  const month = kstNow.getUTCMonth(); // 0 ~ 11
  const day = kstNow.getUTCDate();

  const monthStr = String(month + 1).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  const todayKst = `${year}-${monthStr}-${dayStr}`;

  // KST 자정 00:00:00.000 KST 에 해당하는 정확한 UTC Date 객체 (Date.UTC(year, month, day) - 9시간)
  const todayStartKstUTC = new Date(Date.UTC(year, month, day) - 9 * 60 * 60 * 1000);

  return { todayKst, todayStartKstUTC };
}

export function getKstDateString(): string {
  return getKstDateAndStart().todayKst;
}
