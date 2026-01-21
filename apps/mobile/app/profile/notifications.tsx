import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WME } from '../../constants/theme';

export default function NotificationsScreen() {
    const router = useRouter();
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [smsEnabled, setSmsEnabled] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');

    const toggleSwitch = (type: 'email' | 'sms') => {
        if (type === 'email') setEmailEnabled(prev => !prev);
        if (type === 'sms') setSmsEnabled(prev => !prev);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={WME.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>Notifications</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <Text style={styles.sectionHeader} allowFontScaling={false}>ALERT PREFERENCES</Text>

                <View style={styles.card}>
                    <View style={styles.row}>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowTitle} allowFontScaling={false}>Email Notifications</Text>
                            <Text style={styles.rowSubtitle} allowFontScaling={false}>Receive updates via your registered email.</Text>
                        </View>
                        <Switch
                            trackColor={{ false: '#334155', true: '#3b82f6' }}
                            thumbColor={emailEnabled ? '#fff' : '#cbd5e1'}
                            onValueChange={() => toggleSwitch('email')}
                            value={emailEnabled}
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowTitle} allowFontScaling={false}>SMS Notifications</Text>
                            <Text style={styles.rowSubtitle} allowFontScaling={false}>Get instant text alerts for urgent updates.</Text>
                        </View>
                        <Switch
                            trackColor={{ false: '#334155', true: '#3b82f6' }}
                            thumbColor={smsEnabled ? '#fff' : '#cbd5e1'}
                            onValueChange={() => toggleSwitch('sms')}
                            value={smsEnabled}
                        />
                    </View>
                </View>

                {smsEnabled && (
                    <View style={styles.inputContainer}>
                        <Text style={styles.label} allowFontScaling={false}>Mobile Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="+1 (555) 000-0000"
                            placeholderTextColor={WME.colors.textMuted}
                            keyboardType="phone-pad"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            allowFontScaling={false}
                        />
                        <Text style={styles.helperText} allowFontScaling={false}>Standard message and data rates may apply.</Text>
                    </View>
                )}

                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={20} color={WME.colors.textMuted} />
                    <Text style={styles.infoText} allowFontScaling={false}>
                        You will always receive critical system messages regardless of these settings.
                    </Text>
                </View>

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
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '600',
        color: WME.colors.textDim,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: WME.colors.panel,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: WME.colors.border,
        marginBottom: 24,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rowInfo: {
        flex: 1,
        paddingRight: 16,
    },
    rowTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: WME.colors.text,
        marginBottom: 4,
    },
    rowSubtitle: {
        fontSize: 13,
        color: WME.colors.textMuted,
        lineHeight: 18,
    },
    divider: {
        height: 1,
        backgroundColor: WME.colors.border,
        marginVertical: 16,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: WME.colors.textDim,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: WME.colors.panel,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: WME.colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: WME.colors.border,
    },
    helperText: {
        marginTop: 6,
        fontSize: 12,
        color: WME.colors.textMuted,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(51, 65, 85, 0.5)',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        color: WME.colors.textMuted,
        fontSize: 13,
        lineHeight: 18,
    },
});
