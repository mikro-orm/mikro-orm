'use strict';

const fs = require('node:fs');

const REPO = 'mikro-orm/mikro-orm';
const PER_PAGE = 100;

function trim(release) {
  return {
    name: release.name,
    tagName: release.tag_name,
    publishedAt: release.published_at,
    htmlUrl: release.html_url,
    body: release.body || '',
    prerelease: release.prerelease,
    draft: release.draft,
  };
}

function loadCache(cachePath) {
  if (!fs.existsSync(cachePath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
}

function saveCache(cachePath, releases) {
  fs.writeFileSync(cachePath, JSON.stringify(releases, null, 2) + '\n');
}

function sortReleases(releases) {
  return [...releases].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

async function fetchPage(page, token) {
  const url = `https://api.github.com/repos/${REPO}/releases?per_page=${PER_PAGE}&page=${page}`;
  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'mikro-orm-docs-changelog',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status} on page ${page}: ${text}`);
  }
  return res.json();
}

async function fetchReleases({ cachePath, token, offline }) {
  const cached = loadCache(cachePath);

  if (offline) {
    return sortReleases(cached);
  }

  const cachedTags = new Set(cached.map(r => r.tagName));
  const newReleases = [];

  try {
    let page = 1;
    while (true) {
      const batch = await fetchPage(page, token);
      if (batch.length === 0) {
        break;
      }
      let hitCached = false;
      for (const release of batch) {
        if (cachedTags.has(release.tag_name)) {
          hitCached = true;
          break;
        }
        newReleases.push(trim(release));
      }
      if (hitCached || batch.length < PER_PAGE) {
        break;
      }
      page += 1;
    }
  } catch (err) {
    if (cached.length > 0) {
      console.warn(`[changelog] Failed to fetch releases from GitHub, using cached data: ${err.message}`);
      return sortReleases(cached);
    }
    throw err;
  }

  const merged = sortReleases([...newReleases, ...cached]);
  if (newReleases.length > 0) {
    saveCache(cachePath, merged);
    console.log(`[changelog] Added ${newReleases.length} new release(s) to the cache.`);
  }
  return merged;
}

module.exports = { fetchReleases };
