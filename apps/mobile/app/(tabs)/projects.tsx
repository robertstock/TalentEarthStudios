import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, StatusBar, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ProjectList } from '../../components/ProjectList';
import { NotificationModal } from '../../components/NotificationModal';
import { API_URL } from '../../constants/Constants';
import { WME } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/projects`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      // Filter out PAID projects
      const activeProjects = data.filter((p: any) => !p.isPaid);
      setProjects(activeProjects);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not load projects. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Image
            source={require('../../assets/images/talent_earth_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle} allowFontScaling={false}>RPM Projects</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.statusDot} />
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/project/history')}>
            <Ionicons name="time-outline" size={20} color={WME.colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => setNotifVisible(true)}>
            <Ionicons name="notifications-outline" size={20} color={WME.colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>


      {/* Project List */}
      <ProjectList
        projects={projects}
        refreshing={loading}
        onRefresh={fetchProjects}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/project/new')}
      >
        <Ionicons name="add" size={28} color={WME.colors.text} />
      </TouchableOpacity>

      <NotificationModal
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WME.colors.base,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: WME.colors.border,
  },
  logo: {
    width: 100,
    height: 32,
    marginBottom: 8,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: WME.colors.text,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: WME.colors.success,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WME.colors.panel,
    borderWidth: 1,
    borderColor: WME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: WME.colors.panel,
    borderWidth: 1,
    borderColor: WME.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
