import dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log('--- Testing Threads API Raw Text Response ---');
  
  const tokenRaw = process.env.THREADS_ACCESS_TOKEN || '';
  const token = tokenRaw.replace(/["']/g, '').trim();

  if (!token) {
    console.error('Error: THREADS_ACCESS_TOKEN is missing!');
    process.exit(1);
  }

  const testText = "🧪 까도까도 퀴즈 연구소 테스트 중입니다!";
  const url = `https://graph.threads.net/v1.0/me/threads?media_type=TEXT&text=${encodeURIComponent(testText)}&access_token=${token}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const text = await res.text();
    console.log('HTTP Status:', res.status);
    console.log('Response Headers:', Object.fromEntries(res.headers.entries()));
    console.log('Raw Response Text:', text);
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

main();
