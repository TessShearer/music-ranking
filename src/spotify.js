const CLIENT_ID = process.env.VUE_APP_SPOTIFY_CLIENT_ID
const REDIRECT_URI = process.env.VUE_APP_SPOTIFY_REDIRECT_URI

function generateCodeVerifier() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function startSpotifyAuth(returnPath) {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  sessionStorage.setItem('spotify_code_verifier', verifier)
  sessionStorage.setItem('spotify_return_path', returnPath)
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: 'playlist-modify-public playlist-modify-private',
    show_dialog: 'true',
  })
  window.location.href = `https://accounts.spotify.com/authorize?${params}`
}

export async function handleSpotifyCallback(code) {
  const verifier = sessionStorage.getItem('spotify_code_verifier')
  if (!verifier) throw new Error('No code verifier found — please try connecting again.')
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error_description || 'Token exchange failed')
  }
  const data = await response.json()
  sessionStorage.setItem('spotify_access_token', data.access_token)
  sessionStorage.setItem('spotify_token_expiry', String(Date.now() + (data.expires_in - 60) * 1000))
  sessionStorage.setItem('spotify_granted_scopes', data.scope || '')
  sessionStorage.removeItem('spotify_code_verifier')
  const returnPath = sessionStorage.getItem('spotify_return_path') || '/'
  sessionStorage.removeItem('spotify_return_path')
  return returnPath
}

export function getSpotifyToken() {
  const token = sessionStorage.getItem('spotify_access_token')
  const expiry = parseInt(sessionStorage.getItem('spotify_token_expiry') || '0')
  return token && Date.now() < expiry ? token : null
}

export function clearSpotifyToken() {
  sessionStorage.removeItem('spotify_access_token')
  sessionStorage.removeItem('spotify_token_expiry')
  sessionStorage.removeItem('spotify_granted_scopes')
}

export function spotifyTokenHasPlaylistScope() {
  const granted = (sessionStorage.getItem('spotify_granted_scopes') || '').split(' ')
  return granted.includes('playlist-modify-public') || granted.includes('playlist-modify-private')
}

export async function searchSpotifyTrack(artistName, trackTitle, token) {
  const q = `track:${trackTitle} artist:${artistName}`
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.tracks?.items?.[0] || null
}

export async function createSpotifyPlaylist(name, token) {
  const res = await fetch('https://api.spotify.com/v1/me/playlists', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description: '', public: true }),
  })
  if (!res.ok) throw new Error('Failed to create Spotify playlist')
  return res.json()
}

export async function addTracksToSpotifyPlaylist(playlistId, uris, token) {
  for (let i = 0; i < uris.length; i += 100) {
    const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: uris.slice(i, i + 100) }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const msg = err?.error?.message || `HTTP ${res.status}`
      throw Object.assign(new Error(`Failed to add tracks: ${msg}`), { status: res.status })
    }
  }
}
