/**
 * Encryption for patient data (Web Crypto, AES-GCM 256).
 *
 * A random data key encrypts every record. The data key itself is stored only "wrapped"
 * (encrypted) with a key derived from Mika's PIN (PBKDF2) and, optionally, with a key from the
 * device's fingerprint or face unlock (WebAuthn PRF). Without the PIN or the biometric the stored
 * data cannot be read.
 */

export const MIN_PIN_LENGTH = 6;
const PBKDF2_ITERATIONS = 600_000;

/** Encrypted bytes with the random nonce used to encrypt them. */
export interface Sealed {
  iv: Uint8Array;
  data: Uint8Array;
}

/** Web Crypto wants ArrayBuffer-backed views; this keeps the types honest. */
function bytes(view: Uint8Array): Uint8Array<ArrayBuffer> {
  return new Uint8Array(view);
}

export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/** A new random data key. Extractable only so it can be wrapped. */
export function generateDataKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

/** Key-encryption key from the PIN. */
export async function keyFromPin(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: bytes(salt), iterations: PBKDF2_ITERATIONS },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Key-encryption key from a WebAuthn PRF secret. */
export async function keyFromSecret(secret: Uint8Array, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', bytes(secret), 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: bytes(salt), info: new TextEncoder().encode('mika-physio data key') },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function sealBytes(key: CryptoKey, plain: Uint8Array): Promise<Sealed> {
  const iv = randomBytes(12);
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: bytes(iv) }, key, bytes(plain)));
  return { iv, data };
}

/** Throws (OperationError) when the key is wrong or the data was tampered with. */
export async function openBytes(key: CryptoKey, sealed: Sealed): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(sealed.iv) }, key, bytes(sealed.data)));
}

export function sealJson(key: CryptoKey, value: unknown): Promise<Sealed> {
  return sealBytes(key, new TextEncoder().encode(JSON.stringify(value)));
}

export async function openJson<T>(key: CryptoKey, sealed: Sealed): Promise<T> {
  return JSON.parse(new TextDecoder().decode(await openBytes(key, sealed))) as T;
}

export async function wrapDataKey(dataKey: CryptoKey, wrappingKey: CryptoKey): Promise<Sealed> {
  return sealBytes(wrappingKey, new Uint8Array(await crypto.subtle.exportKey('raw', dataKey)));
}

/** The unwrapped data key is not extractable. Throws when the wrapping key is wrong. */
export async function unwrapDataKey(wrapped: Sealed, wrappingKey: CryptoKey): Promise<CryptoKey> {
  const raw = await openBytes(wrappingKey, wrapped);
  return crypto.subtle.importKey('raw', bytes(raw), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

// ---------- base64, for backup files ----------

export function toBase64(data: Uint8Array): string {
  let binary = '';
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function fromBase64(text: string): Uint8Array {
  return Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
}
