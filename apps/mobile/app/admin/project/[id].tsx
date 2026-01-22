import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Pressable, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../../constants/Constants';
import { WME } from '../../../constants/theme';

export default function AdminProjectReview() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [changeMessage, setChangeMessage] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');

    const fetchProject = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/admin/projects/${id}`);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.details || errData.message || 'Failed to fetch project');
            }
            const data = await response.json();
            setProject(data);
        } catch (error: any) {
            console.error('PROJECT_FETCH_ERROR:', error);
            Alert.alert('Error', error.message || 'Failed to load project details');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (id) fetchProject();
    }, [id]);

    const handleApprove = async () => {
        setSubmitting(true);
        try {
            const response = await fetch(`${API_URL}/admin/projects/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ decision: 'APPROVED', comments: 'Approved by Admin' }),
            });

            if (!response.ok) throw new Error('Failed to submit review');
            router.push(`/admin/project/${id}/sow`);
        } catch (error) {
            console.error('ACTION_ERROR:', error);
            Alert.alert('Error', 'Failed to approve project');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestChanges = () => {
        setChangeMessage('');
        setShowMessageModal(true);
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Project',
            'Are you sure you want to delete this project? This will permanently remove all data including recordings, transcripts, and SOWs.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setSubmitting(true);
                        try {
                            const response = await fetch(`${API_URL}/admin/projects/${id}`, {
                                method: 'DELETE',
                            });

                            if (!response.ok) {
                                // Fallback to standard project delete if admin specific one doesn't exist
                                const fallbackResponse = await fetch(`${API_URL}/projects/${id}`, {
                                    method: 'DELETE',
                                });
                                if (!fallbackResponse.ok) throw new Error('Failed to delete project');
                            }

                            Alert.alert('Success', 'Project deleted successfully', [
                                { text: 'OK', onPress: () => router.push('/admin/dashboard') }
                            ]);
                        } catch (error) {
                            console.error('DELETE_ERROR:', error);
                            Alert.alert('Error', 'Failed to delete project');
                            setSubmitting(false);
                        }
                    }
                }
            ]
        );
    };

    const submitChangesRequest = async () => {
        if (!changeMessage.trim()) {
            Alert.alert('Message Required', 'Please enter a message describing the changes needed.');
            return;
        }

        setSubmitting(true);
        setShowMessageModal(false);
        try {
            const response = await fetch(`${API_URL}/admin/projects/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ decision: 'CHANGES_REQUESTED', comments: changeMessage }),
            });

            if (!response.ok) throw new Error('Failed to submit review');
            Alert.alert('Changes Requested', 'The RPM will be notified to update this project.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('ACTION_ERROR:', error);
            Alert.alert('Error', 'Failed to request changes');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={WME.colors.textMuted} />
        </View>
    );

    if (!project) return (
        <View style={styles.loadingContainer}>
            <Text style={{ color: WME.colors.textMuted }} allowFontScaling={false}>Project not found</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={{ flex: 1 }}>

                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => {
                        if (showPaymentModal || showMessageModal) {
                            // Prevent back if modal open - though modals cover mostly
                            setShowPaymentModal(false);
                            setShowMessageModal(false);
                        } else {
                            router.back();
                        }
                    }} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={20} color={WME.colors.text} />
                    </Pressable>
                    <Text style={styles.headerTitle} allowFontScaling={false}>PROJECT REVIEW</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

                    {/* Status Banner */}
                    <View style={styles.statusBanner}>
                        <View style={styles.statusDot} />
                        <View>
                            <Text style={styles.statusLabel} allowFontScaling={false}>STATUS</Text>
                            <Text style={styles.statusValue} allowFontScaling={false}>{project.status.replace(/_/g, ' ')}</Text>
                        </View>
                    </View>

                    {/* Project Info */}
                    <View style={styles.card}>
                        <Text style={styles.cardLabel} allowFontScaling={false}>PROJECT DETAILS</Text>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel} allowFontScaling={false}>Name</Text>
                            <Text style={styles.detailValue} allowFontScaling={false}>{project.title || project.name}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel} allowFontScaling={false}>Client</Text>
                            <Text style={styles.detailValue} allowFontScaling={false}>
                                {project.client?.companyName === 'Acme Corp' ? 'WME+ Internal' : project.client?.companyName}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel} allowFontScaling={false}>Submitted By</Text>
                            <Text style={styles.detailValue} allowFontScaling={false}>{project.createdBy?.name || project.createdBy?.email}</Text>
                        </View>
                        {(() => {
                            const dateAns = project.answers?.find((a: any) =>
                                ['q_Date', 'q5', 'q_date_fallback'].includes(a.questionId) ||
                                (a.valueText && a.valueText.match(/^\d{2}\/\d{2}\/\d{4}$/))
                            );
                            if (dateAns) {
                                return (
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel} allowFontScaling={false}>Target Delivery</Text>
                                        <Text style={[styles.detailValue, { color: WME.colors.warning }]} allowFontScaling={false}>{dateAns.valueText}</Text>
                                    </View>
                                );
                            }
                            return null;
                        })()}
                    </View>

                    {/* Intake Answers */}
                    <View style={styles.card}>
                        <Text style={styles.cardLabel} allowFontScaling={false}>INTAKE RESPONSES</Text>
                        {project.answers?.map((a: any) => {
                            // Fallback for known legacy/orphan questions
                            let prompt = a.question?.prompt;
                            if (!prompt) {
                                if (['q_Date', 'q5', 'q_date_fallback'].includes(a.questionId)) {
                                    prompt = 'Target Delivery Date';
                                } else if (a.valueText.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                                    prompt = 'Date';
                                } else {
                                    prompt = 'Additional Info'; // Generic fallback
                                }
                            }

                            return (
                                <View key={a.id} style={styles.answerItem}>
                                    <Text style={styles.answerPrompt} allowFontScaling={false}>{prompt}</Text>
                                    <Text style={styles.answerValue} allowFontScaling={false}>{a.valueText}</Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* Financials Section */}
                    <View style={styles.card}>
                        <Text style={styles.cardLabel} allowFontScaling={false}>FINANCIALS</Text>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel} allowFontScaling={false}>Payment Status</Text>
                            <View style={[styles.statusBadge, { backgroundColor: project.isPaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                                <Text style={[styles.statusText, { color: project.isPaid ? '#10b981' : '#ef4444' }]} allowFontScaling={false}>
                                    {project.isPaid ? 'PAID' : 'UNPAID'}
                                </Text>
                            </View>
                        </View>

                        {project.isPaid ? (
                            <>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel} allowFontScaling={false}>Paid Date</Text>
                                    <Text style={styles.detailValue} allowFontScaling={false}>
                                        {new Date(project.paidAt).toLocaleDateString()}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel} allowFontScaling={false}>RPM Commission</Text>
                                    <Text style={[styles.detailValue, { color: '#10b981' }]} allowFontScaling={false}>
                                        ${project.commissionPaid?.toLocaleString()}
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <TouchableOpacity
                                style={styles.payButton}
                                onPress={() => {
                                    setPaymentAmount(''); // Reset
                                    setShowPaymentModal(true);
                                }}
                                disabled={submitting}
                            >
                                <Ionicons name="checkmark-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />
                                <Text style={styles.payButtonText} allowFontScaling={false}>Mark Complete & Paid</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Admin Actions */}
                    <View style={styles.actionSection}>
                        <Text style={styles.actionLabel} allowFontScaling={false}>REVIEW DECISION</Text>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.rejectButton, submitting && styles.buttonDisabled]}
                                onPress={handleRequestChanges}
                                disabled={submitting}
                            >
                                <Text style={styles.rejectText} allowFontScaling={false}>Request Changes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.approveButton, submitting && styles.buttonDisabled]}
                                onPress={handleApprove}
                                disabled={submitting}
                            >
                                <Text style={styles.approveText} allowFontScaling={false}>Approve</Text>
                            </TouchableOpacity>
                        </View>

                        {project.status === 'APPROVED_FOR_SOW' && (
                            <TouchableOpacity
                                style={styles.aiButton}
                                onPress={() => router.push(`/admin/project/${id}/sow`)}
                            >
                                <Ionicons name="sparkles" size={18} color={WME.colors.text} style={{ marginRight: 8 }} />
                                <Text style={styles.aiButtonText} allowFontScaling={false}>GENERATE SOW (AI)</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={handleDelete}
                            disabled={submitting}
                        >
                            <Text style={styles.deleteButtonText} allowFontScaling={false}>Delete Project</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </SafeAreaView>

            {/* Change Request Message Modal */}
            <Modal
                visible={showMessageModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowMessageModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle} allowFontScaling={false}>Request Changes</Text>
                            <Pressable onPress={() => setShowMessageModal(false)}>
                                <Ionicons name="close" size={24} color={WME.colors.textMuted} />
                            </Pressable>
                        </View>

                        <Text style={styles.modalLabel} allowFontScaling={false}>MESSAGE TO RPM</Text>
                        <TextInput
                            style={styles.messageInput}
                            placeholder="Describe the changes needed..."
                            placeholderTextColor={WME.colors.textDim}
                            value={changeMessage}
                            onChangeText={setChangeMessage}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            allowFontScaling={false}
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, submitting && styles.buttonDisabled]}
                            onPress={submitChangesRequest}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color={WME.colors.base} />
                            ) : (
                                <Text style={styles.submitButtonText} allowFontScaling={false}>Send to RPM</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Payment Modal */}
            <Modal
                visible={showPaymentModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowPaymentModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle} allowFontScaling={false}>Confirm Payment</Text>
                            <Pressable onPress={() => setShowPaymentModal(false)}>
                                <Ionicons name="close" size={24} color={WME.colors.textMuted} />
                            </Pressable>
                        </View>

                        <Text style={styles.modalLabel} allowFontScaling={false}>FINAL PROJECT AMOUNT ($)</Text>
                        <TextInput
                            style={[styles.messageInput, { minHeight: 60, fontSize: 24, fontWeight: '700' }]}
                            placeholder="0.00"
                            placeholderTextColor={WME.colors.textDim}
                            value={paymentAmount}
                            onChangeText={setPaymentAmount}
                            keyboardType="numeric"
                            allowFontScaling={false}
                        />

                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ color: WME.colors.textMuted, fontSize: 13 }} allowFontScaling={false}>
                                RPM Commission (20%): <Text style={{ color: WME.colors.success, fontWeight: '700' }} allowFontScaling={false}>
                                    {(() => {
                                        const clean = paymentAmount.replace(/[^0-9.]/g, '');
                                        const val = parseFloat(clean);
                                        return !isNaN(val) ? '$' + (val * 0.20).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '$0.00';
                                    })()}
                                </Text>
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: '#10b981' }, submitting && styles.buttonDisabled]}
                            onPress={async () => {
                                // Sanitize input: remove all non-numeric bits except dot
                                const cleanAmount = paymentAmount.replace(/[^0-9.]/g, '');
                                const numericAmount = parseFloat(cleanAmount);

                                if (!cleanAmount || isNaN(numericAmount) || numericAmount <= 0) {
                                    Alert.alert('Invalid Amount', 'Please enter a valid positive number.');
                                    return;
                                }

                                setSubmitting(true);
                                try {
                                    const response = await fetch(`${API_URL}/projects/${id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            isPaid: true,
                                            finalRevenue: numericAmount
                                        }),
                                    });

                                    if (!response.ok) throw new Error('Failed to mark paid');
                                    setShowPaymentModal(false);
                                    Alert.alert('Success', 'Project updated and commission released.');
                                    fetchProject(); // Refresh
                                } catch (error) {
                                    console.error('PAY_ERROR:', error);
                                    Alert.alert('Error', 'Failed to update payment status');
                                } finally {
                                    setSubmitting(false);
                                }
                            }}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitButtonText} allowFontScaling={false}>Confirm & Pay Commission</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WME.colors.base,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: WME.colors.base,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: WME.colors.border,
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
    placeholder: { width: 36 },
    headerTitle: {
        fontSize: 12,
        fontWeight: '500',
        color: WME.colors.textDim,
        letterSpacing: 2,
    },
    content: { flex: 1 },
    scrollContent: { padding: 24, paddingBottom: 40 },

    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: WME.colors.panel,
        padding: 16,
        borderRadius: WME.radius.md,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: WME.colors.border,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: WME.colors.warning,
        marginRight: 16,
    },
    statusLabel: {
        fontSize: 10,
        color: WME.colors.textDim,
        fontWeight: '500',
        letterSpacing: 1,
    },
    statusValue: {
        fontSize: 14,
        color: WME.colors.text,
        fontWeight: '500',
    },

    card: {
        backgroundColor: WME.colors.panel,
        borderRadius: WME.radius.md,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: WME.colors.border,
    },
    cardLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: WME.colors.textDim,
        letterSpacing: 2,
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: WME.colors.border,
        paddingBottom: 12,
    },
    detailLabel: {
        color: WME.colors.textMuted,
        fontSize: 14,
    },
    detailValue: {
        color: WME.colors.text,
        fontSize: 14,
        fontWeight: '500',
    },

    answerItem: {
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: WME.colors.border,
    },
    answerPrompt: {
        fontSize: 10,
        color: WME.colors.textDim,
        fontWeight: '500',
        marginBottom: 4,
        letterSpacing: 1,
    },
    answerValue: {
        fontSize: 15,
        color: WME.colors.text,
        lineHeight: 22,
    },

    actionSection: { marginTop: 10 },
    actionLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: WME.colors.textDim,
        marginBottom: 12,
        letterSpacing: 2,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    rejectButton: {
        flex: 1,
        height: 48,
        borderRadius: WME.radius.sm,
        borderWidth: 1,
        borderColor: WME.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: WME.colors.panel,
    },
    rejectText: {
        color: WME.colors.textMuted,
        fontWeight: '500',
        fontSize: 12,
        letterSpacing: 1,
    },
    approveButton: {
        flex: 1,
        height: 48,
        borderRadius: WME.radius.sm,
        backgroundColor: WME.colors.text,
        justifyContent: 'center',
        alignItems: 'center',
    },
    approveText: {
        color: WME.colors.base,
        fontWeight: '600',
        fontSize: 12,
        letterSpacing: 1,
    },
    buttonDisabled: { opacity: 0.5 },

    aiButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 56,
        borderRadius: WME.radius.sm,
        backgroundColor: WME.colors.panel,
        borderWidth: 1,
        borderColor: WME.colors.borderLight,
        marginTop: 20,
    },
    aiButtonText: {
        color: WME.colors.text,
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 2,
    },

    // Modal styles
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: WME.colors.panel,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: WME.colors.text,
    },
    modalLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: WME.colors.textDim,
        letterSpacing: 2,
        marginBottom: 8,
    },
    messageInput: {
        backgroundColor: WME.colors.base,
        borderRadius: WME.radius.md,
        borderWidth: 1,
        borderColor: WME.colors.border,
        padding: 16,
        fontSize: 15,
        color: WME.colors.text,
        minHeight: 120,
        marginBottom: 20,
    },
    submitButton: {
        height: 52,
        borderRadius: WME.radius.sm,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        letterSpacing: 1,
    },
    deleteButton: {
        marginTop: 24,
        padding: 16,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: WME.colors.error || '#ef4444',
        fontSize: 14,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    payButton: {
        flexDirection: 'row',
        backgroundColor: '#10b981',
        padding: 16,
        borderRadius: WME.radius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    payButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
        letterSpacing: 0.5,
    },
});
