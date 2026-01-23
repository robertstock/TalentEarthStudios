import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, StatusBar } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../constants/Constants';
import { WME } from '../../constants/theme';

interface Category {
    id: string;
    name: string;
    description: string;
    icon: string;
}

const ICON_MAP: Record<string, string> = {
    'Film Production': 'film',
    'Prop Design / Fabrication': 'hammer',
    'Set Design': 'cube',
    'Audio / Score': 'musical-notes',
    'VFX / Post': 'color-wand',
    'Post Production': 'cut',
};

export default function NewProject() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${API_URL}/categories`);
                if (!response.ok) throw new Error('Failed to fetch categories');
                const data = await response.json();

                const mappedCategories = data.map((cat: any) => ({
                    id: cat.id,
                    name: cat.name,
                    description: cat.description || 'No description available',
                    icon: ICON_MAP[cat.name] || 'folder',
                }));

                setCategories(mappedCategories);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const createProject = async (categoryId: string) => {
        const newId = `proj_${Date.now()}`;
        setTimeout(() => {
            router.push(`/project/${newId}/intake?categoryId=${categoryId}`);
        }, 100);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={20} color={WME.colors.text} />
                    </Pressable>
                    <Text style={styles.headerTitle}>New Project</Text>
                    <View style={styles.placeholderButton} />
                </View>
                <Text style={styles.headerSubtitle}>Select a category for your project</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={WME.colors.textMuted} />
                </View>
            ) : (
                <FlatList
                    data={categories}
                    keyExtractor={item => item.id}
                    renderItem={({ item, index }) => (
                        <Pressable
                            style={({ pressed }) => [
                                styles.card,
                                pressed && styles.cardPressed
                            ]}
                            onPress={() => createProject(item.id)}
                        >
                            <View style={styles.cardIndicator} />
                            <View style={styles.iconContainer}>
                                <Ionicons name={item.icon as any} size={24} color={WME.colors.text} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.title}>{item.name}</Text>
                                <Text style={styles.desc}>{item.description}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={WME.colors.textDim} />
                        </Pressable>
                    )}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: WME.colors.border }} />}
                />
            )}
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
        borderBottomWidth: 1,
        borderBottomColor: WME.colors.border,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: WME.colors.panel,
        borderWidth: 1,
        borderColor: WME.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderButton: {
        width: 36,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: WME.colors.text,
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 13,
        color: WME.colors.textMuted,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 0,
    },
    card: {
        backgroundColor: WME.colors.panel,
        paddingVertical: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardPressed: {
        backgroundColor: WME.colors.hover,
    },
    cardIndicator: {
        width: 3,
        height: 40,
        backgroundColor: WME.colors.border,
        marginRight: 16,
        borderRadius: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: WME.radius.md,
        backgroundColor: WME.colors.panelAlt,
        borderWidth: 1,
        borderColor: WME.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '500',
        color: WME.colors.text,
        marginBottom: 2,
        letterSpacing: -0.3,
    },
    desc: {
        fontSize: 13,
        color: WME.colors.textMuted,
    },
});
