import { StyleSheet, View } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Button, Chip, Divider, Text } from 'react-native-paper';

import HealthStatusCard from '@/components/health/HealthStatusCard';
import AppScreen from '@/components/ui/AppScreen';
import EmptyState from '@/components/ui/EmptyState';
import SectionCard from '@/components/ui/SectionCard';
import StatCard from '@/components/ui/StatCard';
import { appFonts, appPalette } from '@/constants/theme';
import { useRootStore } from '@/stores/rootStore';
import { formatCount, formatPercent } from '@/utils/format';

const starterTaskTitle = 'Sketch the first production screen';

export default observer(function DashboardScreen() {
  const store = useRootStore();

  function handleAddStarterTask() {
    store.addTask(starterTaskTitle);
  }

  return (
    <AppScreen
      subtitle="A clean Expo client for the Next.js and PocketBase templates."
      title="Launch Board"
    >
      <View style={styles.statsGrid}>
        <StatCard
          icon="format-list-checks"
          label="Open tasks"
          tone="blue"
          value={String(store.activeTaskCount)}
        />
        <StatCard
          icon="check-decagram-outline"
          label="Complete"
          tone="green"
          value={formatPercent(store.completionPercent)}
        />
      </View>

      <SectionCard
        action={<Chip compact>{formatCount(store.tasks.length, 'item')}</Chip>}
        subtitle="Persisted with AsyncStorage and MobX."
        title="Next Up"
      >
        {store.nextTasks.length ? (
          store.nextTasks.map((task, index) => (
            <View key={task.id} style={styles.taskBlock}>
              <View style={styles.taskRow}>
                <Text style={styles.taskNumber}>{index + 1}</Text>
                <Text style={styles.taskTitle}>{task.title}</Text>
              </View>
              {index < store.nextTasks.length - 1 ? <Divider /> : null}
            </View>
          ))
        ) : (
          <EmptyState
            icon="check-circle-outline"
            message="Add a new starter task when the next app idea arrives."
            title="The board is clear"
          />
        )}
      </SectionCard>

      <HealthStatusCard />

      <SectionCard
        subtitle="MobX is used only for shared task state."
        title="Starter action"
      >
        <View style={styles.actions}>
          <Button icon="plus" mode="contained" onPress={handleAddStarterTask}>
            Add task
          </Button>
        </View>
      </SectionCard>
    </AppScreen>
  );
});

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  taskBlock: {
    gap: 10,
  },
  taskNumber: {
    backgroundColor: appPalette.cobaltSoft,
    borderRadius: 8,
    color: appPalette.cobalt,
    fontFamily: appFonts.extraBold,
    fontSize: 14,
    lineHeight: 26,
    minWidth: 28,
    overflow: 'hidden',
    textAlign: 'center',
  },
  taskRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  taskTitle: {
    color: appPalette.ink,
    flex: 1,
    fontFamily: appFonts.semiBold,
    fontSize: 15,
    lineHeight: 21,
  },
});
