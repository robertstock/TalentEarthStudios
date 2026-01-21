import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { WME } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface Project {
    id: string;
    name: string;
    status: string;
    category?: {
        name: string;
    };
    updatedAt: string;
}

interface ProjectListProps {
    projects: Project[];
    refreshing: boolean;
    onRefresh: () => void;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'SUBMITTED': return WME.colors.success;
        case 'APPROVED_FOR_SOW': return WME.colors.accent;
        case 'SOW_DRAFT': return WME.colors.warning;
        case 'NEEDS_RPM_UPDATE': return '#FF6B35'; // Orange - needs attention
        default: return WME.colors.textDim;
    }
};

const needsAttention = (status: string) => status === 'NEEDS_RPM_UPDATE';

const ProjectCard = ({ item, onPress }: { item: Project; onPress: () => void }) => (
    <Pressable
        style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed,
            needsAttention(item.status) && styles.cardAttention
        ]}
        onPress={onPress}
    >
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
        <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                    {needsAttention(item.status) && (
                        <Ionicons name="alert-circle" size={16} color="#FF6B35" style={{ marginRight: 6 }} />
                    )}
                    <Text style={styles.title} allowFontScaling={false}>{item.name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={WME.colors.textDim} />
            </View>
            <Text style={styles.category} allowFontScaling={false}>{item.category?.name || 'Uncategorized'}</Text>
            <View style={styles.cardFooter}>
                <Text style={[
                    styles.statusText,
                    needsAttention(item.status) && styles.statusTextAttention
                ]} allowFontScaling={false}>
                    {needsAttention(item.status) ? '⚠ CHANGES REQUESTED' : item.status.replace(/_/g, ' ')}
                </Text>
                <Text style={styles.date} allowFontScaling={false}>{new Date(item.updatedAt).toLocaleDateString()}</Text>
            </View>
        </View>
    </Pressable>
);

export const ProjectList: React.FC<ProjectListProps> = ({ projects, refreshing, onRefresh }) => {
    const router = useRouter();

    if (projects.length === 0) {
        return (
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.emptyContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WME.colors.textDim} />}
            >
                <View style={styles.empty}>
                    <View style={styles.emptyIcon}>
                        <Ionicons name="folder-open-outline" size={48} color={WME.colors.textDim} />
                    </View>
                    <Text style={styles.emptyTitle} allowFontScaling={false}>No Projects</Text>
                    <Text style={styles.emptyText} allowFontScaling={false}>Start a new project to get started</Text>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WME.colors.textDim} />}
        >
            {projects.map((item, index) => (
                <View key={item.id} style={index > 0 ? styles.cardWrapper : undefined}>
                    <ProjectCard
                        item={item}
                        onPress={() => router.push(`/project/${item.id}/intake`)}
                    />
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardWrapper: {
        marginTop: 8,
    },
    card: {
        backgroundColor: WME.colors.panel,
        borderRadius: WME.radius.md,
        borderWidth: 1,
        borderColor: WME.colors.border,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    cardPressed: {
        backgroundColor: WME.colors.hover,
    },
    statusIndicator: {
        width: 3,
    },
    cardContent: {
        flex: 1,
        padding: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    title: {
        fontSize: 15,
        fontWeight: '500',
        color: WME.colors.text,
        letterSpacing: -0.3,
    },
    category: {
        fontSize: 12,
        color: WME.colors.textMuted,
        marginBottom: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '500',
        color: WME.colors.textDim,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    date: {
        fontSize: 11,
        color: WME.colors.textDim,
        fontFamily: 'monospace',
    },
    empty: {
        padding: 48,
        alignItems: 'center',
    },
    emptyIcon: {
        marginBottom: 16,
        opacity: 0.5,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: WME.colors.text,
        marginBottom: 4,
    },
    emptyText: {
        fontSize: 14,
        color: WME.colors.textMuted,
    },
    cardAttention: {
        borderColor: '#FF6B35',
        borderWidth: 1.5,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusTextAttention: {
        color: '#FF6B35',
        fontWeight: '600',
    },
});
