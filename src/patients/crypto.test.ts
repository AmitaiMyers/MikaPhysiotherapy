import { describe, expect, it } from 'vitest';
import { fromBase64, generateDataKey, keyFromPin, keyFromSecret, openJson, randomBytes, sealJson, toBase64, unwrapDataKey, wrapDataKey } from './crypto';

describe('patient data encryption', () => {
  it('round-trips a record with the data key', async () => {
    const key = await generateDataKey();
    const sealed = await sealJson(key, { firstName: 'Dana', age: 34 });
    expect(new TextDecoder().decode(sealed.data)).not.toContain('Dana');
    expect(await openJson(key, sealed)).toEqual({ firstName: 'Dana', age: 34 });
  });

  it('unwraps the data key only with the right PIN', async () => {
    const dataKey = await generateDataKey();
    const salt = randomBytes(16);
    const wrapped = await wrapDataKey(dataKey, await keyFromPin('123456', salt));
    const sealed = await sealJson(dataKey, 'secret');
    const unwrapped = await unwrapDataKey(wrapped, await keyFromPin('123456', salt));
    expect(await openJson(unwrapped, sealed)).toBe('secret');
    await expect(unwrapDataKey(wrapped, await keyFromPin('654321', salt))).rejects.toThrow();
  });

  it('derives the same key from the same biometric secret', async () => {
    const dataKey = await generateDataKey();
    const secret = randomBytes(32);
    const salt = randomBytes(16);
    const wrapped = await wrapDataKey(dataKey, await keyFromSecret(secret, salt));
    const unwrapped = await unwrapDataKey(wrapped, await keyFromSecret(secret, salt));
    expect(await openJson(unwrapped, await sealJson(dataKey, [1, 2]))).toEqual([1, 2]);
  });

  it('round-trips base64', () => {
    const data = randomBytes(40);
    expect(fromBase64(toBase64(data))).toEqual(data);
  });
});
