/**
 * URL Shortener Utilities
 * Compresses 24-character hex MongoDB ObjectIds into 16-character base64url strings,
 * enabling ultra-short sharing URLs without backend database schema changes.
 */

/**
 * Encodes a 24-character hex string (12 bytes) into a 16-character base64url string.
 */
export function encodeShortId(hexId: string): string {
  if (!hexId || hexId.length !== 24) return hexId; // Fallback to original if not a standard ObjectId
  
  try {
    const bytes = [];
    for (let i = 0; i < hexId.length; i += 2) {
      bytes.push(parseInt(hexId.substr(i, 2), 16));
    }
    const binary = String.fromCharCode.apply(null, bytes);
    const base64 = btoa(binary);
    
    // Convert base64 to base64url (RFC 4648)
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, ''); // Remove padding
  } catch (error) {
    console.error('Error encoding short ID:', error);
    return hexId;
  }
}

/**
 * Decodes a 16-character base64url string back into a 24-character hex string.
 */
export function decodeShortId(shortId: string): string {
  if (!shortId || shortId.length !== 16) return shortId; // If not 16 characters, assume it's already a full hex ID
  
  try {
    // Convert base64url to standard base64
    let base64 = shortId
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Restore padding
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const binary = atob(base64);
    const hex = [];
    for (let i = 0; i < binary.length; i++) {
      const code = binary.charCodeAt(i);
      const hexPart = code.toString(16).padStart(2, '0');
      hex.push(hexPart);
    }
    return hex.join('');
  } catch (error) {
    console.error('Error decoding short ID:', error);
    return shortId;
  }
}
