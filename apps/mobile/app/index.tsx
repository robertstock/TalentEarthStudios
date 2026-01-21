import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { WME } from '../constants/theme';
import { LoginBackground } from '../components/LoginBackground';

const { width } = Dimensions.get('window');

export default function LandingPage() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LoginBackground />

            <View style={styles.content}>
                {/* Hero Section */}
                <Animated.View
                    entering={FadeInDown.delay(200).duration(1000)}
                    style={styles.hero}
                >
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../assets/images/wme_logo_white_new.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <Text style={styles.tagline} allowFontScaling={false}>Global Production Workflow.</Text>

                    <Text style={styles.description} allowFontScaling={false}>
                        The centralized platform for managing creative projects, SOWs, and localized content delivery at scale.
                    </Text>
                </Animated.View>

                {/* Action Section */}
                <View style={styles.footer}>
                    <Animated.View entering={FadeInUp.delay(600).duration(1000)} style={{ width: '100%', alignItems: 'center' }}>
                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={() => router.push('/login')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#3b82f6', '#6366f1']}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.buttonText} allowFontScaling={false}>Log In</Text>
                                <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View entering={FadeIn.delay(1200)} style={styles.copyContainer}>
                        <Text style={styles.copy} allowFontScaling={false}>© 2024 WME+ Creative Studios</Text>
                    </Animated.View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0f1a',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 32,
        paddingTop: 100,
        paddingBottom: 60,
    },
    hero: {
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        width: 220,
        height: 70,
    },
    tagline: {
        fontSize: 28,
        fontWeight: '300',
        color: 'white',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 38,
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        lineHeight: 26,
        maxWidth: 320,
        fontWeight: '400',
    },
    footer: {
        width: '100%',
        alignItems: 'center',
    },
    loginButton: {
        width: '100%',
        maxWidth: 340,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        marginBottom: 40,
    },
    buttonGradient: {
        height: 64,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 19,
        fontWeight: '700',
        letterSpacing: 1,
    },
    copyContainer: {
        marginTop: 20,
    },
    copy: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.3)',
        fontWeight: '500',
    },
});
