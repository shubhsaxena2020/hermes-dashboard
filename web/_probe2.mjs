import { chromium } from 'playwright';
try {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setContent('<h1 style="color:red">hello</h1>');
  console.log('LAUNCH OK, title len', (await p.content()).length);
  await b.close();
} catch (e) { console.log('LAUNCH FAIL:', e.message.split('\n')[0]); }
