import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ProjectList } from '../../components/ProjectList';
import { API_URL } from '../../constants/Constants';
import { WME } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProjectHistory() {
    const router = useRouter();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/projects`);
            if (!response.ok) throw new Error('Failed to fetch projects');
            const data = await response.json();
            // Filter for PAID projects only
            const historyProjects = data.filter((p: any) => p.isPaid === true);
            setProjects(historyProjects);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not load project history.');
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
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={WME.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>Project History</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Project List */}
            <ProjectList
                projects={projects}
                refreshing={loading}
                onRefresh={fetchHistory}
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
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: WME.colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '500',
        color: WME.colors.text,
        letterSpacing: -0.5,
    },
});
