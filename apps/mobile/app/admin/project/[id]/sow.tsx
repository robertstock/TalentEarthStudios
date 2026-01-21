import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../../../constants/Constants';
import { WME } from '../../../../constants/theme';

export default function SOWGeneration() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [generating, setGenerating] = useState(true);
    const [step, setStep] = useState(0);
    const [sow, setSow] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedSowText, setEditedSowText] = useState('');
    const hasGenerated = React.useRef(false);

    const STEPS = [
        'Analyzing Project Requirements...',
        'Matching Resources & Rates...',
        'Estimating Timeline...',
        'Drafting Statement of Work...'
    ];

    useEffect(() => {
        if (!id || hasGenerated.current) return;

        hasGenerated.current = true;
        let currentStep = 0;

        const interval = setInterval(() => {
            currentStep++;
            if (currentStep < STEPS.length) {
                setStep(currentStep);
            }
        }, 1200);

        const generateSOW = async () => {
            try {
                const response = await fetch(`${API_URL}/admin/projects/${id}/generate-sow`, {
                    method: 'POST'
                });
                if (!response.ok) throw new Error('Failed to generate SOW');
                const data = await response.json();
                setSow(data);
                setEditedSowText(data.bodyRichText || '');
                setGenerating(false);
                clearInterval(interval);
            } catch (error) {
                console.error('SOW_GEN_ERROR:', error);
                Alert.alert('Error', 'Failed to generate SOW. Please try again.');
                router.back();
            }
        };

        generateSOW();

        return () => clearInterval(interval);
    }, [id]);

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [ccRPM, setCcRPM] = useState(true);
    const [sending, setSending] = useState(false);

    const [teams, setTeams] = useState<any[]>([]);
    const [talent, setTalent] = useState<any[]>([]);
    const [selectedEntity, setSelectedEntity] = useState<any>(null);

    const fetchResources = async () => {
        try {
            const [teamsRes, talentRes] = await Promise.all([
                fetch(`${API_URL}/teams`),
                fetch(`${API_URL}/talent`)
            ]);
            if (teamsRes.ok) setTeams(await teamsRes.json());
            if (talentRes.ok) setTalent(await talentRes.json());
        } catch (error) {
            console.error('FETCH_RESOURCES_ERROR', error);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const handleApprovePress = () => {
        setShowEmailModal(true);
    };

    const handleSendSOW = async () => {
        const email = selectedEntity?.email || recipientEmail;
        if (!email || !email.includes('@')) {
            Alert.alert('Invalid Email', 'Please select a recipient or enter a valid email address.');
            return;
        }

        setSending(true);
        try {
            const response = await fetch(`${API_URL}/admin/projects/${id}/finalize-sow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientEmail: email,
                    ccRPM,
                    teamId: selectedEntity?.members ? selectedEntity.id : undefined,
                    talentId: selectedEntity?.members ? undefined : selectedEntity?.id,
                    bodyRichText: editedSowText !== sow?.bodyRichText ? editedSowText : undefined
                })
            });

            if (!response.ok) throw new Error('Failed to finalize SOW');

            setShowEmailModal(false);
            Alert.alert(
                'SOW Sent',
                `Statement of Work sent to ${email}${ccRPM ? ' and a copy to you' : ''}.`,
                [{ text: 'OK', onPress: () => router.push('/admin/dashboard') }]
            );
        } catch (error) {
            console.error('FINALIZE_ERROR:', error);
            Alert.alert('Error', 'Failed to send SOW.');
        } finally {
            setSending(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView style={{ flex: 1 }}>

                {generating ? (
                    <View style={styles.loadingContainer}>
                        <View style={styles.loaderCircle}>
                            <ActivityIndicator size="large" color={WME.colors.textMuted} />
                        </View>
                        <Text style={styles.stepLabel} allowFontScaling={false}>AI GENERATION</Text>
                        <Text style={styles.loadingText} allowFontScaling={false}>{STEPS[step]}</Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
                        </View>
                    </View>
                ) : (
                    <>
                        {/* Header */}
                        <View style={styles.header}>
                            <Pressable onPress={() => router.back()} style={styles.closeButton}>
                                <Ionicons name="close" size={20} color={WME.colors.text} />
                            </Pressable>
                            <Text style={styles.headerTitle} allowFontScaling={false}>SOW GENERATED</Text>
                            <View style={styles.placeholder} />
                        </View>

                        {/* SOW Content */}
                        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                            <View style={styles.documentCard}>
                                <View style={styles.docHeader}>
                                    <Text style={styles.docLabel} allowFontScaling={false}>STATEMENT OF WORK</Text>
                                    <Text style={styles.docDate} allowFontScaling={false}>{new Date().toLocaleDateString()}</Text>
                                </View>

                                <View style={styles.docSection}>
                                    {isEditing ? (
                                        <TextInput
                                            style={styles.editInput}
                                            value={editedSowText}
                                            onChangeText={setEditedSowText}
                                            multiline
                                            scrollEnabled={false}
                                            autoFocus
                                            allowFontScaling={false}
                                        />
                                    ) : (
                                        <Text style={styles.docText} allowFontScaling={false}>
                                            {editedSowText || 'Generating SOW content...'}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </ScrollView>

                        {/* Footer Actions */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.editButton, isEditing && styles.editButtonActive]}
                                onPress={() => setIsEditing(!isEditing)}
                            >
                                <Text style={[styles.editButtonText, isEditing && { color: 'white' }]} allowFontScaling={false}>
                                    {isEditing ? 'DONE EDITING' : 'EDIT'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.sendButton, isEditing && styles.sendButtonDisabled]}
                                onPress={handleApprovePress}
                                disabled={isEditing}
                            >
                                <Text style={styles.sendButtonText} allowFontScaling={false}>APPROVE & SEND</Text>
                                <Ionicons name="send" size={16} color={WME.colors.base} style={{ marginLeft: 8 }} />
                            </TouchableOpacity>
                        </View>

                        {/* Email Modal */}
                        {showEmailModal && (
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle} allowFontScaling={false}>Send Statement of Work</Text>
                                    <Text style={styles.modalSubtitle} allowFontScaling={false}>
                                        Select a team or talent from the network.
                                    </Text>

                                    <View style={styles.listContainer}>
                                        <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
                                            <Text style={styles.listHeader} allowFontScaling={false}>TEAMS</Text>
                                            {teams.map(t => (
                                                <TouchableOpacity
                                                    key={t.id}
                                                    style={[styles.listItem, selectedEntity?.id === t.id && styles.listItemSelected]}
                                                    onPress={() => {
                                                        setSelectedEntity(t);
                                                        setRecipientEmail(t.email || '');
                                                    }}
                                                >
                                                    <View style={styles.listIcon}>
                                                        <Ionicons name="people" size={16} color={selectedEntity?.id === t.id ? 'white' : WME.colors.textMuted} />
                                                    </View>
                                                    <View>
                                                        <Text style={[styles.listTitle, selectedEntity?.id === t.id && { color: 'white' }]} allowFontScaling={false}>{t.name}</Text>
                                                        <Text style={styles.listSubtitle} allowFontScaling={false}>{t.email}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}

                                            <Text style={[styles.listHeader, { marginTop: 16 }]} allowFontScaling={false}>TALENT</Text>
                                            {talent.map(t => (
                                                <TouchableOpacity
                                                    key={t.id}
                                                    style={[styles.listItem, selectedEntity?.id === t.id && styles.listItemSelected]}
                                                    onPress={() => {
                                                        setSelectedEntity(t);
                                                        setRecipientEmail(t.email || '');
                                                    }}
                                                >
                                                    <View style={styles.listIcon}>
                                                        <Ionicons name="person" size={14} color={selectedEntity?.id === t.id ? 'white' : WME.colors.textMuted} />
                                                    </View>
                                                    <View>
                                                        <Text style={[styles.listTitle, selectedEntity?.id === t.id && { color: 'white' }]} allowFontScaling={false}>{t.name}</Text>
                                                        <Text style={styles.listSubtitle} allowFontScaling={false}>{t.specialty || t.email}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>

                                    {!selectedEntity && (
                                        <View style={styles.inputContainer}>
                                            <Text style={styles.inputLabel} allowFontScaling={false}>CUSTOM EMAIL</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={recipientEmail}
                                                onChangeText={setRecipientEmail}
                                                placeholder="team@example.com"
                                                placeholderTextColor={WME.colors.textDim}
                                                autoCapitalize="none"
                                                keyboardType="email-address"
                                                allowFontScaling={false}
                                            />
                                        </View>
                                    )}

                                    {selectedEntity && (
                                        <TouchableOpacity onPress={() => setSelectedEntity(null)} style={styles.clearSelection}>
                                            <Text style={styles.clearSelectionText} allowFontScaling={false}>Clear selection and enter email manually</Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={styles.checkboxRow}
                                        onPress={() => setCcRPM(!ccRPM)}
                                    >
                                        <Ionicons
                                            name={ccRPM ? "checkbox" : "square-outline"}
                                            size={20}
                                            color={ccRPM ? WME.colors.accent : WME.colors.textDim}
                                        />
                                        <Text style={[styles.checkboxLabel, ccRPM && { color: WME.colors.text }]} allowFontScaling={false}>
                                            CC: RPM (You)
                                        </Text>
                                    </TouchableOpacity>

                                    <View style={styles.modalActions}>
                                        <TouchableOpacity
                                            style={styles.modalCancel}
                                            onPress={() => setShowEmailModal(false)}
                                        >
                                            <Text style={styles.modalCancelText} allowFontScaling={false}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.modalSend}
                                            onPress={handleSendSOW}
                                            disabled={sending}
                                        >
                                            {sending ? (
                                                <ActivityIndicator color={WME.colors.base} />
                                            ) : (
                                                <Text style={styles.modalSendText} allowFontScaling={false}>Send Now</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}
                    </>
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WME.colors.base,
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loaderCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: WME.colors.panel,
        borderWidth: 1,
        borderColor: WME.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    stepLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: WME.colors.textDim,
        letterSpacing: 2,
        marginBottom: 8,
    },
    loadingText: {
        color: WME.colors.text,
        fontSize: 16,
        fontWeight: '400',
        marginBottom: 32,
        textAlign: 'center',
    },
    progressBar: {
        width: '100%',
        height: 2,
        backgroundColor: WME.colors.border,
        borderRadius: 1,
    },
    progressFill: {
        height: '100%',
        backgroundColor: WME.colors.text,
        borderRadius: 1,
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
    closeButton: {
        width: 36,
        height: 36,
        backgroundColor: WME.colors.panel,
        borderWidth: 1,
        borderColor: WME.colors.border,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholder: { width: 36 },
    headerTitle: {
        color: WME.colors.textDim,
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 2,
    },

    content: { flex: 1 },
    scrollContent: { padding: 24 },

    documentCard: {
        backgroundColor: WME.colors.panel,
        borderRadius: WME.radius.md,
        padding: 24,
        minHeight: 400,
        borderWidth: 1,
        borderColor: WME.colors.border,
    },
    docHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: WME.colors.border,
    },
    docLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: WME.colors.textDim,
        letterSpacing: 2,
    },
    docDate: {
        color: WME.colors.textMuted,
        fontSize: 12,
        fontFamily: 'monospace',
    },

    docSection: { marginBottom: 24 },
    docText: {
        fontSize: 14,
        lineHeight: 24,
        color: WME.colors.textMuted,
    },

    footer: {
        flexDirection: 'row',
        padding: 24,
        paddingBottom: 30,
        borderTopWidth: 1,
        borderTopColor: WME.colors.border,
        gap: 12,
    },
    editButton: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: WME.colors.panel,
        borderWidth: 1,
        borderColor: WME.colors.border,
        borderRadius: WME.radius.sm,
    },
    editButtonActive: {
        backgroundColor: WME.colors.accent,
        borderColor: WME.colors.accent,
    },
    editButtonText: {
        color: WME.colors.textMuted,
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 2,
    },
    sendButton: {
        flex: 2,
        height: 48,
        borderRadius: WME.radius.sm,
        backgroundColor: WME.colors.text,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.3,
    },
    sendButtonText: {
        color: WME.colors.base,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
    },
    editInput: {
        fontSize: 14,
        lineHeight: 24,
        color: WME.colors.text,
        backgroundColor: WME.colors.base,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: WME.colors.border,
        textAlignVertical: 'top',
        minHeight: 200,
    },

    // Modal Styles
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: WME.colors.panel,
        borderRadius: WME.radius.md,
        padding: 24,
        width: '100%',
        borderWidth: 1,
        borderColor: WME.colors.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: WME.colors.text,
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: WME.colors.textMuted,
        marginBottom: 24,
        lineHeight: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: WME.colors.textDim,
        marginBottom: 8,
        letterSpacing: 1,
    },
    input: {
        backgroundColor: WME.colors.base,
        borderWidth: 1,
        borderColor: WME.colors.border,
        borderRadius: WME.radius.sm,
        padding: 16,
        color: WME.colors.text,
        fontSize: 16,
    },
    listContainer: {
        marginBottom: 20,
        backgroundColor: WME.colors.base,
        borderRadius: WME.radius.sm,
        borderWidth: 1,
        borderColor: WME.colors.border,
        padding: 8,
    },
    listHeader: {
        fontSize: 10,
        fontWeight: '700',
        color: WME.colors.textDim,
        paddingHorizontal: 8,
        paddingVertical: 4,
        letterSpacing: 1,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 4,
    },
    listItemSelected: {
        backgroundColor: WME.colors.accent,
    },
    listIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: WME.colors.panel,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    listTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: WME.colors.text,
    },
    listSubtitle: {
        fontSize: 12,
        color: WME.colors.textMuted,
    },
    clearSelection: {
        padding: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    clearSelectionText: {
        color: WME.colors.textDim,
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
        padding: 4,
    },
    checkboxLabel: {
        color: WME.colors.textMuted,
        fontSize: 14,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancel: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: WME.radius.sm,
        backgroundColor: WME.colors.base,
        borderWidth: 1,
        borderColor: WME.colors.border,
    },
    modalCancelText: {
        color: WME.colors.textMuted,
        fontWeight: '600',
    },
    modalSend: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: WME.radius.sm,
        backgroundColor: WME.colors.accent,
    },
    modalSendText: {
        color: 'white',
        fontWeight: '600',
    }
});
