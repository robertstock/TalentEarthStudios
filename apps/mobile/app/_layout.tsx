import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="project/new" />
        <Stack.Screen name="project/[id]/intake" />
        <Stack.Screen name="admin/dashboard" />
        <Stack.Screen name="admin/project/[id]" />
        <Stack.Screen name="admin/project/[id]/send" />
        <Stack.Screen name="admin/project/[id]/sow" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
