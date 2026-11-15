import { createContext, useContext, type PropsWithChildren } from 'react';

import type { AppEnvironment } from '@/services/container';

const AppEnvironmentContext = createContext<AppEnvironment | null>(null);

export function AppEnvironmentProvider({
  children,
  environment,
}: PropsWithChildren<{ environment: AppEnvironment }>) {
  return (
    <AppEnvironmentContext.Provider value={environment}>
      {children}
    </AppEnvironmentContext.Provider>
  );
}

function useAppEnvironment() {
  const environment = useContext(AppEnvironmentContext);

  if (!environment) {
    throw new Error(
      'useAppEnvironment must be used inside AppEnvironmentProvider.',
    );
  }

  return environment;
}

export function useSession() {
  return useAppEnvironment().store.session;
}

export function usePreferences() {
  return useAppEnvironment().store.preferences;
}

export function useServices() {
  return useAppEnvironment().services;
}

export function useBackendConfig() {
  return useAppEnvironment().config;
}
