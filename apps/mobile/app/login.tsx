import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Dimensions,
    StatusBar,
    Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { WME } from '../constants/theme';
import { LoginBackground } from '../components/LoginBackground';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = (demoType?: 'ADMIN' | 'RPM') => {
        let loginEmail = email;
        let loginPass = password;

        if (demoType === 'ADMIN') {
            loginEmail = 'admin@wmeplus.com';
            loginPass = 'password';
        } else if (demoType === 'RPM') {
            loginEmail = 'sara@wmeplus.com';
            loginPass = 'password';
        }

        if (demoType) {
            setEmail(loginEmail);
            setPassword(loginPass);
        }

        if (!loginEmail || !loginPass) {
            Alert.alert('Missing Fields', 'Please enter both your email and password.');
            return;
        }

        setLoading(true);

        // Simulation
        setTimeout(() => {
            setLoading(false);
            if (loginEmail.toLowerCase() === 'admin@wmeplus.com') {
                router.replace('/admin/dashboard');
            } else if (loginEmail.toLowerCase() === 'sara@wmeplus.com') {
                router.replace('/(tabs)/projects');
            } else {
                Alert.alert('Access Denied', 'Invalid credentials. Please use the demo shortcuts below.');
            }
        }, 1200);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LoginBackground />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    {/* Header Logo Area */}
                    <Animated.View
                        entering={FadeInDown.delay(200).duration(800)}
                        style={styles.logoContainer}
                    >
                        <Image
                            source={require('../assets/images/talent_earth_logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.brandSubtitle} allowFontScaling={false}>GLOBAL PRODUCTION WORKFLOW</Text>
                    </Animated.View>

                    {/* Main Auth Form */}
                    <Animated.View
                        entering={FadeInDown.delay(400).duration(800)}
                        style={styles.formWrapper}
                    >
                        <BlurView intensity={80} tint="dark" style={styles.glassCard}>
                            <Text style={styles.loginTitle} allowFontScaling={false}>Log In</Text>

                            <View style={styles.inputGroup}>
                                <View style={styles.inputField}>
                                    <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Email"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        allowFontScaling={false}
                                    />
                                </View>

                                <View style={styles.inputField}>
                                    <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Password"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        allowFontScaling={false}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={() => handleLogin()}
                                disabled={loading}
                                activeOpacity={0.8}
                                style={styles.mainButton}
                            >
                                <LinearGradient
                                    colors={['#3b82f6', '#6366f1']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.buttonGradient}
                                >
                                    <Text style={styles.buttonText} allowFontScaling={false}>
                                        {loading ? 'Processing...' : 'Secure Access'}
                                    </Text>
                                    {!loading && <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />}
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.forgotBtn}>
                                <Text style={styles.forgotTxt} allowFontScaling={false}>Trouble logging in?</Text>
                            </TouchableOpacity>
                        </BlurView>
                    </Animated.View>

                    {/* Demo Shortcuts */}
                    <Animated.View
                        entering={FadeInUp.delay(600).duration(800)}
                        style={styles.demoSection}
                    >
                        <Text style={styles.demoHeader} allowFontScaling={false}>QUICK ACCESS</Text>
                        <View style={styles.demoGrid}>
                            <TouchableOpacity
                                style={styles.demoItem}
                                onPress={() => handleLogin('RPM')}
                                activeOpacity={0.7}
                            >
                                <BlurView intensity={15} tint="dark" style={styles.demoGlass}>
                                    <Ionicons name="person" size={16} color="#60a5fa" />
                                    <Text style={styles.demoLabel} allowFontScaling={false}>Producer</Text>
                                </BlurView>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.demoItem}
                                onPress={() => handleLogin('ADMIN')}
                                activeOpacity={0.7}
                            >
                                <BlurView intensity={15} tint="dark" style={styles.demoGlass}>
                                    <Ionicons name="shield-checkmark" size={16} color="#818cf8" />
                                    <Text style={styles.demoLabel} allowFontScaling={false}>Admin</Text>
                                </BlurView>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Footer */}
                    <Animated.View
                        entering={FadeIn.delay(1000)}
                        style={styles.footer}
                    >
                        <Text style={styles.footerText} allowFontScaling={false}>
                            © 2024 TalentEarthStudios
                        </Text>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

// Re-using styles with a more modern aesthetic
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0f1a',
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoText: {
        fontSize: 34,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 8,
    },
    brandSubtitle: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '600',
        letterSpacing: 2,
        marginTop: 8,
    },
    formWrapper: {
        width: '100%',
        marginBottom: 32,
    },
    glassCard: {
        borderRadius: 32,
        padding: 24,
        paddingTop: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(10, 15, 26, 0.7)', // Increased opacity for better readability
    },
    logoImage: {
        width: 168,
        height: 60,
        marginBottom: 4,
    },
    loginTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        marginBottom: 24,
    },
    inputGroup: {
        gap: 12,
        marginBottom: 24,
    },
    inputField: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 16,
    },
    mainButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    buttonGradient: {
        height: 56,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '700',
    },
    forgotBtn: {
        marginTop: 16,
        alignItems: 'center',
    },
    forgotTxt: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '500',
    },
    demoSection: {
        width: '100%',
    },
    demoHeader: {
        fontSize: 11,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: 1.5,
        marginBottom: 16,
        textAlign: 'center',
    },
    demoGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    demoItem: {
        flex: 1,
    },
    demoGlass: {
        height: 50,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
    },
    demoLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        marginTop: 60,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.3)',
    },
});
