import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { studentAPI } from '../services/api';

const StudentHomework = ({ navigation }) => {
    const [homework, setHomework] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, percentage: 0 });

    useEffect(() => {
        fetchHomework();
    }, []);

    const fetchHomework = async () => {
        try {
            console.log('📚 Fetching homework...');
            // Get current month's homework (from month start to today)
            const today = new Date();
            const daysFromMonthStart = today.getDate();

            console.log('📅 Days from month start:', daysFromMonthStart);
            const response = await studentAPI.getMyHomework(daysFromMonthStart);
            console.log('✅ Homework API Response:', response.data);

            if (response.data.success) {
                console.log('✅ Homework data count:', response.data.data.length);
                setHomework(response.data.data);
                if (response.data.stats) {
                    console.log('📊 Stats:', response.data.stats);
                    setStats(response.data.stats);
                }
            }
        } catch (error) {
            console.error('❌ Fetch homework error:', error);

            // Check if error is because student not found
            if (error.response?.data?.needsLogin) {
                console.log('🔓 Student not found, redirecting to login');
                // Clear user data and navigate to login
                await AsyncStorage.removeItem('user');
                await AsyncStorage.removeItem('token');
                navigation.replace('Login');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchHomework();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return '#22c55e';
            case 'pending': return '#ef4444';
            case 'submitted': return '#3b82f6';
            default: return '#94a3b8';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return '✓';
            case 'pending': return '○';
            case 'submitted': return '◉';
            default: return '○';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const dateStr = date.toDateString();
        const todayStr = today.toDateString();
        const yesterdayStr = yesterday.toDateString();

        if (dateStr === todayStr) return 'Today';
        if (dateStr === yesterdayStr) return 'Yesterday';

        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const groupByDate = () => {
        const grouped = {};
        homework.forEach(hw => {
            const dateKey = new Date(hw.due_date).toDateString();
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(hw);
        });

        // Sort dates in descending order
        return Object.keys(grouped)
            .sort((a, b) => new Date(b) - new Date(a))
            .map(dateKey => ({
                date: dateKey,
                items: grouped[dateKey]
            }));
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    const groupedData = groupByDate();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Homework</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.percentage}%</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats.completed}</Text>
                    <Text style={styles.statLabel}>Done</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.pending}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {groupedData.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>📚</Text>
                        <Text style={styles.emptyTitle}>No Homework This Month</Text>
                        <Text style={styles.emptySubtext}>You're all caught up!</Text>
                    </View>
                ) : (
                    groupedData.map((group, index) => (
                        <View key={index} style={styles.dateGroup}>
                            <View style={styles.dateHeader}>
                                <Text style={styles.dateLabel}>{formatDate(group.date)}</Text>
                                <Text style={styles.dateCount}>{group.items.length} item{group.items.length > 1 ? 's' : ''}</Text>
                            </View>

                            {group.items.map((item) => (
                                <View key={item.id} style={styles.homeworkCard}>
                                    <View style={[styles.statusBar, { backgroundColor: getStatusColor(item.status) }]} />
                                    <View style={styles.cardContent}>
                                        <View style={styles.cardHeader}>
                                            <View style={styles.subjectBadge}>
                                                <Text style={styles.subjectText}>{item.subject_name}</Text>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                                    {getStatusIcon(item.status)} {item.status.toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={styles.hwTitle}>{item.title}</Text>
                                        <Text style={styles.hwDescription} numberOfLines={2}>{item.description}</Text>

                                        <View style={styles.hwFooter}>
                                            <Text style={styles.teacherName}>👤 {item.teacher_name}</Text>
                                            <Text style={styles.dueDate}>Due: {new Date(item.due_date).toLocaleDateString()}</Text>
                                        </View>

                                        {item.remarks && (
                                            <View style={styles.remarksBox}>
                                                <Text style={styles.remarksLabel}>💬 Teacher's Remark:</Text>
                                                <Text style={styles.remarksText}>{item.remarks}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    ))
                )}

                <View style={{ height: 24 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: { marginRight: 16 },
    backText: { fontSize: 16, color: '#4f46e5', fontWeight: '600' },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
    scrollView: { flex: 1 },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: '700', color: '#4f46e5' },
    statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
    statDivider: { width: 1, backgroundColor: '#e2e8f0', marginHorizontal: 12 },
    dateGroup: { marginBottom: 24 },
    dateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f1f5f9',
    },
    dateLabel: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
    dateCount: { fontSize: 12, color: '#64748b' },
    homeworkCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    statusBar: { width: 4 },
    cardContent: { flex: 1, padding: 12 },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    subjectBadge: {
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    subjectText: { fontSize: 12, fontWeight: '600', color: '#4f46e5' },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: { fontSize: 10, fontWeight: '700' },
    hwTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
    hwDescription: { fontSize: 13, color: '#6b7280', lineHeight: 18, marginBottom: 8 },
    hwFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    teacherName: { fontSize: 12, color: '#64748b' },
    dueDate: { fontSize: 12, color: '#ef4444', fontWeight: '500' },
    remarksBox: {
        marginTop: 8,
        padding: 8,
        backgroundColor: '#fefce8',
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#f59e0b',
    },
    remarksLabel: { fontSize: 11, fontWeight: '600', color: '#92400e' },
    remarksText: { fontSize: 12, color: '#78350f', marginTop: 2 },
    emptyContainer: { alignItems: 'center', padding: 60 },
    emptyText: { fontSize: 64, marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
    emptySubtext: { fontSize: 14, color: '#9ca3af' },
});

export default StudentHomework;
