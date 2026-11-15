import type { AppResult } from '@/models/errors';
import type {
  CreateNoteInput,
  Note,
  NotesQuery,
  Page,
  UpdateNoteInput,
} from '@/models/note';
import type { NotesPort } from '@/services/backend/ports';

export type NoteChange =
  | { type: 'created'; note: Note }
  | { type: 'updated'; note: Note }
  | { type: 'deleted'; id: string };

type NoteChangeListener = (change: NoteChange) => void;

/** Notes access plus change events that keep every open list and detail in sync. */
export class NotesService {
  private readonly listeners = new Set<NoteChangeListener>();

  constructor(private readonly port: NotesPort) {}

  subscribe(listener: NoteChangeListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  list(
    query: NotesQuery,
    signal?: AbortSignal,
  ): Promise<AppResult<Page<Note>>> {
    return this.port.list(query, signal);
  }

  get(id: string, signal?: AbortSignal): Promise<AppResult<Note>> {
    return this.port.get(id, signal);
  }

  async create(input: CreateNoteInput): Promise<AppResult<Note>> {
    const result = await this.port.create(input);
    if (result.ok) this.emit({ type: 'created', note: result.data });
    return result;
  }

  async update(id: string, input: UpdateNoteInput): Promise<AppResult<Note>> {
    const result = await this.port.update(id, input);
    if (result.ok) this.emit({ type: 'updated', note: result.data });
    return result;
  }

  async remove(id: string): Promise<AppResult<void>> {
    const result = await this.port.remove(id);
    if (result.ok) this.emit({ type: 'deleted', id });
    return result;
  }

  private emit(change: NoteChange) {
    this.listeners.forEach((listener) => listener(change));
  }
}
