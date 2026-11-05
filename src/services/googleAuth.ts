/**
 * Google Workspace Authentication & Gmail API Integration Service
 * Uses Firebase Auth (GoogleAuthProvider) with OAuth scopes:
 * - https://www.googleapis.com/auth/gmail.send
 * - https://mail.google.com/
 * - https://www.googleapis.com/auth/gmail.compose
 *
 * Implements strict client-side OAuth token management in memory
 * (no storage of tokens in localStorage/sessionStorage per security guidelines).
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse existing Firebase app or initialize once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with requested Gmail scopes
export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
];

const provider = new GoogleAuthProvider();
GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

// In-memory access token cache (CRITICAL: never persist in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: User | null = null;
let isSigningIn = false;

// Subscribers for auth state changes
type AuthListener = (user: User | null, token: string | null) => void;
const listeners: Set<AuthListener> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener(cachedGoogleUser, cachedAccessToken);
    } catch (e) {
      console.error('Error in auth listener:', e);
    }
  });
}

// Initialize Firebase Auth listener on startup
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (user) => {
    cachedGoogleUser = user;
    if (!user) {
      cachedAccessToken = null;
    }
    notifyListeners();
  });
}

/**
 * Subscribe to Google Auth changes
 */
export function subscribeToGoogleAuth(listener: AuthListener): () => void {
  listeners.add(listener);
  // Emit current state immediately
  listener(cachedGoogleUser, cachedAccessToken);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Sign in to Google Workspace using popup
 */
export async function signInWithGoogleWorkspace(): Promise<{
  user: User;
  accessToken: string;
}> {
  if (isSigningIn) {
    throw new Error('Google Sign-In is already in progress');
  }

  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google OAuth access token');
    }

    cachedAccessToken = credential.accessToken;
    cachedGoogleUser = result.user;
    notifyListeners();

    return {
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } catch (error: any) {
    console.error('Google Workspace Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Disconnect Google Workspace session & clear in-memory tokens
 */
export async function disconnectGoogleWorkspace(): Promise<void> {
  await signOut(auth);
  cachedAccessToken = null;
  cachedGoogleUser = null;
  notifyListeners();
}

/**
 * Retrieve active in-memory access token
 */
export function getGoogleAccessToken(): string | null {
  return cachedAccessToken;
}

/**
 * Retrieve active connected Google user
 */
export function getConnectedGoogleUser(): User | null {
  return cachedGoogleUser;
}

/**
 * Check if Google Workspace is currently connected and ready to send emails
 */
export function isGoogleConnected(): boolean {
  return !!cachedAccessToken && !!cachedGoogleUser;
}

/**
 * Build RFC 2822 compliant MIME email and encode it in Base64URL
 */
export function encodeEmailRFC2822(params: {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): string {
  const toAddress = Array.isArray(params.to) ? params.to.join(', ') : params.to;
  const fromAddress = params.from || 'JaySoftShine ERP <me>';
  const replyTo = params.replyTo || 'jay@jaysoftshine.com';

  const boundary = `__boundary_${Date.now().toString(16)}__`;

  // RFC 2822 MIME message construction
  const rawParts = [
    `To: ${toAddress}`,
    `From: ${fromAddress}`,
    `Reply-To: ${replyTo}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    params.text || 'JaySoftShine ERP Automated Notification',
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    params.html,
    '',
    `--${boundary}--`,
  ];

  const rawString = rawParts.join('\r\n');

  // Convert to Base64URL (RFC 4648 §5)
  return btoa(unescape(encodeURIComponent(rawString)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Send an email directly via the official Google Gmail REST API v1
 * Endpoint: POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send
 */
export async function sendGmailMessage(params: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}): Promise<{
  success: boolean;
  messageId?: string;
  threadId?: string;
  senderEmail?: string;
  error?: string;
}> {
  const token = cachedAccessToken;
  const googleUser = cachedGoogleUser;

  if (!token) {
    return {
      success: false,
      error:
        'Google Workspace is not connected. Please click "Sign in with Google" to authorize Gmail sending.',
    };
  }

  const senderEmail = googleUser?.email || 'me';
  const fromFormatted = params.from || `JaySoftShine ERP <${senderEmail}>`;

  try {
    const rawBase64Url = encodeEmailRFC2822({
      to: params.to,
      from: fromFormatted,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
    });

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: rawBase64Url,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error:
          data.error?.message ||
          'Failed to send email via Google Gmail API. Please verify account permissions.',
      };
    }

    return {
      success: true,
      messageId: data.id,
      threadId: data.threadId,
      senderEmail,
    };
  } catch (err: any) {
    console.error('Error invoking Gmail API:', err);
    return {
      success: false,
      error: err.message || 'Network error communicating with Gmail REST API',
    };
  }
}
