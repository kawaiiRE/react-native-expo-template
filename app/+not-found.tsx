import { Link } from 'expo-router';
import { Button, Text } from 'react-native-paper';

import AppScreen from '@/components/ui/AppScreen';
import SectionCard from '@/components/ui/SectionCard';

export default function NotFoundScreen() {
  return (
    <AppScreen title="Not Found">
      <SectionCard title="Missing Route">
        <Text>This screen does not exist in the current starter routes.</Text>
        <Link asChild href="/">
          <Button icon="home-outline" mode="contained">
            Dashboard
          </Button>
        </Link>
      </SectionCard>
    </AppScreen>
  );
}
