import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { RadioButton } from 'react-native-paper';

import Screen from '@/components/ui/Screen';
import SectionCard from '@/components/ui/SectionCard';
import { useLanguageSwitcher } from '@/hooks/useLanguageSwitcher';
import {
  SUPPORTED_LANGUAGES,
  isAppLanguage,
  languageNativeNames,
} from '@/i18n/languages';
import { usePreferences } from '@/stores/AppEnvironmentContext';
import { makeStyles } from '@/theme/makeStyles';
import { sizes } from '@/theme/tokens';

const DEVICE = 'device';

export default observer(function LanguageScreen() {
  const preferences = usePreferences();
  const switchLanguage = useLanguageSwitcher();
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <Screen safeBottom>
      <SectionCard flush>
        <RadioButton.Group
          onValueChange={(value) =>
            void switchLanguage(isAppLanguage(value) ? value : null)
          }
          value={preferences.language ?? DEVICE}
        >
          <RadioButton.Item
            label={`${t('settings.languageDevice')} · ${languageNativeNames[preferences.deviceLanguage]}`}
            labelVariant="bodyLarge"
            mode="android"
            position="leading"
            style={styles.item}
            value={DEVICE}
          />
          {SUPPORTED_LANGUAGES.map((language) => (
            <RadioButton.Item
              key={language}
              label={languageNativeNames[language]}
              labelVariant="bodyLarge"
              mode="android"
              position="leading"
              style={styles.item}
              value={language}
            />
          ))}
        </RadioButton.Group>
      </SectionCard>
    </Screen>
  );
});

const useStyles = makeStyles(() => ({
  item: {
    minHeight: sizes.touchTarget + 8,
  },
}));
