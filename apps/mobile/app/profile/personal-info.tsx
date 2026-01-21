import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, StatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WME } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function PersonalInfoScreen() {
    const router = useRouter();
    const [name, setName] = useState('Sara Jensen');
    const [email, setEmail] = useState('sara@wmeplus.com');
    const [phone, setPhone] = useState('+1 (555) 123-4567');
    const [title, setTitle] = useState('Remote Project Manager');
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        if (!name || !email) {
            Alert.alert('Error', 'Name and Email are required.');
            return;
        }

        setSaving(true);
        // Mock API call
        setTimeout(() => {
            setSaving(false);
            Alert.alert('Success', 'Profile updated successfully.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }, 1000);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={WME.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>Personal Information</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarPlaceholder}>
                            <Image
                                source={require('../../assets/sara_avatar.png')}
                                style={{ width: 100, height: 100, borderRadius: 50 }}
                            />
                        </View>
                        <Text style={styles.editPhotoText} allowFontScaling={false}>Edit Photo</Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label} allowFontScaling={false}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor={WME.colors.textMuted}
                            allowFontScaling={false}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label} allowFontScaling={false}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor={WME.colors.textMuted}
                            allowFontScaling={false}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label} allowFontScaling={false}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            placeholderTextColor={WME.colors.textMuted}
                            allowFontScaling={false}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label} allowFontScaling={false}>Role / Title</Text>
                        <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={title}
                            editable={false}
                            placeholderTextColor={WME.colors.textMuted}
                            allowFontScaling={false}
                        />
                        <Text style={styles.helperText} allowFontScaling={false}>Contact Admin to change your role.</Text>
                    </View>

                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <LinearGradient
                            colors={['#3b82f6', '#2563eb']}
                            style={styles.gradientButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.saveButtonText} allowFontScaling={false}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: WME.colors.panel,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: WME.colors.border,
        marginBottom: 12,
    },
    avatarInitials: {
        fontSize: 32,
        fontWeight: 'bold',
        color: WME.colors.text,
    },
    editPhotoText: {
        color: WME.colors.accent,
        fontSize: 14,
        fontWeight: '500',
    },
    formGroup: {
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
    disabledInput: {
        opacity: 0.6,
        backgroundColor: WME.colors.base,
    },
    helperText: {
        marginTop: 6,
        fontSize: 12,
        color: WME.colors.textMuted,
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: WME.colors.border,
    },
    saveButton: {
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    gradientButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
