import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Alert,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { studentAPI } from '../services/api';

const StudentHomework = ({ navigation }) => {
    const [homework, setHomework] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadUserAndHomework();
    }, []);

    const loadUserAndHomework = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                // Assuming the student object inside user or we use profile ID
                // But the API I designed expects studentId (which is likely profile.id for student role)
                // Let's assume user.profile.id is the student_id
                if (parsedUser.profile?.id) {
                    await fetchHomework(parsedUser.profile.id);
                } else {
                    // Fallback or error
                    Alert.alert('Error', 'Student profile not found');
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const fetchHomework = async (studentId) => {
        try {
            const response = await studentAPI.getHomework(studentId);
            if (response.data.success) {
                setHomework(response.data.data);
            }
        } catch (error) {
            console.error('Fetch homework error:', error);
            // Alert.alert('Error', 'Failed to fetch homework');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        if (user?.profile?.id) {
            fetchHomework(user.profile.id);
        } else {
            setRefreshing(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed': return { bg: '#dcfce7', text: '#16a34a' };
            case 'pending': return { bg: '#fee2e2', text: '#ef4444' };
            case 'submitted': return { bg: '#dbeafe', text: '#2563eb' };
            default: return { bg: '#f3f4f6', text: '#6b7280' };
        }
    };

    const renderItem = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        return (
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.subject}>{item.subject_name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>

                <View style={styles.footer}>
                    <Text style={styles.date}>Due: {new Date(item.due_date).toLocaleDateString()}</Text>
                    <Text style={styles.teacher}>By: {item.teacher_name}</Text>
                </View>

                {item.remarks && (
                    <View style={styles.remarksContainer}>
                        <Text style={styles.remarksLabel}>Teacher's Remark:</Text>
                        <Text style={styles.remarksText}>{item.remarks}</Text>
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.screenHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Homework</Text>
            </View>

            <FlatList
                data={homework}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No homework assigned yet!</Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    screenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        marginRight: 16,
    },
    backText: {
        fontSize: 16,
        color: '#4f46e5',
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    subject: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4f46e5',
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#4b5563',
        marginTop: 4,
        marginBottom: 12,
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
    },
    date: {
        fontSize: 12,
        color: '#ef4444',
        fontWeight: '500',
    },
    teacher: {
        fontSize: 12,
        color: '#6b7280',
    },
    remarksContainer: {
        marginTop: 12,
        padding: 8,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#4f46e5',
    },
    remarksLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    remarksText: {
        fontSize: 13,
        color: '#4b5563',
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
    },
});

export default StudentHomework;
