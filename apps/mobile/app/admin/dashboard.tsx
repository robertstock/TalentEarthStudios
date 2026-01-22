import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../constants/Constants';
import { WME } from '../../constants/theme';
import { useFocusEffect } from '@react-navigation/native';

import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withDelay, withTiming, Easing, withRepeat } from 'react-native-reanimated';

// Admin profile photo
const ADMIN_AVATAR = require('../../assets/admin_avatar.png');

import { NotificationModal } from '../../components/NotificationModal';

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<any[]>([]);
    const [stats, setStats] = useState<any[]>([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const previousProjectsRef = React.useRef<any[]>([]);

    // Animation values
    const bellScale = useSharedValue(1);
    const rippleOpacity = useSharedValue(0);
    const rippleScale = useSharedValue(1);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => router.replace('/')
                }
            ]
        );
    };

    const triggerNotification = () => {
        // Bell shake
        bellScale.value = withSequence(
            withSpring(1.2),
            withSpring(1)
        );

        // Ripple effect
        rippleScale.value = 1;
        rippleOpacity.value = 0.8;

        rippleScale.value = withTiming(2.5, { duration: 1000, easing: Easing.out(Easing.ease) });
        rippleOpacity.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.ease) }, () => {
            rippleScale.value = 1; // Reset
        });
    };

    const checkForUpdates = (newData: any[]) => {
        const prev = previousProjectsRef.current;
        if (prev.length === 0) return; // First load, don't notify

        // Check for new projects or status changes
        const isDifferent = newData.length !== prev.length ||
            newData.some((p, i) => prev[i]?.id === p.id && prev[i]?.status !== p.status);

        if (isDifferent) {
            setNotificationCount(prevCount => prevCount + 1);
            triggerNotification();
        }
    };

    const fetchNotificationsCount = async () => {
        try {
            const response = await fetch(`${API_URL}/notifications?limit=1`);
            if (response.ok) {
                const data = await response.json();
                const newCount = data.meta.unread;
                if (newCount > notificationCount) {
                    triggerNotification();
                }
                setNotificationCount(newCount);
            }
        } catch (error) {
            console.error('NOTIF_FETCH_ERROR', error);
        }
    };

    const fetchData = async (isPolling = false) => {
        if (!isPolling) setLoading(true);
        try {
            const response = await fetch(`${API_URL}/admin/projects`);
            if (!response.ok) throw new Error('Failed to fetch admin projects');
            const data = await response.json();

            // Sort to ensure consistent comparison (newest first is usually best)
            // Assuming API returns sorted or we sort here if needed, but array order matters for simple comparison

            if (isPolling) {
                // Keep checking for project updates for diffing, but also sync count
                checkForUpdates(data);
                await fetchNotificationsCount();
            } else {
                fetchNotificationsCount(); // Non-blocking
            }

            setProjects(data);
            previousProjectsRef.current = data;

            const pendingReview = data.filter((p: any) => p.status === 'SUBMITTED' || p.status === 'SENT').length;
            const sowDrafts = data.filter((p: any) => p.status === 'SOW_DRAFT').length;
            const active = data.filter((p: any) => ['APPROVED_FOR_SOW', 'SOW_SENT_TO_CLIENT', 'CLIENT_APPROVED', 'IN_PRODUCTION'].includes(p.status)).length;

            setStats([
                { label: 'Pending Review', value: String(pendingReview), icon: 'time', color: [WME.colors.warning, '#d97706'] },
                { label: 'SOW Drafts', value: String(sowDrafts), icon: 'document-text', color: [WME.colors.accent, '#2563eb'] },
                { label: 'Active Projects', value: String(active), icon: 'briefcase', color: [WME.colors.success, '#059669'] },
            ]);
        } catch (error) {
            console.error('DASHBOARD_FETCH_ERROR:', error);
        } finally {
            if (!isPolling) setLoading(false);
        }
    };

    // Initial Load
    useFocusEffect(
        React.useCallback(() => {
            fetchData();

            // Polling Interval
            const interval = setInterval(() => {
                fetchData(true);
            }, 5000); // 5 seconds

            return () => clearInterval(interval);
        }, [])
    );

    const pendingProjects = projects.filter(p => p.status === 'SUBMITTED' || p.status === 'SENT');
    const recentActivity = projects.filter(p => p.status !== 'SUBMITTED' && p.status !== 'SENT');

    const animatedBellStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: bellScale.value }]
        };
    });

    const rippleStyle = useAnimatedStyle(() => {
        return {
            opacity: rippleOpacity.value,
            transform: [{ scale: rippleScale.value }]
        };
    });

    return (
        <View style={styles.container}>
            <View style={styles.background} />
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle="light-content" />

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting} allowFontScaling={false}>Good Morning,</Text>
                        <Text style={styles.adminName} allowFontScaling={false}>Admin User</Text>
                    </View>
                    <View style={styles.headerRight}>

                        {/* Notification Bell with Ripple */}
                        <TouchableOpacity
                            style={styles.notificationWrapper}
                            onPress={() => setShowNotifications(true)}
                        >
                            <Animated.View style={[styles.rippleRing, rippleStyle]} />
                            <Animated.View style={[styles.iconButton, animatedBellStyle]}>
                                <Ionicons name="notifications-outline" size={22} color={WME.colors.text} />
                                {notificationCount > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText} allowFontScaling={false}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
                                    </View>
                                )}
                            </Animated.View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={22} color={WME.colors.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.profileButton}>
                            <Image
                                source={ADMIN_AVATAR}
                                style={styles.avatar}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        {stats.map((stat, index) => (
                            <View key={index} style={styles.statCard}>
                                <View style={[styles.statIcon, { backgroundColor: stat.color[0] }]}>
                                    <Ionicons name={stat.icon as any} size={20} color="white" />
                                </View>
                                <Text style={styles.statValue} allowFontScaling={false}>{stat.value}</Text>
                                <Text style={styles.statLabel} allowFontScaling={false}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Pending Actions Section */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle} allowFontScaling={false}>Requires Attention</Text>
                    </View>

                    {pendingProjects.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText} allowFontScaling={false}>No pending items</Text>
                        </View>
                    ) : (
                        pendingProjects.map((project) => (
                            <View key={project.id} style={styles.actionCard}>
                                <TouchableOpacity
                                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                    onPress={() => router.push(`/admin/project/${project.id}`)}
                                >
                                    <View style={styles.cardLeft}>
                                        <View style={styles.indicator} />
                                        <View>
                                            <Text style={styles.cardTitle} allowFontScaling={false} numberOfLines={1}>{project.title || project.name}</Text>
                                            <Text style={styles.cardSubtitle} allowFontScaling={false}>{(project.client?.companyName === 'Acme Corp' ? 'WME+ Internal' : project.client?.companyName) || 'Unknown Client'}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.cardRight}>
                                    <Text style={styles.timeText} allowFontScaling={false}>{new Date(project.updatedAt).toLocaleDateString()}</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            Alert.alert(
                                                "Delete Project",
                                                "Are you sure you want to delete this project?",
                                                [
                                                    { text: "Cancel", style: "cancel" },
                                                    {
                                                        text: "Delete",
                                                        style: "destructive",
                                                        onPress: async () => {
                                                            try {
                                                                await fetch(`${API_URL}/admin/projects/${project.id}`, { method: 'DELETE' });
                                                                fetchData();
                                                            } catch (e) {
                                                                Alert.alert("Error", "Failed to delete project");
                                                            }
                                                        }
                                                    }
                                                ]
                                            );
                                        }}
                                        style={{ padding: 8 }}
                                    >
                                        <Ionicons name="trash-outline" size={18} color={WME.colors.textSubtle} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}

                    {/* Recent Activity Section */}
                    <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                        <Text style={styles.sectionTitle} allowFontScaling={false}>Recent Activity</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewAll} allowFontScaling={false}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {recentActivity.map((project) => (
                        <TouchableOpacity
                            key={project.id}
                            style={styles.projectRow}
                            onPress={() => router.push(`/admin/project/${project.id}`)}
                        >
                            <View style={styles.rowLeft}>
                                <View style={[
                                    styles.statusDot,
                                    { backgroundColor: project.status.includes('SOW') ? WME.colors.accent : WME.colors.success }
                                ]} />
                                <View style={{ flex: 1, paddingRight: 8 }}>
                                    <Text style={styles.rowTitle} allowFontScaling={false} numberOfLines={1}>{project.title || project.name}</Text>
                                    <Text style={styles.rowSubtitle} allowFontScaling={false}>{(project.client?.companyName === 'Acme Corp' ? 'WME+ Internal' : project.client?.companyName) || 'Unknown Client'}</Text>
                                </View>
                            </View>
                            <View style={styles.rowRight}>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: project.status.includes('SOW') ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)' }
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        { color: project.status.includes('SOW') ? WME.colors.accent : WME.colors.success }
                                    ]} allowFontScaling={false}>{project.status.replace(/_/g, ' ')}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}

                </ScrollView>
                <NotificationModal
                    visible={showNotifications}
                    onClose={() => {
                        setShowNotifications(false);
                        fetchNotificationsCount(); // Refresh count on close
                    }}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WME.colors.base,
    },
    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: WME.colors.base,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 20,
    },
    greeting: {
        fontSize: 13,
        color: WME.colors.textMuted,
        fontWeight: '500'
    },
    adminName: {
        fontSize: 20,
        color: WME.colors.text,
        fontWeight: '800'
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    notificationWrapper: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rippleRing: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: WME.colors.accent,
        zIndex: -1,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: WME.colors.panel,
        borderWidth: 1,
        borderColor: WME.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: WME.colors.panel,
        borderWidth: 1,
        borderColor: WME.colors.border,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: WME.colors.accent,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: WME.colors.base,
    },
    badgeText: {
        color: 'white',
        fontSize: 9,
        fontWeight: '800',
    },
    profileButton: {
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: WME.colors.border
    },
    content: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },

    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32
    },
    statCard: {
        flex: 1,
        backgroundColor: WME.colors.panel,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 6,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: WME.colors.border,
    },
    statIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: WME.colors.text,
        marginBottom: 4
    },
    statLabel: {
        fontSize: 10,
        color: WME.colors.textMuted,
        fontWeight: '600',
        textAlign: 'center'
    },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: WME.colors.text
    },
    viewAll: {
        fontSize: 14,
        color: WME.colors.accent,
        fontWeight: '600'
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: WME.colors.panelAlt,
        borderRadius: 16,
    },
    emptyStateText: {
        color: WME.colors.textMuted,
        fontSize: 14
    },

    actionCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: WME.colors.panel,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: WME.colors.warning,
        borderWidth: 1,
        borderColor: WME.colors.border, // Added border for visibility
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    indicator: { width: 0 },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: WME.colors.text,
        marginBottom: 4
    },
    cardSubtitle: {
        fontSize: 14,
        color: WME.colors.textMuted
    },
    cardRight: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    timeText: {
        fontSize: 12,
        color: WME.colors.textSubtle,
        marginRight: 8
    },

    projectRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: WME.colors.panel,
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: WME.colors.border,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12
    },
    rowTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: WME.colors.text,
        marginBottom: 2
    },
    rowSubtitle: {
        fontSize: 13,
        color: WME.colors.textMuted
    },
    rowRight: {},
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700'
    },
});
