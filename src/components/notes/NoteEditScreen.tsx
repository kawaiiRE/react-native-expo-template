import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useNote } from '@/hooks/useNote';
import { useServices } from '@/stores/AppEnvironmentContext';

import NoteForm from './NoteForm';
import NoteLoadState from './NoteLoadState';

export default function NoteEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes } = useServices();
  const { t } = useTranslation();
  const { state, reload } = useNote(id);

  if (state.status !== 'ready') {
    return <NoteLoadState onRetry={() => void reload()} state={state} />;
  }

  return (
    <NoteForm
      initialValues={{ title: state.note.title, body: state.note.body }}
      onSubmit={(values) => notes.update(state.note.id, values)}
      successMessage={t('notes.updated')}
    />
  );
}
