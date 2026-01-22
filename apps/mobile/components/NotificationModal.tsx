import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WME } from '../constants/theme';
import { API_URL } from '../constants/Constants';
import { useRouter } from 'expo-router';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    metadata?: string;
}

interface NotificationModalProps {
    visible: boolean;
    onClose: () => void;
    onMarkAllRead?: () => void;
}

export function NotificationModal({ visible, onClose, onMarkAllRead }: NotificationModalProps) {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Initial Load
    useEffect(() => {
        if (visible) {
            loadNotifications(1, true);
        }
    }, [visible]);

    const loadNotifications = async (pageNum: number, shouldReset = false) => {
        if (loading || (!hasMore && !shouldReset)) return;

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/notifications?page=${pageNum}&limit=20`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load notifications');
            }

            // Backend returns data in { data, meta } format
            const newNotifications = Array.isArray(data.data) ? data.data : [];

            if (shouldReset) {
                setNotifications(newNotifications);
            } else {
                setNotifications(prev => [...prev, ...newNotifications]);
            }

            setHasMore(newNotifications.length >= 20);
            setPage(pageNum);
        } catch (err: any) {
            console.error('NOTIF_LOAD_ERROR DETAILS:', JSON.stringify(err));
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadNotifications(1, true);
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            loadNotifications(page + 1);
        }
    };

    const handleClearAll = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/notifications/clear-all`, {
                method: 'POST'
            });
            if (response.ok) {
                setNotifications([]);
                setHasMore(false);
            }
        } catch (error) {
            console.error('CLEAR_ALL_ERROR', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.filter(n => n.id !== id));

            await fetch(`${API_URL}/notifications/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('DELETE_NOTIF_ERROR', error);
        }
    };

    const markAsRead = async (notification: Notification) => {
        if (notification.isRead) return;

        try {
            // Optimistic update
            setNotifications(prev => prev.map(n =>
                n.id === notification.id ? { ...n, isRead: true } : n
            ));

            await fetch(`${API_URL}/notifications/${notification.id}/read`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('MARK_READ_ERROR', error);
        }
    };

    const handlePress = (notification: Notification) => {
        markAsRead(notification);

        // Handle Deep Linking based on metadata
        if (notification.metadata) {
            try {
                const meta = JSON.parse(notification.metadata);
                if (meta.projectId) {
                    onClose();
                    // Small delay to allow modal to close smoothly
                    setTimeout(() => {
                        router.push(`/admin/project/${meta.projectId}`);
                    }, 300);
                }
            } catch (e) {
                // Invalid JSON, ignore
            }
        }
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <View style={[styles.itemWrapper, !item.isRead && styles.unreadItem]}>
            <TouchableOpacity
                style={styles.item}
                onPress={() => handlePress(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: item.type === 'PROJECT_UPDATE' ? WME.colors.accent : WME.colors.panelAlt }]}>
                    <Ionicons
                        name={item.type === 'PROJECT_UPDATE' ? 'briefcase' : 'notifications'}
                        size={20}
                        color={item.type === 'PROJECT_UPDATE' ? 'white' : WME.colors.textMuted}
                    />
                </View>
                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.title, !item.isRead && styles.unreadText]} numberOfLines={1} allowFontScaling={false}>
                            {item.title}
                        </Text>
                        <Text style={styles.date} allowFontScaling={false}>
                            {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                    <Text style={styles.message} numberOfLines={2} allowFontScaling={false}>
                        {item.message}
                    </Text>
                </View>
                {!item.isRead && <View style={styles.dot} />}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteNotification(item.id)}
            >
                <Ionicons name="trash-outline" size={18} color={WME.colors.textDim} />
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.headerTitle} allowFontScaling={false}>Notifications</Text>
                        {notifications.length > 0 && (
                            <TouchableOpacity onPress={handleClearAll} style={styles.clearAllBtn}>
                                <Text style={styles.clearAllText} allowFontScaling={false}>Clear All</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={WME.colors.text} />
                    </TouchableOpacity>
                </View>

                {error && (
                    <View style={styles.errorBanner}>
                        <Ionicons name="alert-circle" size={20} color="white" />
                        <Text style={styles.errorText} allowFontScaling={false}>{error}</Text>
                        <TouchableOpacity onPress={() => loadNotifications(1, true)}>
                            <Text style={styles.retryText} allowFontScaling={false}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                    ListEmptyComponent={
                        !loading && !error ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="notifications-off-outline" size={48} color={WME.colors.textMuted} />
                                <Text style={styles.emptyText} allowFontScaling={false}>No notifications yet</Text>
                            </View>
                        ) : null
                    }
                    ListFooterComponent={
                        loading && !refreshing ? (
                            <View style={{ padding: 20 }}>
                                <ActivityIndicator color={WME.colors.textMuted} />
                            </View>
                        ) : null
                    }
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WME.colors.base, // Ensure dark mode background
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: WME.colors.border,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: WME.colors.text,
    },
    clearAllBtn: {
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    clearAllText: {
        fontSize: 12,
        color: WME.colors.accent,
        fontWeight: '600',
    },
    closeButton: {
        padding: 4,
    },
    listContent: {
        paddingBottom: 40,
    },
    itemWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: WME.colors.borderLight,
        paddingRight: 12,
    },
    item: {
        flex: 1,
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    unreadItem: {
        backgroundColor: 'rgba(255, 107, 53, 0.05)',
    },
    deleteButton: {
        padding: 10,
        borderRadius: 20,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    contentContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: WME.colors.text,
        flex: 1,
        marginRight: 8,
    },
    unreadText: {
        color: WME.colors.text,
    },
    date: {
        fontSize: 11,
        color: WME.colors.textDim,
    },
    message: {
        fontSize: 14,
        color: WME.colors.textMuted,
        lineHeight: 20,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: WME.colors.accent,
        marginLeft: 8,
    },
    emptyState: {
        padding: 60,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        color: WME.colors.textMuted,
        fontSize: 16,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ef4444',
        padding: 12,
        margin: 16,
        borderRadius: 12,
    },
    errorText: {
        color: 'white',
        fontSize: 13,
        flex: 1,
        marginLeft: 8,
        fontWeight: '500',
    },
    retryText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
        textDecorationLine: 'underline',
        marginLeft: 12,
    },
});
