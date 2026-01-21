import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// A single floating blob of color
const AnimatedBlob = ({
    color,
    size,
    initialX,
    initialY,
    duration,
    delay = 0
}: {
    color: string;
    size: number;
    initialX: number;
    initialY: number;
    duration: number;
    delay?: number;
}) => {
    const translationX = useSharedValue(initialX);
    const translationY = useSharedValue(initialY);
    const scale = useSharedValue(1);

    useEffect(() => {
        // Animate X movement
        translationX.value = withRepeat(
            withTiming(initialX + (Math.random() * 100 - 50), {
                duration: duration * 0.8,
                easing: Easing.inOut(Easing.sin),
            }),
            -1,
            true
        );

        // Animate Y movement
        translationY.value = withRepeat(
            withTiming(initialY + (Math.random() * 100 - 50), {
                duration: duration,
                easing: Easing.inOut(Easing.sin),
            }),
            -1,
            true
        );

        // Animate Scale
        scale.value = withRepeat(
            withTiming(1.2, {
                duration: duration * 1.2,
                easing: Easing.inOut(Easing.sin),
            }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translationX.value },
                { translateY: translationY.value },
                { scale: scale.value },
            ],
            opacity: 0.6, // Soften the blob
        };
    });

    return (
        <Animated.View
            style={[
                styles.blob,
                {
                    backgroundColor: color,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    left: -size / 2,
                    top: -size / 2,
                    position: 'absolute',
                },
                animatedStyle,
            ]}
        />
    );
};

export function LoginBackground() {
    return (
        <View style={styles.container}>
            {/* Deep base layer */}
            <View style={styles.baseLayer} />

            {/* Bottom Glow */}
            <LinearGradient
                colors={['transparent', 'rgba(59, 130, 246, 0.15)', 'rgba(99, 102, 241, 0.2)']}
                style={styles.bottomGradient}
            />

            {/* Animated Organic Blobs - creating a "Shifting Liquid" effect */}
            <AnimatedBlob
                color="#3b82f6"
                size={width * 0.8}
                initialX={width * 0.2}
                initialY={height * 0.3}
                duration={15000}
            />
            <AnimatedBlob
                color="#6366f1"
                size={width * 0.9}
                initialX={width * 0.8}
                initialY={height * 0.7}
                duration={18000}
            />
            <AnimatedBlob
                color="#8b5cf6"
                size={width * 0.7}
                initialX={width * 0.5}
                initialY={height * 0.5}
                duration={21000}
            />
            <AnimatedBlob
                color="#1e40af"
                size={width * 1.0}
                initialX={width * 0.1}
                initialY={height * 0.9}
                duration={25000}
            />

            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

            {/* Overlay Grid Line - for texture and high-tech feel */}
            <View style={styles.gridOverlay}>
                {[...Array(8)].map((_, i) => (
                    <View key={`h-${i}`} style={[styles.gridLineH, { top: `${i * 14}%` }]} />
                ))}
                {[...Array(4)].map((_, i) => (
                    <View key={`v-${i}`} style={[styles.gridLineV, { left: `${i * 33}%` }]} />
                ))}
            </View>

            {/* Dark vignette to focus eye on center */}
            <LinearGradient
                colors={['rgba(10, 15, 26, 0.7)', 'transparent', 'rgba(10, 15, 26, 0.8)']}
                style={StyleSheet.absoluteFill}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0a0f1a', // Absolute base
        overflow: 'hidden',
    },
    baseLayer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0a0f1a',
    },
    blob: {
        // Blobs will use blur filters if we had them easily available,
        // but since we want to avoid native modules that might fail,
        // we'll rely on large sizes and low opacity for now.
        // If we want even more blur, we'd need expo-blur or similar.
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    gridOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.03,
    },
    gridLineH: {
        position: 'absolute',
        height: 1,
        width: '100%',
        backgroundColor: '#60a5fa',
    },
    gridLineV: {
        position: 'absolute',
        width: 1,
        height: '100%',
        backgroundColor: '#60a5fa',
    },
});
