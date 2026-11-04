import { useState } from 'react';
import { Link } from 'react-router';
import { addToProgramme, createProgramme, useProgrammes } from '../domain/programmeStore';
import type { ProgrammeItem } from '../domain/programmes';

interface Props {
  items: ProgrammeItem[];
  /** Title suggested for a new programme. */
  defaultTitle: string;
  /** Notes for a new programme, e.g. the protocol phase restrictions. */
  defaultNotes?: string;
  label: string;
}

/** Add one or more exercises to an existing or a new home exercise programme. */
export function AddToProgramme({ items, defaultTitle, defaultNotes = '', label }: Props) {
  const programmes = useProgrammes();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle);
  const [added, setAdded] = useState<{ id: string; title: string } | null>(null);

  const finish = (id: string, programmeTitle: string) => {
    setAdded({ id, title: programmeTitle });
    setOpen(false);
  };

  if (!open) {
    return (
      <div className="add-to-programme">
        <button type="button" className="button" onClick={() => setOpen(true)}>
          {label}
        </button>
        {added !== null && (
          <p className="small">
            Added to <Link to={`/rehab/programmes/${added.id}`}>{added.title}</Link>.
          </p>
        )}
      </div>
    );
  }

  return (
    <section className="card add-to-programme" aria-label={label}>
      {programmes.length > 0 && (
        <>
          <h3 className="subheading">Add to</h3>
          <ul className="link-list">
            {programmes.map((programme) => (
              <li key={programme.id}>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    addToProgramme(programme.id, items);
                    finish(programme.id, programme.title);
                  }}
                >
                  {programme.title} ({programme.items.length})
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <h3 className="subheading">New programme</h3>
      <form
        className="search-row"
        onSubmit={(event) => {
          event.preventDefault();
          const programme = createProgramme(title.trim(), items, defaultNotes);
          finish(programme.id, programme.title);
        }}
      >
        <input className="search-input" aria-label="Programme title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <button type="submit" className="button button-active" disabled={title.trim() === ''}>
          Create
        </button>
      </form>
      <button type="button" className="text-button" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </section>
  );
}
