import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import api from '../services/api';

const HomeworkStatus = ({ navigation, route }) => {
    // homeworkId passed from params, or we show list of homeworks?
    // User requested "Check Homework Status". 
    // Usually teacher selects a homework first. 
    // For simplicity, let's assume we pass homework attached to a class/subject list or 
    // maybe this screen lists recent homeworks, then clicks to see student status.

    // BUT the requirement was "Teacher gives status for home working student complete or not".
    // So likely: Select Homework -> List Students -> Toggle Status.

    const [homeworkId] = useState(route.params?.homeworkId);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (homeworkId) {
            fetchStatus();
        }
    }, [homeworkId]);

    const fetchStatus = async () => {
        try {
            // Need an API to get homework status for all students
            // teacherAPI.getHomeworkStatus(homeworkId) - I need to add this to api.js if not exists
            // Or use generic api call
            const response = await api.get(`/homework/status/${homeworkId}`);
            if (response.data.success) {
                setStudents(response.data.data);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch status');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (studentId, currentStatus) => {
        let newStatus;
        switch (currentStatus) {
            case 'pending': newStatus = 'completed'; break;
            case 'completed': newStatus = 'not_completed'; break;
            case 'not_completed': newStatus = 'not_started'; break;
            case 'not_started': newStatus = 'pending'; break;
            default: newStatus = 'completed';
        }

        // Optimistic update
        setStudents(prev => prev.map(s =>
            s.student_id === studentId ? { ...s, status: newStatus } : s
        ));

        try {
            await api.post('/homework/update-status', {
                homeworkId,
                studentId,
                status: newStatus,
                remarks: newStatus === 'completed' ? 'Good' : ''
            });
        } catch (error) {
            // Revert
            setStudents(prev => prev.map(s =>
                s.student_id === studentId ? { ...s, status: currentStatus } : s
            ));
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed': return styles.completed;
            case 'not_completed': return styles.notCompleted;
            case 'not_started': return styles.notStarted;
            default: return styles.pending;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'not_completed': return 'NOT DONE';
            case 'not_started': return 'NO START';
            default: return status.toUpperCase();
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.info}>
                <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.roll}>Roll: {item.roll_number}</Text>
            </View>
            <TouchableOpacity
                style={[styles.statusBtn, getStatusStyle(item.status)]}
                onPress={() => toggleStatus(item.student_id, item.status)}
            >
                <Text style={[styles.statusText, item.status === 'pending' || item.status === 'not_started' ? { color: '#000' } : { color: '#fff' }]}>
                    {getStatusLabel(item.status)}
                </Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Homework Status</Text>
            </View>
            <FlatList
                data={students}
                renderItem={renderItem}
                keyExtractor={item => item.student_id}
                contentContainerStyle={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', elevation: 2 },
    backText: { color: '#4f46e5', fontSize: 16, marginRight: 16 },
    title: { fontSize: 20, fontWeight: 'bold' },
    list: { padding: 16 },
    card: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8
    },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '600' },
    roll: { color: 'gray' },
    statusBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, minWidth: 100, alignItems: 'center' },
    completed: { backgroundColor: '#22c55e' }, // Green
    notCompleted: { backgroundColor: '#ef4444' }, // Red
    pending: { backgroundColor: '#fcd34d' }, // Yellow
    notStarted: { backgroundColor: '#e5e7eb' }, // Grey
    statusText: { fontWeight: 'bold', fontSize: 12 }
});

export default HomeworkStatus;
