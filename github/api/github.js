// Read-only status of the public GIO910 repository. No credentials are used.
const REPOSITORY = 'Slam691410/gio910';

module.exports = async function githubStatus(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const response = await fetch(`https://api.github.com/repos/${REPOSITORY}`, {
      headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'GIO910-connector' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return res.status(502).json({ error: 'GitHub tidak dapat dihubungi', upstreamStatus: response.status });
    const repo = await response.json();
    if (repo.full_name.toLowerCase() !== REPOSITORY.toLowerCase() || repo.private) {
      return res.status(502).json({ error: 'Repository publik tidak dapat diverifikasi' });
    }
    return res.status(200).json({ repository: repo.full_name, defaultBranch: repo.default_branch, url: 'https://github.com/' + REPOSITORY, checkedAt: new Date().toISOString(), mode: 'public-read-only' });
  } catch (_) {
    return res.status(502).json({ error: 'GitHub tidak dapat dihubungi' });
  }
};
