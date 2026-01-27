import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform,
    ActivityIndicator,
    KeyboardAvoidingView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { teacherAPI } from '../services/api';
import api from '../services/api';

const AddHomework = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState([]);

    const [selectedClassIndex, setSelectedClassIndex] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dueDate, setDueDate] = useState(new Date());

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await teacherAPI.getClasses();
            if (response.data.success) {
                setClasses(response.data.data);
                if (response.data.data.length > 0) {
                    setSelectedClassIndex(0); // Default first class
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch classes');
        }
    };

    // Handle class change
    useEffect(() => {
        if (selectedClassIndex !== null && classes.length > 0) {
            const cls = classes[selectedClassIndex];

            // If the selected class object already has a specific subject (Regular Teacher)
            if (cls.subject_id) {
                setAvailableSubjects([{ id: cls.subject_id, name: cls.subject_name }]);
                setSelectedSubject(cls.subject_id);
            } else {
                // Determine if we need to fetch subjects (Senior Teacher/All Subjects)
                // For now, if subject_name says "All Subjects" or just no subject_id
                fetchSubjectsForClass(cls.class_id);
            }
        }
    }, [selectedClassIndex, classes]);

    const fetchSubjectsForClass = async (classId) => {
        try {
            setLoadingSubjects(true);
            setAvailableSubjects([]);
            // Use generic API to fetch subjects
            const response = await api.get(`/homework/subjects/${classId}`);
            if (response.data.success) {
                setAvailableSubjects(response.data.data);
                if (response.data.data.length > 0) {
                    setSelectedSubject(response.data.data[0].id);
                }
            }
        } catch (error) {
            console.error('Fetch subjects error', error);
        } finally {
            setLoadingSubjects(false);
        }
    };

    const handleCreate = async () => {
        if (selectedClassIndex === null || !title || !description || !selectedSubject) {
            Alert.alert('Error', 'Please fill all required fields, including Class and Subject.');
            return;
        }

        try {
            setLoading(true);
            const selectedClass = classes[selectedClassIndex];

            const payload = {
                classId: selectedClass.class_id,
                sectionId: selectedClass.section_id,
                subjectId: selectedSubject,
                title,
                description,
                dueDate: dueDate.toISOString().split('T')[0],
            };

            console.log('Sending Payload:', payload);

            const response = await teacherAPI.uploadHomework(payload);
            if (response.data.success) {
                Alert.alert('Success', 'Homework assigned successfully', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to assign homework');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || dueDate;
        setShowDatePicker(Platform.OS === 'ios');
        setDueDate(currentDate);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add Homework</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Select Class</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={selectedClassIndex}
                            onValueChange={(itemValue) => setSelectedClassIndex(itemValue)}
                            enabled={classes.length > 0}
                        >
                            {classes.map((cls, index) => (
                                <Picker.Item
                                    key={index}
                                    label={`${cls.class_name} - ${cls.section_name} (${cls.subject_name || 'All Subjects'})`}
                                    value={index}
                                />
                            ))}
                        </Picker>
                    </View>
                </View>

                {/* Subject Picker - especially important for Senior Teachers */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Select Subject</Text>
                    {loadingSubjects ? (
                        <ActivityIndicator size="small" color="#4f46e5" style={{ alignSelf: 'flex-start', marginVertical: 10 }} />
                    ) : (
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedSubject}
                                onValueChange={(itemValue) => setSelectedSubject(itemValue)}
                                enabled={availableSubjects.length > 0}
                            >
                                <Picker.Item label="Select Subject" value={null} />
                                {availableSubjects.map((sub) => (
                                    <Picker.Item
                                        key={sub.id}
                                        label={`${sub.name} ${sub.code ? `(${sub.code})` : ''}`}
                                        value={sub.id}
                                    />
                                ))}
                            </Picker>
                        </View>
                    )}
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Title</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g. Chapter 4 Exercises"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Detailed instructions..."
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Due Date</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.dateText}>
                            {dueDate.toLocaleDateString()}
                        </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={dueDate}
                            mode="date"
                            display="default"
                            minimumDate={new Date()}
                            onChange={onChangeDate}
                        />
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Assign Homework</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    backButton: {
        marginRight: 16,
    },
    backButtonText: {
        color: '#4f46e5',
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1f2937',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#1f2937',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    dateButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    dateText: {
        fontSize: 16,
        color: '#1f2937',
    },
    submitButton: {
        backgroundColor: '#4f46e5',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    disabledButton: {
        backgroundColor: '#a5b4fc',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default AddHomework;
