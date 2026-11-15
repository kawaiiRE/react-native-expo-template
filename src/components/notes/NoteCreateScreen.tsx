import { useTranslation } from 'react-i18next';

import { useServices } from '@/stores/AppEnvironmentContext';

import NoteForm from './NoteForm';

const EMPTY_NOTE = { title: '', body: '' };

export default function NoteCreateScreen() {
  const { notes } = useServices();
  const { t } = useTranslation();

  return (
    <NoteForm
      initialValues={EMPTY_NOTE}
      onSubmit={(values) => notes.create(values)}
      successMessage={t('notes.created')}
    />
  );
}
