import { Link, useSearchParams } from 'react-router';
import { Icon } from '../components/Icon';
import { EmptyState, PageHeader } from '../components/ui';
import { searchAll, type ResultKind, type SearchResult } from '../domain/globalSearch';
import { clearRecentSearches, rememberSearch, useRecentSearches } from '../domain/recentSearches';

/** Results grouped by kind, groups in the order their best match appears. */
function groupByKind(results: SearchResult[]): { kind: ResultKind; items: SearchResult[] }[] {
  const groups = new Map<ResultKind, SearchResult[]>();
  for (const result of results) groups.set(result.kind, [...(groups.get(result.kind) ?? []), result]);
  return [...groups.entries()].map(([kind, items]) => ({ kind, items }));
}

const PLURAL: Record<ResultKind, string> = {
  Muscle: 'Muscles',
  Bone: 'Bones',
  Joint: 'Joints',
  Nerve: 'Nerves',
  'Special test': 'Special tests',
  Exercise: 'Exercises',
  Protocol: 'Protocols',
  Technique: 'Techniques',
  Condition: 'Conditions',
};

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const recent = useRecentSearches();
  const text = params.get('q') ?? '';
  const results = searchAll(text);
  const search = (q: string) => setParams({ q }, { replace: true });

  return (
    <div className="page">
      <PageHeader back title="Search" />
      <div className="global-search">
        <Icon name="search" size={20} />
        <input type="search" autoFocus placeholder="Muscles, tests, exercises, techniques…" value={text} onChange={(event) => search(event.target.value)} aria-label="Search everything" />
      </div>
      {text.trim() === '' && recent.length > 0 && (
        <section className="recent-searches" aria-label="Recent searches">
          <div className="results-header">
            <h2 className="t-label">Recent</h2>
            <button type="button" className="text-button small" onClick={clearRecentSearches}>
              Clear
            </button>
          </div>
          <div className="chips">
            {recent.map((q) => (
              <button key={q} type="button" className="toggle-chip" onClick={() => search(q)}>
                {q}
              </button>
            ))}
          </div>
        </section>
      )}
      {text.trim() !== '' && results.length === 0 && (
        <EmptyState icon="search">Nothing matches “{text}”. Try a shorter word, a Latin name or a synonym.</EmptyState>
      )}
      {text.trim() !== '' && results.length > 0 && (
        <p className="muted small" role="status">
          {results.length} {results.length === 1 ? 'result' : 'results'}
        </p>
      )}
      {groupByKind(results).map((group) => (
        <section key={group.kind} className="card list-card" aria-label={PLURAL[group.kind]}>
          <h2 className="list-card-title t-label">
            {PLURAL[group.kind]} <span className="count">{group.items.length}</span>
          </h2>
          <ul className="muscle-list">
            {group.items.map((result) => (
              <li key={result.to}>
                <Link to={result.to} className="muscle-row" onClick={() => rememberSearch(text)}>
                  <span className="muscle-row-text">
                    <span className="muscle-row-name">{result.title}</span>
                    <span className="muscle-row-meta">{result.subtitle}</span>
                  </span>
                  <span className="chevron" aria-hidden="true">
                    <Icon name="chevron" size={18} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
