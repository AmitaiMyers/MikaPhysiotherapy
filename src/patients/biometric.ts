/**
 * Fingerprint / face unlock through WebAuthn with the PRF extension: the authenticator returns a
 * secret only after the user verifies, and that secret derives the key that unwraps the data key.
 * Supported on recent Android (Chrome) and iOS (Safari 18) devices with a passkey-capable lock.
 */
import { randomBytes } from './crypto';

function prfOutput(credential: PublicKeyCredential): Uint8Array | null {
  const results = credential.getClientExtensionResults().prf?.results?.first;
  if (results === undefined) return null;
  return new Uint8Array(results instanceof ArrayBuffer ? results : results.buffer);
}

const buffer = (view: Uint8Array): ArrayBuffer => new Uint8Array(view).buffer;

/** Whether the browser can create a platform credential at all (PRF itself is checked on enrol). */
export async function biometricAvailable(): Promise<boolean> {
  if (typeof PublicKeyCredential === 'undefined') return false;
  return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}

/** Ask the authenticator for the PRF secret of an existing credential. */
export async function biometricSecret(credentialId: Uint8Array, salt: Uint8Array): Promise<Uint8Array> {
  const credential = (await navigator.credentials.get({
    publicKey: {
      challenge: buffer(randomBytes(32)),
      allowCredentials: [{ type: 'public-key', id: buffer(credentialId) }],
      userVerification: 'required',
      extensions: { prf: { eval: { first: buffer(salt) } } },
    },
  })) as PublicKeyCredential | null;
  if (credential === null) throw new Error('Biometric unlock was cancelled.');
  const secret = prfOutput(credential);
  if (secret === null) throw new Error('This device did not return a biometric key.');
  return secret;
}

/** Create a credential for this app and return its id and PRF secret; throws if PRF is unsupported. */
export async function enrolBiometric(salt: Uint8Array): Promise<{ credentialId: Uint8Array; secret: Uint8Array }> {
  const credential = (await navigator.credentials.create({
    publicKey: {
      rp: { name: 'Mika Physio' },
      user: { id: buffer(randomBytes(16)), name: 'mika', displayName: 'Mika' },
      challenge: buffer(randomBytes(32)),
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
      extensions: { prf: { eval: { first: buffer(salt) } } },
    },
  })) as PublicKeyCredential | null;
  if (credential === null) throw new Error('Biometric set-up was cancelled.');
  if (credential.getClientExtensionResults().prf?.enabled !== true) throw new Error('This device does not support biometric encryption keys (WebAuthn PRF).');
  const credentialId = new Uint8Array(credential.rawId);
  // Some authenticators only return the secret on a later sign-in, not at creation.
  const secret = prfOutput(credential) ?? (await biometricSecret(credentialId, salt));
  return { credentialId, secret };
}
