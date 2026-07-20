import net from 'node:net';

const host = 'aws-0-ap-southeast-1.pooler.supabase.com';
const port = 5432;

console.log(`Connecting to ${host}:${port}...`);
const start = Date.now();

const socket = net.connect(port, host, () => {
  const duration = Date.now() - start;
  console.log(`Successfully connected in ${duration}ms!`);
  socket.destroy();
});

socket.on('error', (err) => {
  console.error('Connection failed:', err.message);
});
