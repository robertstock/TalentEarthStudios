import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WME } from '../constants/theme';

interface Props {
    onRecordingComplete: (uri: string) => void;
}

export const AudioRecorder: React.FC<Props> = ({ onRecordingComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [hasRecording, setHasRecording] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Timer for recording duration
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    // Pulse animation for recording indicator
    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRecording]);

    function startRecording() {
        setIsRecording(true);
        setDuration(0);
        setHasRecording(false);
    }

    function stopRecording() {
        setIsRecording(false);
        setHasRecording(true);

        // Generate a mock file URI
        const mockUri = `file://mock-recording-${Date.now()}.m4a`;
        onRecordingComplete(mockUri);

        Alert.alert(
            '✅ Recording Captured',
            `${formatDuration(duration)} of audio recorded.\n\nNote: Full audio processing requires a native app build. For now, you can continue with the form.`,
            [{ text: 'OK' }]
        );
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.statusContainer}>
                {isRecording ? (
                    <View style={styles.recordingIndicator}>
                        <Animated.View style={[styles.dot, { transform: [{ scale: pulseAnim }] }]} />
                        <Text style={styles.recordingText}>Recording... {formatDuration(duration)}</Text>
                    </View>
                ) : hasRecording ? (
                    <View style={styles.recordingIndicator}>
                        <Ionicons name="checkmark-circle" size={16} color={WME.colors.success} />
                        <Text style={styles.savedText}>Recording saved ({formatDuration(duration)})</Text>
                    </View>
                ) : (
                    <Text style={styles.instructionText}>Tap to record client meeting</Text>
                )}
            </View>

            <TouchableOpacity
                style={[
                    styles.recordButton,
                    isRecording && styles.recordButtonActive,
                    hasRecording && !isRecording && styles.recordButtonSaved
                ]}
                onPress={isRecording ? stopRecording : startRecording}
            >
                <Ionicons
                    name={isRecording ? "stop" : hasRecording ? "mic" : "mic"}
                    size={32}
                    color="#fff"
                />
            </TouchableOpacity>

            <Text style={styles.helperText}>
                {hasRecording ? 'Tap to record again' : 'Auto-fill SOW from your recording'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: WME.colors.panel,
        borderRadius: WME.radius.lg,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: WME.colors.border,
        marginVertical: 16,
    },
    statusContainer: {
        marginBottom: 16,
        height: 24,
        justifyContent: 'center',
    },
    instructionText: {
        color: WME.colors.textMuted,
        fontSize: 14,
    },
    savedText: {
        color: WME.colors.success,
        fontSize: 13,
        fontWeight: '500',
    },
    helperText: {
        color: WME.colors.textDim,
        fontSize: 11,
        marginTop: 12,
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: WME.colors.error,
    },
    recordingText: {
        color: WME.colors.error,
        fontWeight: '600',
        fontSize: 14,
    },
    recordButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: WME.colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    recordButtonActive: {
        backgroundColor: WME.colors.error,
    },
    recordButtonSaved: {
        backgroundColor: WME.colors.success,
    },
});
