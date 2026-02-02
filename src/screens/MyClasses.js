import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { teacherAPI } from '../services/api';

const MyClasses = ({ navigation }) => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await teacherAPI.getClasses();
            if (response.data.success) {
                setClasses(response.data.data);
            }
        } catch (error) {
            console.error('Fetch classes error:', error);
            // Don't alert on first load to avoid spamming if network is slow
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchClasses();
    };

    const renderClassItem = ({ item }) => (
        <TouchableOpacity
            style={styles.classCard}
            onPress={() => navigation.navigate('MarkAttendance', { preselectedClass: item })}
        >
            <View style={styles.classHeader}>
                <View style={styles.classInfo}>
                    <Text style={styles.className}>{item.class_name} - {item.section_name}</Text>
                    <Text style={styles.subjectName}>{item.subject_name}</Text>
                </View>
                <View style={styles.studentBadge}>
                    <Text style={styles.studentCount}>{item.student_count}</Text>
                    <Text style={styles.studentLabel}>Students</Text>
                </View>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.actionButton, { marginRight: 8, backgroundColor: '#4f46e5' }]} // Adjusted style
                    onPress={() => navigation.navigate('MarkAttendance', { preselectedClass: item })}
                >
                    <Text style={styles.actionText}>Attendance</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { marginRight: 8, backgroundColor: '#8b5cf6' }]} // Purple for Homework
                    onPress={() => navigation.navigate('TeacherHomeworkList', {
                        classId: item.class_id,
                        sectionId: item.section_id,
                        className: item.class_name,
                        sectionName: item.section_name
                    })}
                >
                    <Text style={styles.actionText}>Homework</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.outlineButton]}
                    onPress={() => navigation.navigate('StudentList', {
                        classId: item.class_id,
                        sectionId: item.section_id,
                        className: item.class_name,
                        sectionName: item.section_name
                    })}
                >
                    <Text style={[styles.actionText, styles.outlineText]}>View Students</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Classes</Text>
            </View>

            <FlatList
                data={classes}
                renderItem={renderClassItem}
                keyExtractor={(item) => `${item.class_id}-${item.section_id}-${item.subject_name}`}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No classes assigned to you.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    listContent: {
        padding: 12,
        paddingTop: 16,
    },
    classCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    classHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    classInfo: {
        flex: 1,
    },
    className: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
    },
    subjectName: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
        fontWeight: '500',
    },
    studentBadge: {
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    studentCount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4f46e5',
    },
    studentLabel: {
        fontSize: 10,
        color: '#6b7280',
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 16,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#4f46e5',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    outlineText: {
        color: '#4b5563',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
    },
});

export default MyClasses;
