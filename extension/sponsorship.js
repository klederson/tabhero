// Matches the GET custom-amount form served by github.com/sponsors/klederson.
// This only opens review/sign-in; it never confirms or creates a payment.
export function sponsorshipUrl(amount) {
  const value = String(amount ?? '').trim();
  if (!/^[1-9]\d*$/.test(value)) return null;
  const dollars = Number(value);
  if (!Number.isSafeInteger(dollars) || dollars > 12000) return null;
  const url = new URL('https://github.com/sponsors/klederson/sponsorships');
  url.searchParams.set('amount', String(dollars));
  url.searchParams.set('frequency', 'one-time');
  return url.href;
}
