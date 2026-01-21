import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Svg, { Circle, Ellipse, Defs, RadialGradient, Stop, G, Line } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const GLOBE_SIZE = width * 1.4; // Large globe, partially off-screen
const GLOBE_CENTER_X = GLOBE_SIZE / 2;
const GLOBE_CENTER_Y = GLOBE_SIZE / 2;
const GLOBE_RADIUS = GLOBE_SIZE / 2 - 20;

const AnimatedView = Animated.createAnimatedComponent(View);

export function GlobeBackground() {
    const rotation = useSharedValue(0);
    const pulseOpacity = useSharedValue(0.3);

    useEffect(() => {
        // Slow rotation effect
        rotation.value = withRepeat(
            withTiming(360, { duration: 120000, easing: Easing.linear }),
            -1,
            false
        );
        // Pulse glow
        pulseOpacity.value = withRepeat(
            withTiming(0.6, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const rotationStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: pulseOpacity.value,
    }));

    // Generate latitude lines (horizontal ellipses)
    const latitudeLines = [];
    for (let i = 1; i <= 6; i++) {
        const yOffset = (GLOBE_RADIUS * i) / 7;
        const radiusX = Math.sqrt(GLOBE_RADIUS * GLOBE_RADIUS - yOffset * yOffset);
        latitudeLines.push(
            <Ellipse
                key={`lat-top-${i}`}
                cx={GLOBE_CENTER_X}
                cy={GLOBE_CENTER_Y - yOffset}
                rx={radiusX}
                ry={radiusX * 0.15}
                stroke="rgba(59, 130, 246, 0.25)"
                strokeWidth={1}
                fill="none"
            />,
            <Ellipse
                key={`lat-bot-${i}`}
                cx={GLOBE_CENTER_X}
                cy={GLOBE_CENTER_Y + yOffset}
                rx={radiusX}
                ry={radiusX * 0.15}
                stroke="rgba(59, 130, 246, 0.25)"
                strokeWidth={1}
                fill="none"
            />
        );
    }

    // Generate longitude lines (vertical ellipses at different angles)
    const longitudeLines = [];
    for (let i = 0; i < 8; i++) {
        const angle = (i * 180) / 8;
        const radiusX = GLOBE_RADIUS * Math.abs(Math.cos((angle * Math.PI) / 180));
        longitudeLines.push(
            <Ellipse
                key={`long-${i}`}
                cx={GLOBE_CENTER_X}
                cy={GLOBE_CENTER_Y}
                rx={radiusX || 2}
                ry={GLOBE_RADIUS}
                stroke="rgba(59, 130, 246, 0.2)"
                strokeWidth={1}
                fill="none"
            />
        );
    }

    return (
        <View style={styles.container}>
            {/* Base dark gradient */}
            <LinearGradient
                colors={['#0a0f1a', '#0d1424', '#111827']}
                style={styles.gradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />

            {/* Globe glow effect */}
            <AnimatedView style={[styles.glowContainer, glowStyle]}>
                <LinearGradient
                    colors={['rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.05)', 'transparent']}
                    style={styles.glow}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />
            </AnimatedView>

            {/* SVG Globe Wireframe */}
            <AnimatedView style={[styles.globeContainer, rotationStyle]}>
                <Svg width={GLOBE_SIZE} height={GLOBE_SIZE} viewBox={`0 0 ${GLOBE_SIZE} ${GLOBE_SIZE}`}>
                    <Defs>
                        <RadialGradient id="globeGradient" cx="50%" cy="30%" r="70%">
                            <Stop offset="0%" stopColor="rgba(59, 130, 246, 0.1)" />
                            <Stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
                        </RadialGradient>
                    </Defs>

                    {/* Globe fill with subtle gradient */}
                    <Circle
                        cx={GLOBE_CENTER_X}
                        cy={GLOBE_CENTER_Y}
                        r={GLOBE_RADIUS}
                        fill="url(#globeGradient)"
                    />

                    {/* Outer circle */}
                    <Circle
                        cx={GLOBE_CENTER_X}
                        cy={GLOBE_CENTER_Y}
                        r={GLOBE_RADIUS}
                        stroke="rgba(59, 130, 246, 0.3)"
                        strokeWidth={1.5}
                        fill="none"
                    />

                    {/* Equator - more prominent */}
                    <Ellipse
                        cx={GLOBE_CENTER_X}
                        cy={GLOBE_CENTER_Y}
                        rx={GLOBE_RADIUS}
                        ry={GLOBE_RADIUS * 0.15}
                        stroke="rgba(59, 130, 246, 0.35)"
                        strokeWidth={1.5}
                        fill="none"
                    />

                    {/* Latitude lines */}
                    <G>{latitudeLines}</G>

                    {/* Longitude lines */}
                    <G>{longitudeLines}</G>

                    {/* Center vertical line */}
                    <Line
                        x1={GLOBE_CENTER_X}
                        y1={GLOBE_CENTER_Y - GLOBE_RADIUS}
                        x2={GLOBE_CENTER_X}
                        y2={GLOBE_CENTER_Y + GLOBE_RADIUS}
                        stroke="rgba(59, 130, 246, 0.25)"
                        strokeWidth={1}
                    />
                </Svg>
            </AnimatedView>

            {/* Top gradient fade for content readability */}
            <LinearGradient
                colors={['#0a0f1a', 'rgba(10, 15, 26, 0.9)', 'transparent']}
                style={styles.topFade}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: -1,
        overflow: 'hidden',
        backgroundColor: '#0a0f1a',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    glowContainer: {
        position: 'absolute',
        bottom: -GLOBE_SIZE * 0.3,
        left: (width - GLOBE_SIZE) / 2,
        width: GLOBE_SIZE,
        height: GLOBE_SIZE,
    },
    glow: {
        width: GLOBE_SIZE,
        height: GLOBE_SIZE,
        borderRadius: GLOBE_SIZE / 2,
    },
    globeContainer: {
        position: 'absolute',
        bottom: -GLOBE_SIZE * 0.55, // Globe peeks from bottom
        left: (width - GLOBE_SIZE) / 2,
        width: GLOBE_SIZE,
        height: GLOBE_SIZE,
    },
    topFade: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.4,
    },
});
