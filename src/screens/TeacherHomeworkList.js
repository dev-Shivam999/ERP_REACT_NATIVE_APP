import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { teacherAPI } from '../services/api';
import api from '../services/api';

const TeacherHomeworkList = ({ route, navigation }) => {
    const { classId, sectionId, className, sectionName } = route.params;
    const [homeworks, setHomeworks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHomeworks();
    }, []);

    const fetchHomeworks = async () => {
        try {
            // Using generic api call since teacherAPI might not have this specific method wrapper exposed yet
            const response = await api.get(`/homework/class/${classId}/${sectionId}`);
            if (response.data.success) {
                setHomeworks(response.data.data);
            }
        } catch (error) {
            console.error('Fetch homeworks error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('HomeworkStatus', { homeworkId: item.id })}
        >
            <View style={styles.header}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.date}>{new Date(item.due_date).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            <Text style={styles.meta}>Subject: {item.subject_name}</Text>
            <View style={styles.footer}>
                <Text style={styles.linkText}>View Status →</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.screenHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{className} - {sectionName}</Text>
            </View>
            <FlatList
                data={homeworks}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>No homework sent to this class.</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    screenHeader: { padding: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
    backBtn: { marginRight: 16 },
    backText: { color: '#4f46e5', fontSize: 16, fontWeight: '600' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    list: { padding: 16 },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, elevation: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    title: { fontSize: 16, fontWeight: '700', color: '#1e293b', flex: 1 },
    date: { fontSize: 12, color: '#64748b' },
    description: { fontSize: 14, color: '#475569', marginBottom: 8 },
    meta: { fontSize: 12, color: '#64748b', fontStyle: 'italic' },
    footer: { marginTop: 12, alignItems: 'flex-end' },
    linkText: { color: '#4f46e5', fontWeight: '600', fontSize: 14 },
    empty: { textAlign: 'center', marginTop: 40, color: '#94a3b8' }
});

export default TeacherHomeworkList;
