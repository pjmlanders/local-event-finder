/**
 * Map Firebase Auth error codes to user-friendly messages.
 * Prevents leaking internal identifiers / confirming email existence.
 */

const errorMessages: Record<string, string> = {
  // Sign-in errors
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'Invalid email or password.',
  'auth/wrong-password': 'Invalid email or password.',

  // Sign-up errors
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password is too weak. Please use at least 8 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled.',

  // General / rate limit
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
  'auth/popup-blocked': 'Sign-in popup was blocked by your browser. Please allow popups and try again.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/internal-error': 'Something went wrong. Please try again.',
}

/**
 * Extract a user-friendly message from a Firebase Auth error.
 */
export function getFriendlyAuthError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code
    return errorMessages[code] ?? 'Something went wrong. Please try again.'
  }
  return 'Something went wrong. Please try again.'
}
