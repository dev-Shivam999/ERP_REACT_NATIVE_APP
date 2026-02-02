import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { attendanceAPI } from '../services/api';

const MarkAttendance = ({ navigation, route }) => {
    const [selectedClass, setSelectedClass] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isMarked, setIsMarked] = useState(false);
    const [teacherClasses, setTeacherClasses] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        fetchTeacherClasses();
    }, []);

    const fetchTeacherClasses = async () => {
        try {
            setLoading(true);
            const response = await attendanceAPI.getTeacherClasses({ forAttendance: true });
            if (response.data.success) {
                setTeacherClasses(response.data.data);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch classes');
        } finally {
            setLoading(false);
        }
    };

    const handleClassSelect = async (cls) => {
        setSelectedClass(cls);
        await fetchStudents(cls.class_id, cls.section_id);
    };

    const fetchStudents = async (classId, sectionId) => {
        try {
            setLoading(true);
            const formattedDate = selectedDate.toISOString().split('T')[0];
            const response = await attendanceAPI.getClassAttendance(classId, sectionId, formattedDate);

            if (response.data.success) {
                const studentsData = response.data.data.students;
                setStudents(studentsData);
                setIsMarked(response.data.data.isMarked);

                const attendanceState = {};
                studentsData.forEach(student => {
                    attendanceState[student.student_id] = student.status || 'unmarked';
                });
                setAttendance(attendanceState);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch students');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const toggleAttendance = (studentId) => {
        setAttendance(prev => {
            const currentStatus = prev[studentId];
            let newStatus;

            // Handle null/undefined (initial state) -> treat as whatever the UI shows (user made it show Late, but let's cycle to Present)
            // User flow seems to be: Default(Late?) -> Present -> Absent -> Late

            if (!currentStatus || currentStatus === 'late') newStatus = 'present';
            else if (currentStatus === 'present') newStatus = 'absent';
            else if (currentStatus === 'absent') newStatus = 'late';
            else newStatus = 'present';

            return { ...prev, [studentId]: newStatus };
        });
    };

    const markAllPresent = () => {
        const all = {};
        students.forEach(s => all[s.student_id] = 'present');
        setAttendance(all);
    };

    const markAllAbsent = () => {
        const all = {};
        students.forEach(s => all[s.student_id] = 'absent');
        setAttendance(all);
    };

    const submitAttendance = async () => {
        try {
            // Check if any student is unmarked
            const unmarkedCount = Object.values(attendance).filter(v => v === 'unmarked').length;
            if (unmarkedCount > 0) {
                Alert.alert(
                    '⚠️ Unmarked Students',
                    `You have ${unmarkedCount} students with unmarked attendance. They will not be saved. Continue?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Submit Anyway', onPress: () => processSubmission() }
                    ]
                );
                return;
            }

            await processSubmission();

        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to save attendance');
        }
    };

    const processSubmission = async () => {
        setSaving(true);
        try {
            const formattedDate = selectedDate.toISOString().split('T')[0];

            // Filter out 'unmarked' students or send them? 
            // Better to only send marked ones, OR backend handles ignoring them.
            // Let's send only marked ones to clean up data.
            const attendanceData = students
                .filter(s => attendance[s.student_id] !== 'unmarked')
                .map(student => ({
                    student_id: student.student_id,
                    status: attendance[student.student_id],
                    remarks: ''
                }));

            if (attendanceData.length === 0) {
                Alert.alert('Error', 'No attendance marked');
                setSaving(false);
                return;
            }

            const response = await attendanceAPI.markAttendance({
                classId: selectedClass.class_id,
                sectionId: selectedClass.section_id,
                date: formattedDate,
                attendance: attendanceData
            });

            if (response.data.success) {
                const presentCount = Object.values(attendance).filter(v => v === 'present').length;
                const absentCount = Object.values(attendance).filter(v => v === 'absent').length;
                const lateCount = Object.values(attendance).filter(v => v === 'late').length;

                Alert.alert(
                    '✅ Attendance Submitted',
                    `Present: ${presentCount} | Absent: ${absentCount} | Late: ${lateCount}\n\nNotifications sent.`,
                    [{ text: 'OK' }]
                );
                setIsMarked(true);
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    const onRefresh = () => {
        if (selectedClass) {
            setRefreshing(true);
            fetchStudents(selectedClass.class_id, selectedClass.section_id);
        } else {
            setRefreshing(true);
            fetchTeacherClasses().then(() => setRefreshing(false));
        }
    };

    const isToday = (date) => {
        const d = new Date(date);
        const today = new Date();
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    };

    const isEditable = isToday(selectedDate);

    const onDateChange = (event, date) => {
        setShowDatePicker(false);
        if (date) {
            setSelectedDate(date);
            if (selectedClass) {
                const formattedDate = date.toISOString().split('T')[0];
                attendanceAPI.getClassAttendance(selectedClass.class_id, selectedClass.section_id, formattedDate)
                    .then(response => {
                        if (response.data.success) {
                            const studentsData = response.data.data.students;
                            setStudents(studentsData);
                            setIsMarked(response.data.data.isMarked);
                            const attendanceState = {};
                            studentsData.forEach(student => {
                                // Default to 'present' if no status found (new date)
                                attendanceState[student.student_id] = student.status
                            });
                            setAttendance(attendanceState);
                        }
                    });
            }
        }
    };

    const renderDatePicker = () => {
        if (Platform.OS === 'web') {
            return (
                <View style={styles.webDatePickerContainer}>
                    <Text style={styles.webDatePickerLabel}>Select Date:</Text>
                    <input
                        type="date"
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={(e) => {
                            if (e.target.value) {
                                const newDate = new Date(e.target.value);
                                if (!isNaN(newDate.getTime())) {
                                    onDateChange(null, newDate);
                                }
                            }
                        }}
                        style={{
                            padding: 10,
                            borderRadius: 8,
                            border: '1px solid #ccc',
                            fontSize: 16,
                            fontFamily: 'inherit'
                        }}
                        max={new Date().toISOString().split('T')[0]}
                    />
                </View>
            );
        }

        if (!showDatePicker) return null;
        return (
            <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}
            />
        );
    };

    if (loading && !selectedClass) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.loadingText}>Loading classes...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {!selectedClass ? (
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Select Class</Text>
                        {Platform.OS !== 'web' && (
                            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateSelector}>
                                <Text style={styles.dateText}>
                                    {selectedDate.toLocaleDateString('en-IN', {
                                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                                    })} 📅
                                </Text>
                            </TouchableOpacity>
                        )}
                        {Platform.OS === 'web' && renderDatePicker()}
                    </View>

                    <ScrollView
                        style={styles.classList}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    >
                        {teacherClasses.length > 0 ? (
                            teacherClasses.map((cls) => (
                                <TouchableOpacity
                                    key={`${cls.class_id}-${cls.section_id}`}
                                    style={styles.classCard}
                                    onPress={() => handleClassSelect(cls)}
                                >
                                    <View>
                                        <Text style={styles.className}>{cls.class_name} - {cls.section_name}</Text>
                                        <Text style={styles.studentCount}>{cls.student_count || 0} students</Text>
                                        <Text style={styles.subjectText}>Subject: {cls.subject_name}</Text>
                                    </View>
                                    <Text style={styles.arrow}>→</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.noClassesContainer}>
                                <Text style={styles.noClassesText}>No classes assigned</Text>
                                <Text style={styles.noClassesSubtext}>Contact admin to assign classes</Text>
                            </View>
                        )}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                    {Platform.OS !== 'web' && renderDatePicker()}
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => setSelectedClass(null)}
                        >
                            <Text style={styles.backText}>← Back</Text>
                        </TouchableOpacity>
                        <View style={styles.headerInfo}>
                            <Text style={styles.headerClass}>{selectedClass.class_name} - {selectedClass.section_name}</Text>
                            {Platform.OS !== 'web' ? (
                                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                                    <Text style={styles.headerDate}>{selectedDate.toLocaleDateString('en-IN')} 📅</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={{ marginTop: 8 }}>
                                    {renderDatePicker()}
                                </View>
                            )}
                            {!isEditable && (
                                <View style={[styles.markedBadge, { backgroundColor: '#64748b' }]}>
                                    <Text style={styles.markedText}>Read Only</Text>
                                </View>
                            )}
                            {isEditable && isMarked && (
                                <View style={styles.markedBadge}>
                                    <Text style={styles.markedText}>✓ Saved</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Quick Actions - Only if Editable */}
                    {isEditable && (
                        <View style={styles.quickActions}>
                            <TouchableOpacity style={styles.actionBtn} onPress={markAllPresent}>
                                <Text style={styles.actionText}>✓ All Present</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, styles.absentBtn]} onPress={markAllAbsent}>
                                <Text style={styles.actionText}>✗ All Absent</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Students List - Table Style */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, { width: 40 }]}>Roll</Text>
                        <Text style={[styles.headerCell, { flex: 1 }]}>Student Name</Text>
                        <Text style={[styles.headerCell, { width: 100, textAlign: 'center' }]}>Status</Text>
                    </View>
                    <ScrollView
                        style={styles.studentList}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    >
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#4f46e5" />
                                <Text style={styles.loadingText}>Loading students...</Text>
                            </View>
                        ) : (
                            students.map((student, index) => (
                                <View key={student.student_id} style={styles.tableRow}>
                                    <View style={styles.rollCell}>
                                        <Text style={styles.rollTextTable}>{student.roll_number || (index + 1)}</Text>
                                    </View>

                                    <View style={styles.nameCell}>
                                        <Text style={styles.nameText}>{student.first_name} {student.last_name}</Text>
                                        <Text style={styles.admText}>{student.admission_number}</Text>
                                    </View>

                                    <TouchableOpacity
                                        style={[
                                            styles.statusButton,
                                            attendance[student.student_id] === 'present'
                                                ? styles.statusPresent
                                                : attendance[student.student_id] === 'late'
                                                    ? styles.statusLate
                                                    : styles.statusAbsent,
                                            !isEditable && { opacity: 0.7 }
                                        ]}
                                        onPress={() => isEditable && toggleAttendance(student.student_id)}
                                        disabled={!isEditable}
                                    >
                                        <Text style={[
                                            styles.statusButtonText,
                                            attendance[student.student_id] === 'present'
                                                ? styles.textPresent
                                                : (attendance[student.student_id] === 'late' || attendance[student.student_id] == null)
                                                    ? styles.textLate
                                                    : styles.textAbsent
                                        ]}>
                                            {attendance[student.student_id] === 'present'
                                                ? 'Present'
                                                : (attendance[student.student_id] === 'late' || attendance[student.student_id] == null)
                                                    ? 'Late'
                                                    : 'Absent'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                        <View style={{ height: 20 }} />
                    </ScrollView>

                    {/* {renderDatePicker()} */}

                    {/* Submit Button - Only if Editable */}
                    {isEditable && (
                        <View style={styles.footer}>
                            <View style={styles.summary}>
                                <Text style={styles.summaryText}>
                                    <Text style={{ color: '#16a34a' }}>P: {Object.values(attendance).filter(v => v === 'present').length}</Text>
                                    {' '}|{' '}
                                    <Text style={{ color: '#dc2626' }}>A: {Object.values(attendance).filter(v => v === 'absent').length}</Text>
                                    {' '}|{' '}
                                    <Text style={{ color: '#d97706' }}>L: {Object.values(attendance).filter(v => v === 'late').length}</Text>
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.submitBtn, saving && styles.savingBtn]}
                                onPress={submitAttendance}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitText}>
                                        {isMarked ? 'Update Attendance' : 'Submit Attendance'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )
            }
        </View >
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#64748b',
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
    },
    dateSelector: {
        padding: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
    },
    dateText: {
        fontSize: 14,
        color: '#4f46e5',
        fontWeight: '600',
    },
    classList: {
        padding: 16,
    },
    classCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    className: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
    },
    studentCount: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    subjectText: {
        fontSize: 12,
        color: '#4f46e5',
        marginTop: 2,
        fontWeight: '500',
    },
    arrow: {
        fontSize: 24,
        color: '#9ca3af',
    },
    noClassesContainer: {
        alignItems: 'center',
        padding: 40,
    },
    noClassesText: {
        fontSize: 18,
        color: '#6b7280',
        fontWeight: '600',
    },
    noClassesSubtext: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
    },
    backButton: {
        marginRight: 16,
    },
    backText: {
        fontSize: 16,
        color: '#4f46e5',
        fontWeight: '600',
    },
    headerInfo: {
        flex: 1,
    },
    headerClass: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
    },
    headerDate: {
        fontSize: 13,
        color: '#4f46e5',
        marginTop: 2,
        fontWeight: '500'
    },
    markedBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#10b981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    markedText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    quickActions: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        backgroundColor: '#10b981',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    absentBtn: {
        backgroundColor: '#ef4444',
    },
    actionText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f1f5f9',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerCell: {
        fontWeight: '700',
        color: '#64748b',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    rollCell: {
        width: 40,
        justifyContent: 'center',
    },
    rollTextTable: {
        fontWeight: '700',
        color: '#1e293b',
        fontSize: 14,
    },
    nameCell: {
        flex: 1,
        justifyContent: 'center',
    },
    nameText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0f172a',
    },
    admText: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    },
    statusButton: {
        width: 100,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    statusPresent: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: '#10b981',
    },
    statusAbsent: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: '#ef4444',
    },
    statusLate: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: '#f59e0b',
    },
    statusUnmarked: {
        backgroundColor: '#f1f5f9',
        borderColor: '#cbd5e1',
    },
    statusButtonText: {
        fontWeight: '700',
        fontSize: 13,
    },
    textPresent: { color: '#10b981' },
    textAbsent: { color: '#ef4444' },
    textLate: { color: '#f59e0b' },
    textUnmarked: { color: '#64748b' },

    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        gap: 12,
    },
    summary: {
        flex: 1,
    },
    summaryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    submitBtn: {
        backgroundColor: '#4f46e5',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    savingBtn: {
        opacity: 0.7,
    },
    submitText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default MarkAttendance;
