export async function loadSupport(fetcher = fetch) {
  try {
    const response = await fetcher(new URL('./funding.json', import.meta.url));
    if (!response.ok) return { enabled: false };
    const config = await response.json();
    const valid = config.provider === 'github' && config.currency === 'USD' && config.minimum === 100
      && config.githubSponsors === 'https://github.com/sponsors/klederson';
    return { enabled: valid && config.enabled === true, url: valid ? config.githubSponsors : null };
  } catch { return { enabled: false }; }
}
