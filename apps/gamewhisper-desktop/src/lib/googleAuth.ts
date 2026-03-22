import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { openUrl } from '@tauri-apps/plugin-opener'
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'
import { auth } from './firebase'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string
const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET as string

function base64UrlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Full Google sign-in flow for desktop:
 * 1. Start a one-shot loopback HTTP server (Rust) → get random port
 * 2. Generate PKCE pair
 * 3. Open Google OAuth in system browser with redirect_uri=http://127.0.0.1:{port}
 * 4. Rust catches the redirect, emits `oauth-callback` event
 * 5. Exchange auth code for Google ID token
 * 6. Sign into Firebase with the ID token
 *
 * Returns a Promise that resolves when sign-in is complete.
 */
export async function startGoogleSignIn(): Promise<void> {
  const port = await invoke<number>('start_oauth_server')
  const redirectUri = `http://127.0.0.1:${port}`

  const verifier = base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)))
  const challenge = base64UrlEncode(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))),
  )

  return new Promise<void>((resolve, reject) => {
    let unlistenFn: (() => void) | undefined
    const cleanup = () => unlistenFn?.()

    listen<string>('oauth-callback', async (event) => {
      cleanup()
      try {
        const query = event.payload.split('?')[1] ?? ''
        const params = new URLSearchParams(query)
        const code = params.get('code')
        const error = params.get('error')

        if (error) throw new Error(`Google auth error: ${error}`)
        if (!code) throw new Error('No auth code in callback')

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
            code_verifier: verifier,
          }),
        })

        if (!tokenRes.ok) {
          const body = await tokenRes.text()
          throw new Error(`Token exchange failed (${tokenRes.status}): ${body}`)
        }

        const { id_token } = (await tokenRes.json()) as { id_token: string }
        await signInWithCredential(auth, GoogleAuthProvider.credential(id_token))
        resolve()
      } catch (err) {
        reject(err)
      }
    }).then((fn) => {
      unlistenFn = fn
    })

    const authParams = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    })

    openUrl(`https://accounts.google.com/o/oauth2/v2/auth?${authParams}`).catch((err) => {
      cleanup()
      reject(err)
    })
  })
}
