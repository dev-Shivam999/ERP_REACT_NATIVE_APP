import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { teacherAPI } from '../services/api';

const TeacherDashboard = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalClasses: 0,
        totalStudents: 0,
        todayPeriods: 0,
        leaveBalance: 0,
    });
    const [todaySchedule, setTodaySchedule] = useState([]);

    useEffect(() => {
        loadUser();
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await teacherAPI.getDashboardStats();
            if (response.data.success) {
                const data = response.data.data;
                setStats({
                    totalClasses: data.totalClasses,
                    totalStudents: data.totalStudents,
                    todayPeriods: data.todayPeriods,
                    leaveBalance: data.leaveBalance,
                });
                setTodaySchedule(data.schedule);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
        }
    };

    const pendingTasks = [
        { id: 1, task: 'Mark 6B Attendance', icon: '📋', urgent: true },
        { id: 2, task: 'Upload Unit Test Marks - 5A', icon: '📝', urgent: false },
        { id: 3, task: 'Submit Leave Application', icon: '✈️', urgent: false },
    ];

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadUser();
        fetchDashboardStats();
        setTimeout(() => setRefreshing(false), 1500);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed': return { bg: '#dcfce7', text: '#16a34a' };
            case 'current': return { bg: '#dbeafe', text: '#2563eb' };
            case 'upcoming': return { bg: '#f3f4f6', text: '#6b7280' };
            default: return { bg: '#f3f4f6', text: '#6b7280' };
        }
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Welcome Card */}
            <View style={styles.welcomeCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>T</Text>
                </View>
                <View>
                    <Text style={styles.welcome}>Good Morning! 👋</Text>
                    <Text style={styles.teacherName}>{user?.profile?.firstName || 'Teacher'}</Text>
                    <Text style={styles.designation}>Mathematics Teacher</Text>
                </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: '#ede9fe' }]}>
                    <Text style={styles.statValue}>{stats.totalClasses}</Text>
                    <Text style={styles.statLabel}>Classes</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#ecfdf5' }]}>
                    <Text style={styles.statValue}>{stats.totalStudents}</Text>
                    <Text style={styles.statLabel}>Students</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
                    <Text style={styles.statValue}>{stats.todayPeriods}</Text>
                    <Text style={styles.statLabel}>Today's Periods</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#fce7f3' }]}>
                    <Text style={styles.statValue}>{stats.leaveBalance}</Text>
                    <Text style={styles.statLabel}>Leave Balance</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('MarkAttendance')}>
                    <Text style={styles.actionIcon}>✅</Text>
                    <Text style={styles.actionText}>Mark Attendance</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AddHomework')}>
                    <Text style={styles.actionIcon}>📚</Text>
                    <Text style={styles.actionText}>Add Homework</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ActiveExams')}>
                    <Text style={styles.actionIcon}>🗓️</Text>
                    <Text style={styles.actionText}>Active Exams</Text>
                </TouchableOpacity>
                {user?.role === 'admin' && (
                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AdminCertificateRequests')}>
                        <Text style={styles.actionIcon}>📄</Text>
                        <Text style={styles.actionText}>Certificate Requests</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Salary')}>
                    <Text style={styles.actionIcon}>💰</Text>
                    <Text style={styles.actionText}>Salary Slip</Text>
                </TouchableOpacity>
            </View>

            {/* Today's Schedule */}
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <View style={styles.scheduleList}>
                {todaySchedule.map((item) => {
                    const statusStyle = getStatusStyle(item.status);
                    return (
                        <View key={item.id} style={styles.scheduleCard}>
                            <View style={[styles.periodBadge, { backgroundColor: statusStyle.bg }]}>
                                <Text style={[styles.periodText, { color: statusStyle.text }]}>P{item.period}</Text>
                            </View>
                            <View style={styles.scheduleDetails}>
                                <Text style={styles.scheduleClass}>{item.class} - {item.subject}</Text>
                                <Text style={styles.scheduleTime}>{item.time}</Text>
                            </View>
                            {item.status === 'current' && (
                                <View style={styles.liveBadge}>
                                    <Text style={styles.liveText}>🔴 LIVE</Text>
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>

            {/* Pending Tasks */}
            <Text style={styles.sectionTitle}>Pending Tasks</Text>
            <View style={styles.taskList}>
                {pendingTasks.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.taskCard}>
                        <Text style={styles.taskIcon}>{item.icon}</Text>
                        <Text style={styles.taskText}>{item.task}</Text>
                        {item.urgent && (
                            <View style={styles.urgentBadge}>
                                <Text style={styles.urgentText}>!</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <View style={{ height: 24 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    welcomeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10b981',
        margin: 16,
        padding: 20,
        borderRadius: 16,
        gap: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
    },
    welcome: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    teacherName: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '700',
    },
    designation: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginTop: 2,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        gap: 8,
    },
    statCard: {
        width: '48%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1f2937',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 12,
    },
    quickActions: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    actionIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    actionText: {
        fontSize: 11,
        color: '#4b5563',
        fontWeight: '500',
        textAlign: 'center',
    },
    scheduleList: {
        paddingHorizontal: 16,
    },
    scheduleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    periodBadge: {
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    periodText: {
        fontWeight: '700',
        fontSize: 14,
    },
    scheduleDetails: {
        flex: 1,
    },
    scheduleClass: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
    },
    scheduleTime: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 2,
    },
    liveBadge: {
        backgroundColor: '#fef2f2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    liveText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#dc2626',
    },
    taskList: {
        paddingHorizontal: 16,
    },
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    taskIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    taskText: {
        flex: 1,
        fontSize: 15,
        color: '#374151',
    },
    urgentBadge: {
        width: 24,
        height: 24,
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    urgentText: {
        color: '#dc2626',
        fontWeight: '700',
    },
});

export default TeacherDashboard;
