import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WME } from '../constants/theme';

interface Question {
    id: string;
    type: string;
    prompt: string;
    required: boolean;
    optionsJson?: string;
    ordering: number;
    helpText?: string | null;
}

interface Props {
    question: Question;
    value: any;
    onChange: (val: any) => void;
}

// Auto-format date input to mm/dd/yyyy
const formatDateInput = (text: string): string => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 2) {
        return digits;
    } else if (digits.length <= 4) {
        return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
        return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
};

// Format to mm/dd/yyyy
const formatDate = (month: number, day: number, year: number): string => {
    return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
};

// Parse mm/dd/yyyy to parts
const parseDate = (dateStr: string): { month: number; day: number; year: number } => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return {
            month: parseInt(parts[0], 10) || 1,
            day: parseInt(parts[1], 10) || 1,
            year: parseInt(parts[2], 10) || new Date().getFullYear(),
        };
    }
    const now = new Date();
    return { month: now.getMonth() + 1, day: now.getDate(), year: now.getFullYear() };
};

// Pure JS Date Picker Component
const SimpleDatePicker: React.FC<{
    visible: boolean;
    onClose: () => void;
    onSelect: (date: string) => void;
    initialValue: string;
}> = ({ visible, onClose, onSelect, initialValue }) => {
    const { month, day, year } = parseDate(initialValue);
    const [selectedMonth, setSelectedMonth] = useState(month);
    const [selectedDay, setSelectedDay] = useState(day);
    const [selectedYear, setSelectedYear] = useState(year);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    const handleDone = () => {
        onSelect(formatDate(selectedMonth, selectedDay, selectedYear));
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
            <View style={pickerStyles.overlay}>
                <View style={pickerStyles.container}>
                    <View style={pickerStyles.header}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={pickerStyles.cancelText} allowFontScaling={false}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={pickerStyles.title} allowFontScaling={false}>SELECT DATE</Text>
                        <TouchableOpacity onPress={handleDone}>
                            <Text style={pickerStyles.doneText} allowFontScaling={false}>Done</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={pickerStyles.pickersRow}>
                        <ScrollView style={pickerStyles.column} showsVerticalScrollIndicator={false}>
                            {months.map((m, i) => (
                                <TouchableOpacity
                                    key={m}
                                    style={[pickerStyles.item, selectedMonth === i + 1 && pickerStyles.itemSelected]}
                                    onPress={() => setSelectedMonth(i + 1)}
                                >
                                    <Text style={[pickerStyles.itemText, selectedMonth === i + 1 && pickerStyles.itemTextSelected]} allowFontScaling={false}>{m}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <ScrollView style={pickerStyles.column} showsVerticalScrollIndicator={false}>
                            {days.map((d) => (
                                <TouchableOpacity
                                    key={d}
                                    style={[pickerStyles.item, selectedDay === d && pickerStyles.itemSelected]}
                                    onPress={() => setSelectedDay(d)}
                                >
                                    <Text style={[pickerStyles.itemText, selectedDay === d && pickerStyles.itemTextSelected]} allowFontScaling={false}>{d}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <ScrollView style={pickerStyles.column} showsVerticalScrollIndicator={false}>
                            {years.map((y) => (
                                <TouchableOpacity
                                    key={y}
                                    style={[pickerStyles.item, selectedYear === y && pickerStyles.itemSelected]}
                                    onPress={() => setSelectedYear(y)}
                                >
                                    <Text style={[pickerStyles.itemText, selectedYear === y && pickerStyles.itemTextSelected]} allowFontScaling={false}>{y}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const pickerStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    container: { backgroundColor: WME.colors.panel, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: WME.colors.border },
    cancelText: { color: WME.colors.textMuted, fontSize: 16 },
    title: { fontSize: 12, fontWeight: '500', color: WME.colors.textDim, letterSpacing: 2 },
    doneText: { color: WME.colors.text, fontSize: 16, fontWeight: '600' },
    pickersRow: { flexDirection: 'row', height: 200 },
    column: { flex: 1 },
    item: { paddingVertical: 12, alignItems: 'center' },
    itemSelected: { backgroundColor: WME.colors.hover },
    itemText: { fontSize: 18, color: WME.colors.textMuted },
    itemTextSelected: { color: WME.colors.text, fontWeight: '600' },
});

export const QuestionRenderer: React.FC<Props> = ({ question, value, onChange }) => {
    const [showDatePicker, setShowDatePicker] = useState(false);

    const options = React.useMemo(() => {
        if (!question.optionsJson) return [];
        try {
            return typeof question.optionsJson === 'string'
                ? JSON.parse(question.optionsJson)
                : question.optionsJson;
        } catch (e) {
            return [];
        }
    }, [question.optionsJson]);

    const handleDateTextChange = (text: string) => {
        const formatted = formatDateInput(text);
        onChange(formatted);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label} allowFontScaling={false}>{question.prompt.toUpperCase()}</Text>
            {question.required && <Text style={styles.required} allowFontScaling={false}>*</Text>}

            {question.helpText && (
                <Text style={styles.helpText} allowFontScaling={false}>{question.helpText}</Text>
            )}

            {question.type === 'SHORT_TEXT' && (
                <TextInput
                    style={styles.input}
                    value={String(value || '')}
                    onChangeText={onChange}
                    placeholder="Enter text..."
                    placeholderTextColor={WME.colors.textDim}
                    allowFontScaling={false}
                />
            )}

            {question.type === 'LONG_TEXT' && (
                <View style={styles.textAreaContainer}>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={String(value || '')}
                        onChangeText={onChange}
                        placeholder="Enter details..."
                        placeholderTextColor={WME.colors.textDim}
                        multiline
                        numberOfLines={10}
                        scrollEnabled={true}
                        textAlignVertical="top"
                        allowFontScaling={false}
                    />
                </View>
            )}

            {question.type === 'NUMBER' && (
                <TextInput
                    style={styles.input}
                    value={String(value || '')}
                    onChangeText={onChange}
                    placeholder="0"
                    placeholderTextColor={WME.colors.textDim}
                    keyboardType="numeric"
                    allowFontScaling={false}
                />
            )}

            {question.type === 'DATE' && (
                <View style={styles.dateContainer}>
                    <TextInput
                        style={[styles.input, styles.dateInput]}
                        value={String(value || '')}
                        onChangeText={handleDateTextChange}
                        placeholder="MM/DD/YYYY"
                        placeholderTextColor={WME.colors.textDim}
                        keyboardType="number-pad"
                        maxLength={10}
                        allowFontScaling={false}
                    />
                    <TouchableOpacity
                        style={styles.calendarButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar" size={20} color={WME.colors.text} />
                    </TouchableOpacity>

                    <SimpleDatePicker
                        visible={showDatePicker}
                        onClose={() => setShowDatePicker(false)}
                        onSelect={onChange}
                        initialValue={value || ''}
                    />
                </View>
            )}

            {question.type === 'SINGLE_SELECT' && (
                <View style={styles.options}>
                    {options.map((opt: string) => (
                        <TouchableOpacity
                            key={opt}
                            style={[styles.option, value === opt && styles.optionSelected]}
                            onPress={() => onChange(opt)}
                        >
                            <Text style={[styles.optionText, value === opt && styles.optionTextSelected]} allowFontScaling={false}>
                                {opt}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
        backgroundColor: WME.colors.panel,
        borderRadius: WME.radius.md,
        padding: 20,
        borderWidth: 1,
        borderColor: WME.colors.border,
    },
    label: {
        fontSize: 10,
        fontWeight: '500',
        color: WME.colors.textDim,
        letterSpacing: 2,
        marginBottom: 12,
    },
    required: {
        color: WME.colors.error,
        position: 'absolute',
        top: 20,
        right: 20,
    },
    input: {
        backgroundColor: WME.colors.base,
        borderWidth: 1,
        borderColor: WME.colors.border,
        borderRadius: WME.radius.sm,
        padding: 16,
        fontSize: 16,
        color: WME.colors.text,
    },
    textAreaContainer: {
        height: 180,
    },
    textArea: {
        flex: 1,
        textAlignVertical: 'top',
        paddingTop: 16,
    },
    options: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    option: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: WME.colors.border,
        borderRadius: WME.radius.full,
        backgroundColor: WME.colors.base,
    },
    optionSelected: {
        backgroundColor: WME.colors.text,
        borderColor: WME.colors.text,
    },
    optionText: {
        color: WME.colors.textMuted,
        fontSize: 13,
        fontWeight: '500',
    },
    optionTextSelected: {
        color: WME.colors.base,
        fontWeight: '600',
    },
    helpText: {
        fontSize: 13,
        color: WME.colors.textMuted,
        marginBottom: 12,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateInput: {
        flex: 1,
    },
    calendarButton: {
        marginLeft: 12,
        width: 48,
        height: 48,
        borderRadius: WME.radius.sm,
        backgroundColor: WME.colors.base,
        borderWidth: 1,
        borderColor: WME.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
