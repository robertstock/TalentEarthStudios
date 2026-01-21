import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

export default function ReviewSend() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [sending, setSending] = useState(false);

    const handleSend = () => {
        setSending(true);
        setTimeout(() => {
            setSending(false);
            Alert.alert(
                'Sent Successfully',
                'The SOW has been sent to the client.',
                [{ text: 'Return to Dashboard', onPress: () => router.push('/admin/dashboard') }]
            );
        }, 1500);
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.background} />
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView style={{ flex: 1 }}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} allowFontScaling={false}>Review & Send</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

                    <View style={styles.emailCard}>
                        <View style={styles.fieldRow}>
                            <Text style={styles.label} allowFontScaling={false}>To:</Text>
                            <View style={styles.recipientBadge}>
                                <Text style={styles.recipientText} allowFontScaling={false}>Acme Corp (Client)</Text>
                            </View>
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.label} allowFontScaling={false}>Subject:</Text>
                            <Text style={styles.subjectText} allowFontScaling={false}>Statement of Work: Q4 Marketing Blitz</Text>
                        </View>
                        <View style={styles.divider} />

                        <View style={styles.messageBody}>
                            <Text style={styles.greeting} allowFontScaling={false}>Hi Sarah,</Text>
                            <Text style={styles.bodyText} allowFontScaling={false}>
                                Please find attached the Statement of Work for the upcoming Q4 Marketing Blitz project.
                                {"\n"}{"\n"}
                                We have outlined the deliverables, timeline, and budget based on our recent discussion.
                                {"\n"}{"\n"}
                                Best regards,{"\n"}
                                Finley Pro Team
                            </Text>
                        </View>

                        <View style={styles.attachment}>
                            <View style={styles.pdfIcon}>
                                <Ionicons name="document-text" size={24} color="#ef4444" />
                            </View>
                            <View>
                                <Text style={styles.filename} allowFontScaling={false}>SOW_Q4_Marketing.pdf</Text>
                                <Text style={styles.filesize} allowFontScaling={false}>1.2 MB</Text>
                            </View>
                        </View>
                    </View>

                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.sendButton}
                        onPress={handleSend}
                        disabled={sending}
                    >
                        <LinearGradient
                            colors={['#3b82f6', '#2563eb']}
                            style={styles.sendGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.sendButtonText} allowFontScaling={false}>{sending ? 'Sending...' : 'Send Proposal'}</Text>
                            <Ionicons name="paper-plane" size={20} color="white" style={{ marginLeft: 8 }} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: 'white' },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
    content: { flex: 1 },
    scrollContent: { padding: 20 },

    emailCard: { backgroundColor: 'white', borderRadius: 16, padding: 24, shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    fieldRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    label: { width: 60, fontSize: 14, color: '#94a3b8', fontWeight: '600' },
    recipientBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, borderWidth: 1, borderColor: '#bfdbfe' },
    recipientText: { color: '#2563eb', fontSize: 14, fontWeight: '500' },
    subjectText: { color: '#0f172a', fontSize: 14, fontWeight: '500', flex: 1 },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 20 },

    messageBody: { marginBottom: 24 },
    greeting: { fontSize: 16, color: '#1e293b', marginBottom: 12 },
    bodyText: { fontSize: 16, lineHeight: 24, color: '#334155' },

    attachment: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    pdfIcon: { width: 40, height: 40, backgroundColor: '#fef2f2', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    filename: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
    filesize: { fontSize: 12, color: '#64748b' },

    footer: { padding: 20, paddingBottom: 30, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    sendButton: { shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    sendGradient: { height: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    sendButtonText: { color: 'white', fontSize: 18, fontWeight: '700' },
});
