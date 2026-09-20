import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { observer } from 'mobx-react-lite';
import {
  Button,
  Checkbox,
  Divider,
  IconButton,
  Text,
  TextInput,
} from 'react-native-paper';

import AppScreen from '@/components/ui/AppScreen';
import EmptyState from '@/components/ui/EmptyState';
import SectionCard from '@/components/ui/SectionCard';
import { appFonts, appPalette } from '@/constants/theme';
import { useRootStore } from '@/stores/rootStore';

export default observer(function TasksScreen() {
  const store = useRootStore();
  const [title, setTitle] = useState('');

  function handleAddTask() {
    store.addTask(title);
    setTitle('');
  }

  return (
    <AppScreen
      subtitle="Use this persisted sample as the first store and UI pattern."
      title="Tasks"
    >
      <SectionCard title="Add Item">
        <TextInput
          label="Task title"
          mode="outlined"
          onChangeText={setTitle}
          onSubmitEditing={handleAddTask}
          returnKeyType="done"
          value={title}
        />
        <Button
          disabled={!title.trim()}
          icon="plus"
          mode="contained"
          onPress={handleAddTask}
        >
          Add item
        </Button>
      </SectionCard>

      <SectionCard title="Launch List">
        {store.tasks.length ? (
          store.tasks.map((task, index) => {
            const isDone = task.status === 'done';

            return (
              <View key={task.id} style={styles.taskBlock}>
                <View style={styles.taskRow}>
                  <Checkbox.Android
                    status={isDone ? 'checked' : 'unchecked'}
                    onPress={() => store.toggleTask(task.id)}
                  />
                  <Text
                    style={[
                      styles.taskTitle,
                      isDone ? styles.taskTitleDone : null,
                    ]}
                  >
                    {task.title}
                  </Text>
                  <IconButton
                    accessibilityLabel="Remove task"
                    icon="trash-can-outline"
                    onPress={() => store.removeTask(task.id)}
                  />
                </View>
                {index < store.tasks.length - 1 ? <Divider /> : null}
              </View>
            );
          })
        ) : (
          <EmptyState
            icon="playlist-plus"
            message="Add the first task for the next app build."
            title="No tasks yet"
          />
        )}
      </SectionCard>
    </AppScreen>
  );
});

const styles = StyleSheet.create({
  taskBlock: {
    gap: 6,
  },
  taskRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    minHeight: 54,
  },
  taskTitle: {
    color: appPalette.ink,
    flex: 1,
    fontFamily: appFonts.semiBold,
    fontSize: 15,
    lineHeight: 21,
  },
  taskTitleDone: {
    color: appPalette.inkMuted,
    textDecorationLine: 'line-through',
  },
});
