import { isPureHumanVisitor } from '../lib/visitorFilter.ts';

const fakeReqHuman = {
  headers: {
    get: (key) => key.toLowerCase() === 'user-agent' ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15' : null
  },
  cookies: {
    get: (key) => null
  }
};

const fakeReqBot = {
  headers: {
    get: (key) => key.toLowerCase() === 'user-agent' ? 'curl/7.81.0' : null
  },
  cookies: {
    get: (key) => null
  }
};

console.log('Human User-Agent test result:', isPureHumanVisitor(fakeReqHuman));
console.log('Bot User-Agent test result:', isPureHumanVisitor(fakeReqBot));
