import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, TextInput, Modal } from 'react-native';
import { attendanceAPI } from '../services/api';

const StudentList = ({ route, navigation }) => {
    const { classId, sectionId, className, sectionName } = route.params;
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingStudent, setEditingStudent] = useState(null);
    const [newRollNumber, setNewRollNumber] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            // Reusing getClassAttendance for now as it returns the student list
            const date = new Date().toISOString().split('T')[0];
            const response = await attendanceAPI.getClassAttendance(classId, sectionId, date);
            if (response.data.success) {
                setStudents(response.data.data.students);
            }
        } catch (error) {
            console.error('Fetch students error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditRoll = (student) => {
        setEditingStudent(student);
        setNewRollNumber(student.roll_number || '');
    };

    const saveRollNumber = async () => {
        if (!newRollNumber.trim()) {
            alert('Please enter a valid roll number');
            return;
        }

        setUpdating(true);
        try {
            // Import teacherAPI dynamically if not imported, or use existing import
            const { teacherAPI } = require('../services/api');
            const response = await teacherAPI.updateRollNumber(editingStudent.student_id, newRollNumber);

            if (response.data.success) {
                // Update local state
                setStudents(prev => prev.map(s =>
                    s.student_id === editingStudent.student_id
                        ? { ...s, roll_number: newRollNumber }
                        : s
                ));
                setEditingStudent(null);
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update roll number');
        } finally {
            setUpdating(false);
        }
    };

    const renderStudent = ({ item, index }) => (
        <View style={styles.card}>
            <View style={styles.avatarContainer}>
                {item.photo_url ? (
                    <Image source={{ uri: item.photo_url }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarText}>
                            {item.first_name[0]}{item.last_name ? item.last_name[0] : ''}
                        </Text>
                    </View>
                )}
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
                <View style={styles.row}>
                    <Text style={styles.details}>Adm: {item.admission_number}</Text>
                    <TouchableOpacity
                        style={styles.editBadge}
                        onPress={() => handleEditRoll(item)}
                    >
                        <Text style={styles.editBadgeText}>
                            Roll: {item.roll_number || (index + 1)} ✎
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{className} - {sectionName}</Text>
                <Text style={styles.subtitle}>{students.length} Students</Text>
            </View>
            <FlatList
                data={students}
                renderItem={renderStudent}
                keyExtractor={item => item.student_id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>No students found</Text>}
            />

            {/* Edit Modal */}
            {editingStudent && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Roll Number</Text>
                        <Text style={styles.modalSubtitle}>
                            {editingStudent.first_name} {editingStudent.last_name}
                        </Text>

                        <TextInput
                            style={styles.input}
                            value={newRollNumber}
                            onChangeText={setNewRollNumber}
                            placeholder="Enter Roll Number"
                            keyboardType="numeric"
                            autoFocus
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.btn, styles.cancelBtn]}
                                onPress={() => setEditingStudent(null)}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btn, styles.saveBtn]}
                                onPress={saveRollNumber}
                                disabled={updating}
                            >
                                {updating ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
    backBtn: { marginBottom: 10 },
    backText: { color: '#4f46e5', fontSize: 16, fontWeight: '600' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
    subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
    list: { padding: 16 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    avatarContainer: { marginRight: 16 },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    avatarPlaceholder: { backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#4f46e5', fontWeight: 'bold', fontSize: 18 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    details: { fontSize: 14, color: '#64748b' },
    editBadge: { backgroundColor: '#f0f9ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#bae6fd' },
    editBadgeText: { fontSize: 13, color: '#0284c7', fontWeight: '500' },
    empty: { textAlign: 'center', marginTop: 40, color: '#94a3b8', fontSize: 16 },

    // Modal Styles
    modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', width: '100%', maxWidth: 350, borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
    modalSubtitle: { fontSize: 16, color: '#64748b', marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 24 },
    modalActions: { flexDirection: 'row', gap: 12 },
    btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
    cancelBtn: { backgroundColor: '#f1f5f9' },
    saveBtn: { backgroundColor: '#4f46e5' },
    cancelText: { color: '#64748b', fontWeight: '600', fontSize: 16 },
    saveText: { color: '#fff', fontWeight: '600', fontSize: 16 }
});

export default StudentList;
