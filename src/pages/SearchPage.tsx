import { Link, useSearchParams } from 'react-router';
import { Icon } from '../components/Icon';
import { Empty, PageHeader } from '../components/ui';
import { searchAll } from '../domain/globalSearch';

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const text = params.get('q') ?? '';
  const results = searchAll(text);
  return (
    <div className="page">
      <PageHeader back title="Search" />
      <div className="global-search">
        <Icon name="search" size={20} />
        <input type="search" autoFocus placeholder="Search muscles, tests, exercises, protocols…" value={text} onChange={(event) => setParams({ q: event.target.value }, { replace: true })} aria-label="Search everything" />
      </div>
      {text.trim() !== '' && results.length === 0 && <Empty>Nothing matches “{text}”.</Empty>}
      {results.length > 0 && (
        <section className="card list-card">
          <ul className="muscle-list">
            {results.map((result) => (
              <li key={result.to}>
                <Link to={result.to} className="muscle-row">
                  <span className="result-kind">{result.kind}</span>
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
      )}
    </div>
  );
}
