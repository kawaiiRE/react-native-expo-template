import { StyleSheet, View } from 'react-native';
import { Button, ProgressBar, Text } from 'react-native-paper';

import SectionCard from '@/components/ui/SectionCard';
import { HEALTH_PATH } from '@/contracts/health';
import { appFonts, appPalette } from '@/constants/theme';
import { useHealthStatus } from '@/hooks/useHealthStatus';

export default function HealthStatusCard() {
  const { refresh, status } = useHealthStatus();
  const isAvailable = status.state === 'available';

  return (
    <SectionCard
      subtitle="Mobile → Next.js gateway → private PocketBase service"
      title="Full-stack connection"
    >
      {status.state === 'loading' ? <ProgressBar indeterminate /> : null}

      <View style={styles.statusRow}>
        <View
          accessibilityLabel={isAvailable ? 'Connected' : 'Not connected'}
          style={[
            styles.indicator,
            isAvailable ? styles.indicatorAvailable : null,
          ]}
        />
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>
            {status.state === 'loading'
              ? 'Checking the gateway'
              : isAvailable
                ? 'Stack connected'
                : 'Connection unavailable'}
          </Text>
          <Text style={styles.statusMessage}>
            {status.state === 'available'
              ? `${status.data.service} · API v${status.data.apiVersion}`
              : status.state === 'unavailable'
                ? status.message
                : `Validating ${HEALTH_PATH}`}
          </Text>
        </View>
      </View>

      {status.state === 'unavailable' ? (
        <Button icon="refresh" mode="outlined" onPress={() => void refresh()}>
          Retry connection
        </Button>
      ) : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  indicator: {
    backgroundColor: appPalette.coral,
    borderRadius: 8,
    height: 12,
    width: 12,
  },
  indicatorAvailable: {
    backgroundColor: appPalette.emerald,
  },
  statusCopy: {
    flex: 1,
    gap: 2,
  },
  statusMessage: {
    color: appPalette.inkMuted,
    fontFamily: appFonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  statusTitle: {
    color: appPalette.ink,
    fontFamily: appFonts.bold,
    fontSize: 15,
    lineHeight: 20,
  },
});
