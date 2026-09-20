import AsyncStorage from '@react-native-async-storage/async-storage';

export async function readJson(key: string): Promise<unknown> {
  try {
    const rawValue = await AsyncStorage.getItem(key);

    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as unknown;
  } catch {
    return null;
  }
}

export async function writeJson<T>(key: string, value: T) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}
