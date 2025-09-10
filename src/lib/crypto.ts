import LZString from 'lz-string';

// --- Web Crypto API Helpers ---
export const PWD_ITERATIONS = 100000;

// Converts an ArrayBuffer to a Base64 string
export function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Converts a Base64 string to an ArrayBuffer
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derives a key from a password and salt using PBKDF2
export async function getKey(password: string, salt: BufferSource): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PWD_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

// Encrypts a message using the derived key
export async function encryptMessage(
  message: string,
  key: CryptoKey,
): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer }> {
  const enc = new TextEncoder();
  const encodedMessage = enc.encode(message);
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV is recommended for AES-GCM
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedMessage,
  );

  return {
    iv,
    ciphertext: ciphertext,
  };
}

// Decrypts a message using the derived key
export async function decryptMessage(
  ciphertext: ArrayBuffer,
  key: CryptoKey,
  iv: BufferSource,
): Promise<string> {
  const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  const dec = new TextDecoder();
  return dec.decode(decrypted);
}

// --- Interfaces ---
export interface EncryptedParagraph {
  hint: string;
  salt: string; // Base64
  iv: string; // Base64
  ciphertext: string; // Base64
}

export interface Paragraph {
  id: string;
  message: string;
  password: string;
  hint: string;
}

export interface EncryptedLetter {
  title: string;
  paragraphs: EncryptedParagraph[];
}

// Encrypts multiple paragraphs and returns encrypted data with title
export async function encryptParagraphs(
  title: string,
  paragraphs: Paragraph[],
): Promise<EncryptedLetter> {
  const encryptedDataPromises = paragraphs.map(async (p): Promise<EncryptedParagraph> => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const key = await getKey(p.password, salt);
    const { iv, ciphertext } = await encryptMessage(p.message, key);

    return {
      hint: p.hint,
      salt: bufferToBase64(salt.buffer as ArrayBuffer),
      iv: bufferToBase64(iv.buffer as ArrayBuffer),
      ciphertext: bufferToBase64(ciphertext),
    };
  });

  const encryptedParagraphs = await Promise.all(encryptedDataPromises);

  return {
    title,
    paragraphs: encryptedParagraphs,
  };
}

// --- URL Encoding/Decoding Helpers ---

/**
 * Compresses and encodes encrypted letter for URL sharing
 * @param encryptedLetter - Encrypted letter with title and paragraphs
 * @returns URL-safe compressed string
 */
export function encodeDataForURL(encryptedLetter: EncryptedLetter): string {
  const jsonString = JSON.stringify(encryptedLetter);
  return LZString.compressToEncodedURIComponent(jsonString);
}

/**
 * Decodes and decompresses URL parameter back to encrypted letter
 * @param compressed - URL-safe compressed string
 * @returns Encrypted letter or null if invalid
 */
export function decodeDataFromURL(compressed: string): EncryptedLetter | null {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
    if (!decompressed) return null;

    const parsed = JSON.parse(decompressed);

    // Validate structure
    if (
      typeof parsed !== 'object' ||
      !('title' in parsed) ||
      !('paragraphs' in parsed) ||
      !Array.isArray(parsed.paragraphs) ||
      !parsed.paragraphs.every(
        (item: any) => 'hint' in item && 'ciphertext' in item && 'salt' in item && 'iv' in item
      )
    ) {
      return null;
    }

    return parsed as EncryptedLetter;
  } catch (e) {
    console.error('Failed to decode URL data:', e);
    return null;
  }
}
