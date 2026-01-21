import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function Profile() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.header}
            >
                <View style={styles.profileInfo}>
                    <Image
                        source={require('../../assets/sara_avatar.png')}
                        style={styles.avatar}
                    />
                    <Text style={styles.name} allowFontScaling={false}>Sara Jensen</Text>
                    <Text style={styles.role} allowFontScaling={false}>Remote Project Manager</Text>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle} allowFontScaling={false}>Account</Text>

                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => router.push('/profile/personal-info')}
                    >
                        <View style={styles.rowIcon}>
                            <Ionicons name="person-outline" size={20} color="#64748b" />
                        </View>
                        <Text style={styles.rowText} allowFontScaling={false}>Personal Information</Text>
                        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => router.push('/profile/notifications')}
                    >
                        <View style={styles.rowIcon}>
                            <Ionicons name="notifications-outline" size={20} color="#64748b" />
                        </View>
                        <Text style={styles.rowText} allowFontScaling={false}>Notifications</Text>
                        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => router.push('/profile/commissions')}
                    >
                        <View style={styles.rowIcon}>
                            <Ionicons name="cash-outline" size={20} color="#64748b" />
                        </View>
                        <Text style={styles.rowText} allowFontScaling={false}>Commissions</Text>
                        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => router.replace('/')}
                >
                    <Text style={styles.logoutText} allowFontScaling={false}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { paddingTop: 60, paddingBottom: 30, alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    profileInfo: { alignItems: 'center' },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 12 },
    name: { fontSize: 22, fontWeight: '700', color: 'white', marginBottom: 4 },
    role: { fontSize: 13, color: '#94a3b8' },

    content: { padding: 24 },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },

    row: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    rowIcon: { width: 32, height: 32, backgroundColor: '#f1f5f9', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    rowText: { flex: 1, fontSize: 15, color: '#1e293b' },

    logoutButton: { alignItems: 'center', padding: 16 },
    logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});
