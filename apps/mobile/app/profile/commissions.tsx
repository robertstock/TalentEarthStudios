import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WME } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../../constants/Constants';

export default function CommissionsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalPotential: 0,
        activeCount: 0,
        totalEarned: 0,
        paidCount: 0,
        cancelledCount: 0
    });
    const [activeProjects, setActiveProjects] = useState<any[]>([]);
    const [paidProjects, setPaidProjects] = useState<any[]>([]);
    const [cancelledProjects, setCancelledProjects] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch(`${API_URL}/projects`);
            if (!response.ok) throw new Error('Failed to fetch projects');
            const data = await response.json();

            // Filter projects (In a real app, filter by current user ID)
            // For demo, we use all projects

            let totalComm = 0;
            let totalEarned = 0;
            const active: any[] = [];
            const paid: any[] = [];
            const cancelled: any[] = [];

            data.forEach((p: any) => {
                const isPaid = p.isPaid === true;
                const isCancelled = p.status === 'CLOSED' && !isPaid; // Only count as cancelled if closed and NOT paid

                // Calculate Commission
                const budgetStart = getBudgetBaseValue(p.answers);
                // If paid, use the stored commissionPaid, else calculate potential
                const commission = isPaid && p.commissionPaid !== undefined ? p.commissionPaid : budgetStart * 0.20;

                const projectData = {
                    ...p,
                    commission,
                    budgetLabel: getBudgetLabel(p.answers)
                };

                if (isPaid) {
                    paid.push(projectData);
                    totalEarned += commission;
                } else if (isCancelled) {
                    cancelled.push(projectData);
                } else {
                    active.push(projectData);
                    totalComm += commission;
                }
            });

            setActiveProjects(active);
            setPaidProjects(paid);
            setCancelledProjects(cancelled);
            setStats({
                totalPotential: totalComm,
                activeCount: active.length,
                totalEarned: totalEarned,
                paidCount: paid.length,
                cancelledCount: cancelled.length
            });

        } catch (error) {
            console.error('COMMISSION_FETCH_ERROR:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to extract budget string from answers
    const getBudgetLabel = (answers: any[]) => {
        if (!answers) return 'N/A';
        // Look for answers that contain '$' which usually indicates budget
        const budgetAns = answers.find((a: any) => a.valueText && a.valueText.includes('$'));
        if (!budgetAns) return 'N/A';

        try {
            return JSON.parse(budgetAns.valueText);
        } catch (e) {
            return budgetAns.valueText; // Return raw text if not valid JSON
        }
    };

    // Helper to parse budget val
    const getBudgetBaseValue = (answers: any[]) => {
        const label = getBudgetLabel(answers);
        if (!label || label === 'N/A') return 0;

        let cleanLabel = label;
        // Handle array format if present
        if (Array.isArray(label)) cleanLabel = label[0];
        if (typeof label === 'string' && label.includes('[')) {
            try {
                cleanLabel = JSON.parse(label)[0];
            } catch {
                cleanLabel = label;
            }
        }

        if (typeof cleanLabel !== 'string') return 0;

        // Simple parsing logic based on know seed options
        if (cleanLabel.includes('5k')) return 5000;
        if (cleanLabel.includes('10k')) return 10000;
        if (cleanLabel.includes('25k')) return 25000;

        return 0;
    };

    const formatCurrency = (amount: number) => {
        return '$' + amount.toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={WME.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>Commission Dashboard</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Earnings Card */}
                <LinearGradient
                    colors={['#059669', '#10b981']}
                    style={styles.summaryCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.summaryLabel} allowFontScaling={false}>TOTAL EARNINGS</Text>
                    <Text style={styles.summaryValue} allowFontScaling={false}>{formatCurrency(stats.totalEarned)}</Text>
                    <View style={styles.summaryFooter}>
                        <View style={styles.badge}>
                            <Ionicons name="checkmark-circle" size={12} color="white" />
                            <Text style={styles.badgeText} allowFontScaling={false}>{stats.paidCount} Paid Projects</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Pipeline Card */}
                <LinearGradient
                    colors={[WME.colors.accent, '#1e40af']}
                    style={styles.summaryCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.summaryLabel} allowFontScaling={false}>POTENTIAL PIPELINE</Text>
                    <Text style={styles.summaryValue} allowFontScaling={false}>{formatCurrency(stats.totalPotential)}</Text>
                    <View style={styles.summaryFooter}>
                        <View style={styles.badge}>
                            <Ionicons name="briefcase" size={12} color="white" />
                            <Text style={styles.badgeText} allowFontScaling={false}>{stats.activeCount} Active Jobs</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Paid Projects */}
                {paidProjects.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle} allowFontScaling={false}>COMPLETED & PAID</Text>
                        {paidProjects.map((p) => (
                            <View key={p.id} style={[styles.card, { borderColor: '#10b981' }]}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.projectTitle} allowFontScaling={false}>{p.name}</Text>
                                    <Text style={[styles.commissionValue, { color: '#10b981' }]} allowFontScaling={false}>+{formatCurrency(p.commission)}</Text>
                                </View>
                                <View style={styles.cardFooter}>
                                    <View style={[styles.statusText, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                        <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '600' }} allowFontScaling={false}>PAID {new Date(p.paidAt).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                        <View style={{ height: 24 }} />
                    </>
                )}

                {/* Active Jobs */}
                <Text style={styles.sectionTitle} allowFontScaling={false}>ACTIVE COMMISSIONS</Text>
                {loading ? (
                    <ActivityIndicator color={WME.colors.accent} />
                ) : activeProjects.length === 0 ? (
                    <Text style={styles.emptyText} allowFontScaling={false}>No active jobs.</Text>
                ) : (
                    activeProjects.map((p) => (
                        <View key={p.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.projectTitle} allowFontScaling={false}>{p.name}</Text>
                                <Text style={styles.commissionValue} allowFontScaling={false}>+{formatCurrency(p.commission)}</Text>
                            </View>
                            <Text style={styles.clientName} allowFontScaling={false}>
                                {p.client?.companyName === 'Acme Corp' ? 'TalentEarthStudios Internal' : p.client?.companyName}
                            </Text>
                            <View style={styles.cardFooter}>
                                <Text style={styles.statusText} allowFontScaling={false}>{p.status.replace(/_/g, ' ')}</Text>
                                <Text style={styles.budgetText} allowFontScaling={false}>Budget: {p.budgetLabel}</Text>
                            </View>
                        </View>
                    ))
                )}

                {/* Cancelled Jobs */}
                {cancelledProjects.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { marginTop: 32 }]} allowFontScaling={false}>CANCELLED / CLOSED</Text>
                        {cancelledProjects.map((p) => (
                            <View key={p.id} style={[styles.card, styles.cancelledCard]}>
                                <View style={styles.cardHeader}>
                                    <Text style={[styles.projectTitle, styles.cancelledText]} allowFontScaling={false}>{p.name}</Text>
                                    <Text style={[styles.commissionValue, styles.cancelledText]} allowFontScaling={false}>$0</Text>
                                </View>
                                <Text style={styles.statusText} allowFontScaling={false}>Cancelled</Text>
                            </View>
                        ))}
                    </>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WME.colors.base,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: WME.colors.border,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: WME.colors.panel,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: WME.colors.text,
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    summaryCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 32,
        shadowColor: WME.colors.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
    },
    summaryLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 8,
    },
    summaryValue: {
        color: 'white',
        fontSize: 36,
        fontWeight: '800',
        marginBottom: 16,
    },
    summaryFooter: {
        flexDirection: 'row',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: WME.colors.textDim,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: WME.colors.panel,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: WME.colors.border,
    },
    cancelledCard: {
        opacity: 0.6,
        borderColor: 'transparent',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    projectTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: WME.colors.text,
        flex: 1,
        marginRight: 12,
    },
    commissionValue: {
        fontSize: 16,
        fontWeight: '700',
        color: WME.colors.success,
    },
    clientName: {
        fontSize: 14,
        color: WME.colors.textMuted,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(148, 163, 184, 0.1)',
        paddingTop: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: WME.colors.accent,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
    },
    budgetText: {
        fontSize: 12,
        color: WME.colors.textDim,
    },
    cancelledText: {
        color: WME.colors.textMuted,
        textDecorationLine: 'line-through',
    },
    emptyText: {
        color: WME.colors.textMuted,
        fontStyle: 'italic',
    }
});
