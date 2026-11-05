// Complete first-install UI before a test starts counting its scenario's tabs.
export async function dismissChromiumWelcome(context) {
  let welcome;
  for (let attempt = 0; attempt < 100 && !welcome; attempt++) {
    welcome = context.pages().find(page => page.url().endsWith('/welcome.html'));
    if (!welcome) await new Promise(resolve => setTimeout(resolve, 50));
  }
  if (!welcome) throw new Error('Fresh install must expose its privacy disclosure');
  await welcome.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await welcome.close();
}
