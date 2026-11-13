export interface SessionPayload {
  userId: string;
  email: string;
  role: 'student' | 'admin';
  timestamp: number;
}

/**
 * Creates a base64url-encoded lightweight session token
 */
export function createSessionToken(userId: string, email: string, role: 'student' | 'admin'): string {
  const payload: SessionPayload = {
    userId,
    email,
    role,
    timestamp: Date.now(),
  };

  const jsonString = JSON.stringify(payload);
  if (typeof btoa === 'function') {
    return btoa(jsonString);
  }
  return Buffer.from(jsonString).toString('base64url');
}

/**
 * Decodes a session token
 */
export function parseSessionToken(token: string): SessionPayload | null {
  try {
    let jsonString: string;
    if (typeof atob === 'function') {
      jsonString = atob(token);
    } else {
      jsonString = Buffer.from(token, 'base64url').toString('utf8');
    }
    return JSON.parse(jsonString) as SessionPayload;
  } catch {
    return null;
  }
}
