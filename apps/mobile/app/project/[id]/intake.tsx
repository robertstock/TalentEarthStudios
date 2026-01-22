import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, StatusBar, TouchableOpacity, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { QuestionRenderer } from '../../../components/QuestionRenderer';
import { AudioRecorder } from '../../../components/AudioRecorder';
import { API_URL } from '../../../constants/Constants';
import { WME } from '../../../constants/theme';
import { Ionicons } from '@expo/vector-icons';


const MOCK_QUESTIONS = [
    { id: 'q1', type: 'SHORT_TEXT', prompt: 'Project Name', required: true, ordering: 1 },
    { id: 'q2', type: 'SINGLE_SELECT', prompt: 'Budget Range', required: true, optionsJson: JSON.stringify(['$5k - $10k', '$10k - $25k', '$25k+']), ordering: 2 },
    { id: 'q3', type: 'SINGLE_SELECT', prompt: 'Timeline', required: true, optionsJson: JSON.stringify(['Rush (<2 weeks)', 'Standard (3-4 weeks)', 'Flexible']), ordering: 3 },
    { id: 'q5', type: 'DATE', prompt: 'Target Delivery Date', required: false, ordering: 4 },
    { id: 'q4', type: 'LONG_TEXT', prompt: 'Project Description', required: false, ordering: 5 },
];

export default function IntakeForm() {
    const { id, categoryId } = useLocalSearchParams();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [project, setProject] = useState<any>({ name: 'New Project Draft' });
    const [questions, setQuestions] = useState<any[]>(MOCK_QUESTIONS);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [submitting, setSubmitting] = useState(false);
    const [audioUri, setAudioUri] = useState<string | null>(null);
    const [processingAudio, setProcessingAudio] = useState(false);
    const [adminReview, setAdminReview] = useState<{ comments: string; reviewer?: { name: string } } | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Fetch existing project data for editing
    useEffect(() => {
        const fetchProject = async () => {
            if (id && id !== 'new') {
                setLoading(true);
                try {
                    // Use the specific project endpoint to get full details including answers
                    const response = await fetch(`${API_URL}/projects/${id}`);
                    if (response.ok) {
                        const existingProject = await response.json();

                        if (existingProject) {
                            setProject(existingProject);
                            setIsEditing(true);

                            // Populate answers from existing project
                            if (existingProject.answers) {
                                const loadedAnswers: Record<string, any> = {};
                                existingProject.answers.forEach((ans: any) => {
                                    if (ans.questionId) {
                                        // Try to parse JSON if it looks like it, otherwise use text
                                        try {
                                            loadedAnswers[ans.questionId] = JSON.parse(ans.valueText);
                                        } catch {
                                            loadedAnswers[ans.questionId] = ans.valueText;
                                        }
                                    }
                                });
                                setAnswers(loadedAnswers);
                            }

                            // If project needs updates, get the latest review
                            if (existingProject.status === 'NEEDS_RPM_UPDATE' && existingProject.adminReviews?.length > 0) {
                                setAdminReview(existingProject.adminReviews[0]);
                            }
                        }
                    }
                } catch (error) {
                    console.error('FETCH_PROJECT_ERROR:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchProject();
    }, [id]);

    // Fetch questions for category
    useEffect(() => {
        const fetchQuestions = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/categories`);
                if (!response.ok) throw new Error('Failed to fetch categories');
                const data = await response.json();

                const targetCategoryId = categoryId || project?.categoryId;
                const category = data.find((cat: any) => cat.id === targetCategoryId);
                const activeQS = category?.questionSets?.find((qs: any) => qs.active);

                if (activeQS?.questions) {
                    const sortedQuestions = activeQS.questions.sort((a: any, b: any) => a.ordering - b.ordering);

                    // Force ensure DATE is present if missing (safety net for mismatched seed data)
                    const hasDate = sortedQuestions.find((q: any) => q.type === 'DATE');
                    if (!hasDate) {
                        sortedQuestions.push({
                            id: 'q_date_fallback',
                            type: 'DATE',
                            prompt: 'Target Delivery Date',
                            required: false,
                            ordering: 4.5
                        });
                        // Re-sort to ensure correct placement
                        sortedQuestions.sort((a: any, b: any) => a.ordering - b.ordering);
                    }

                    setQuestions(sortedQuestions);
                }
            } catch (error) {
                console.error('FETCH_ERROR:', error);
            } finally {
                setLoading(false);
            }
        };

        if (categoryId || project?.categoryId) {
            fetchQuestions();
        }
    }, [categoryId, project?.categoryId]);

    const processAudio = async () => {
        if (!audioUri) return;

        // Check if this is a mock recording (demo mode)
        if (audioUri.includes('mock-recording')) {
            Alert.alert(
                '🎤 Demo Mode',
                'Audio transcription requires a native app build. In a production app, your recording would be:\n\n1. Transcribed using AI\n2. Analyzed for project details\n3. Auto-filled into the form\n\nFor now, please fill out the form manually.',
                [{ text: 'Got it' }]
            );
            return;
        }

        setProcessingAudio(true);
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: audioUri,
                name: 'recording.m4a',
                type: 'audio/m4a'
            } as any);

            // 1. Transcribe
            const transRes = await fetch(`${API_URL}/ai/transcribe`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            const transData = await transRes.json();

            if (transData.error) throw new Error(transData.error);

            // 2. Synthesize
            const synRes = await fetch(`${API_URL}/ai/synthesize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: transData.text })
            });
            const synData = await synRes.json();

            if (synData.error) throw new Error(synData.error);

            // 3. Populate Description Field
            // Find question with LONG_TEXT type which is usually the description
            const descQ = questions.find(q => q.type === 'LONG_TEXT');
            if (descQ) {
                setAnswers(prev => ({ ...prev, [descQ.id]: synData.analysis }));
                Alert.alert('AI Success', 'Project Description auto-filled from your recording.');
            } else {
                Alert.alert('AI Success', 'Analysis complete, but could not find a description field to fill.');
            }

        } catch (e) {
            console.error('AI_PROCESS_ERROR', e);
            Alert.alert('AI Error', 'Failed to process audio. Please try again.');
        } finally {
            setProcessingAudio(false);
        }
    };

    // Sync orphan date answer (from DB real ID or legacy keys) to active date question
    useEffect(() => {
        const dateQ = questions.find(q => q.type === 'DATE');
        // Only run if we have a date question and it doesn't have a value yet
        if (dateQ && !answers[dateQ.id]) {
            // 1. Check specific legacy keys
            if (answers['q_Date']) {
                setAnswers(prev => ({ ...prev, [dateQ.id]: prev['q_Date'] }));
                return;
            }
            // 2. Check mock key
            if (answers['q5']) {
                setAnswers(prev => ({ ...prev, [dateQ.id]: prev['q5'] }));
                return;
            }

            // 3. Find generic orphan date
            const validQIds = new Set(questions.map(q => q.id));
            const orphanAnswerKey = Object.keys(answers).find(key =>
                !validQIds.has(key) &&
                typeof answers[key] === 'string' &&
                /^\d{2}\/\d{2}\/\d{4}$/.test(answers[key])
            );

            if (orphanAnswerKey) {
                setAnswers(prev => ({
                    ...prev,
                    [dateQ.id]: prev[orphanAnswerKey]
                }));
            }
        }
    }, [questions, answers]);

    const handleDelete = () => {
        Alert.alert(
            'Delete Project',
            'Are you sure you want to delete this project? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setSubmitting(true);
                        try {
                            const response = await fetch(`${API_URL}/projects/${id}`, {
                                method: 'DELETE',
                            });

                            if (!response.ok) throw new Error('Failed to delete project');

                            Alert.alert('Success', 'Project deleted successfully', [
                                { text: 'OK', onPress: () => router.push('/(tabs)/projects') }
                            ]);
                        } catch (error) {
                            console.error('DELETE_ERROR:', error);
                            Alert.alert('Error', 'Failed to delete project');
                            setSubmitting(false);
                        }
                    }
                }
            ]
        );
    };

    const handleSubmit = async () => {
        const missingRequired = questions.find(q => q.required && !answers[q.id]);
        if (missingRequired) {
            Alert.alert('Required', `Please answer: ${missingRequired.prompt}`);
            return;
        }

        setSubmitting(true);
        try {
            const nameQuestion = questions.find(q => q.prompt === 'Project Name') || questions[0];
            const projectName = answers[nameQuestion?.id] || `Project ${new Date().toLocaleDateString()}`;

            if (isEditing) {
                // Resubmit existing project
                const response = await fetch(`${API_URL}/projects/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: projectName,
                        answers: answers,
                    }),
                });

                if (!response.ok) throw new Error('Failed to resubmit project');

                Alert.alert(
                    'Project Resubmitted',
                    'Your updated project has been sent back for review.',
                    [{ text: 'OK', onPress: () => router.push('/(tabs)/projects') }]
                );
            } else {
                // Create new project
                const response = await fetch(`${API_URL}/projects`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: projectName,
                        categoryId: categoryId as string,
                        answers: answers,
                    }),
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.message || `Failed to create project (Status: ${response.status})`);
                }

                Alert.alert(
                    'Project Submitted',
                    'Audio and details sent to WME+ for review.',
                    [{ text: 'OK', onPress: () => router.push('/(tabs)/projects') }]
                );
            }
        } catch (error: any) {
            console.error('SUBMIT_ERROR:', error);
            Alert.alert('Error', error.message || 'Failed to submit project. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={WME.colors.textMuted} />
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={20} color={WME.colors.text} />
                </Pressable>
                <Text style={styles.headerTitle} allowFontScaling={false}>PROJECT DETAILS</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Admin Change Request Banner */}
                {adminReview && (
                    <View style={styles.changeRequestBanner}>
                        <View style={styles.changeRequestHeader}>
                            <Ionicons name="alert-circle" size={20} color="#FF6B35" />
                            <Text style={styles.changeRequestTitle} allowFontScaling={false}>Changes Requested</Text>
                        </View>
                        <Text style={styles.changeRequestMessage} allowFontScaling={false}>{adminReview.comments}</Text>
                        {adminReview.reviewer?.name && (
                            <Text style={styles.changeRequestReviewer} allowFontScaling={false}>— {adminReview.reviewer.name}</Text>
                        )}
                    </View>
                )}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel} allowFontScaling={false}>01 // {isEditing ? 'UPDATE' : 'INTAKE'}</Text>
                    <Text style={styles.sectionTitle} allowFontScaling={false}>{isEditing ? 'Update Project' : 'Project Information'}</Text>
                </View>

                <AudioRecorder
                    onRecordingComplete={(uri) => {
                        setAudioUri(uri);
                        Alert.alert('Recording Saved', 'Ready to process with AI.');
                    }}
                />

                {audioUri && (
                    <View style={styles.audioActionContainer}>
                        <View style={styles.audioBadge}>
                            <Ionicons name="mic" size={16} color={WME.colors.success} />
                            <Text style={styles.audioText} allowFontScaling={false}>Audio Attached</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.aiButton}
                            onPress={processAudio}
                            disabled={processingAudio}
                        >
                            {processingAudio ? (
                                <ActivityIndicator size="small" color={WME.colors.base} />
                            ) : (
                                <>
                                    <Ionicons name="sparkles" size={16} color={WME.colors.base} />
                                    <Text style={styles.aiButtonText} allowFontScaling={false}>Auto-Fill with AI</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {questions.map(q => (
                    <QuestionRenderer
                        key={q.id}
                        question={q}
                        value={answers[q.id]}
                        onChange={(val) => setAnswers(prev => ({ ...prev, [q.id]: val }))}
                    />
                ))}

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        <Text style={styles.submitText} allowFontScaling={false}>
                            {submitting
                                ? 'SUBMITTING...'
                                : isEditing
                                    ? 'RESUBMIT FOR REVIEW'
                                    : 'SUBMIT PROJECT REQUEST'
                            }
                        </Text>
                    </TouchableOpacity>

                    {isEditing && (
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={handleDelete}
                            disabled={submitting}
                        >
                            <Text style={styles.deleteButtonText} allowFontScaling={false}>Delete Project</Text>
                        </TouchableOpacity>
                    )}
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
    loadingContainer: {
        flex: 1,
        backgroundColor: WME.colors.base,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: WME.colors.border,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: WME.colors.panel,
        borderWidth: 1,
        borderColor: WME.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholder: {
        width: 36,
    },
    headerTitle: {
        fontSize: 12,
        fontWeight: '500',
        color: WME.colors.textDim,
        letterSpacing: 2,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        paddingBottom: 100,
    },
    sectionHeader: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: WME.colors.textDim,
        letterSpacing: 1,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '300',
        color: WME.colors.text,
        letterSpacing: -0.5,
    },
    audioActionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 12,
    },
    audioBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: WME.colors.panel,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: WME.radius.full,
        borderWidth: 1,
        borderColor: WME.colors.success,
        gap: 8,
    },
    audioText: {
        color: WME.colors.success,
        fontSize: 12,
        fontWeight: '600',
    },
    aiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: WME.colors.accent,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: WME.radius.full,
        gap: 6,
    },
    aiButtonText: {
        color: WME.colors.base,
        fontSize: 12,
        fontWeight: '700',
    },
    footer: {
        marginTop: 32,
        marginBottom: 40,
    },
    submitButton: {
        backgroundColor: WME.colors.text,
        paddingVertical: 18,
        borderRadius: WME.radius.sm,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitText: {
        color: WME.colors.base,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 2,
    },

    // Change Request Banner styles
    changeRequestBanner: {
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        borderWidth: 1,
        borderColor: '#FF6B35',
        borderRadius: WME.radius.md,
        padding: 16,
        marginBottom: 20,
    },
    changeRequestHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    changeRequestTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF6B35',
    },
    changeRequestMessage: {
        fontSize: 14,
        color: WME.colors.text,
        lineHeight: 20,
    },
    changeRequestReviewer: {
        fontSize: 12,
        color: WME.colors.textDim,
        marginTop: 8,
        fontStyle: 'italic',
    },
    deleteButton: {
        marginTop: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: WME.colors.error || '#ef4444',
        borderRadius: WME.radius.sm,
    },
    deleteButtonText: {
        color: WME.colors.error || '#ef4444',
        fontSize: 14,
        fontWeight: '600',
    },
});
