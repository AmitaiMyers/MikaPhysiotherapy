import { useSearchParams } from 'react-router';

type ParamValues<K extends string> = Record<K, string | null>;

/**
 * Read and write a fixed set of URL query parameters (field → parameter name), so filtered
 * lists can be shared and survive going back.
 */
export function useUrlParams<K extends string>(names: Record<K, string>): [ParamValues<K>, (patch: Partial<ParamValues<K>>) => void, () => void] {
  const [params, setParams] = useSearchParams();
  const fields = Object.keys(names) as K[];
  const values = Object.fromEntries(fields.map((field) => [field, params.get(names[field])])) as ParamValues<K>;
  const update = (patch: Partial<ParamValues<K>>) => {
    const next = new URLSearchParams(params);
    for (const field of Object.keys(patch) as K[]) {
      const value = patch[field];
      if (value === null || value === undefined || value === '') next.delete(names[field]);
      else next.set(names[field], value);
    }
    setParams(next, { replace: true });
  };
  const clear = () => setParams(new URLSearchParams(), { replace: true });
  return [values, update, clear];
}
