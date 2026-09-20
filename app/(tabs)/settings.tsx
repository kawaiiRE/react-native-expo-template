import { observer } from 'mobx-react-lite';
import { Button, Divider, List } from 'react-native-paper';

import AppScreen from '@/components/ui/AppScreen';
import SectionCard from '@/components/ui/SectionCard';
import { appConfig } from '@/constants/app';
import { useRootStore } from '@/stores/rootStore';

export default observer(function SettingsScreen() {
  const store = useRootStore();

  return (
    <AppScreen
      subtitle="One public gateway URL connects mobile to the full stack."
      title="Settings"
    >
      <SectionCard title="Configuration">
        <List.Item
          description={appConfig.apiBaseUrl || 'Not configured'}
          left={(props) => <List.Icon {...props} icon="api" />}
          title="API base URL"
        />
        <Divider />
        <List.Item
          description="Versioned health contract through /api/health"
          left={(props) => <List.Icon {...props} icon="shield-check-outline" />}
          title="Integration boundary"
        />
      </SectionCard>

      <SectionCard title="Starter Data">
        <Button
          icon="restore"
          mode="contained-tonal"
          onPress={store.resetStarterData}
        >
          Reset sample data
        </Button>
      </SectionCard>
    </AppScreen>
  );
});
