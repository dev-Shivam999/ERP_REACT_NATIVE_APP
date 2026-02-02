import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { studentAPI, authAPI } from '../services/api';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const StudentDashboard = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const [stats, setStats] = useState({
        attendancePercent: 0,
        presentDays: 0,
        totalDays: 0,
        pendingFees: 0,
        homeworkTotal: 0,
        homeworkCompleted: 0,
    });

    const [notifications, setNotifications] = useState([]);
    const [profile, setProfile] = useState(null);
    const [hasFcmToken, setHasFcmToken] = useState(true); // Assume true initially to avoid flash

    useEffect(() => {
        loadUser();
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            console.log('📊 Fetching dashboard data...');

            // Check FCM token status - update bell icon state
            try {
                const fcmCheckRes = await authAPI.checkFcmToken();
                if (fcmCheckRes.data.success) {
                    const hasToken = fcmCheckRes.data.data.hasToken;
                    setHasFcmToken(hasToken);
                    console.log('🔔 FCM Token status:', hasToken);

                    // Auto-request permission if token is missing
                    if (!hasToken) {
                        requestNotificationPermission();
                    }
                }
            } catch (fcmError) {
                console.error('FCM token check failed:', fcmError);
            }

            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            const promises = [
                studentAPI.getFees(),
                studentAPI.getProfile(),
                studentAPI.getMyHomework(30), // Use new /homework/me endpoint
                studentAPI.getAttendance(currentMonth, currentYear),
                studentAPI.getNotifications(),
            ];

            const results = await Promise.all(promises);
            const [feeRes, profileRes, homeworkRes, attendanceRes, notifRes] = results;

            console.log('💰 Fee response:', feeRes.data);
            console.log('👤 Profile response:', profileRes.data);
            console.log('📚 Homework response:', homeworkRes.data);
            console.log('📅 Attendance response:', attendanceRes.data);

            if (feeRes.data.success) {
                setStats(prev => ({ ...prev, pendingFees: feeRes.data.data.totals.totalPending }));
            }

            if (profileRes.data.success) {
                setProfile(profileRes.data.data);
            }

            console.log('📚 Homework check:', {
                hasResponse: !!homeworkRes,
                success: homeworkRes?.data?.success,
                hasStats: !!homeworkRes?.data?.stats,
                stats: homeworkRes?.data?.stats,
                dataLength: homeworkRes?.data?.data?.length
            });

            if (homeworkRes && homeworkRes.data.success && homeworkRes.data.stats) {
                console.log('✅ Setting homework stats:', homeworkRes.data.stats);
                setStats(prev => ({
                    ...prev,
                    homeworkTotal: homeworkRes.data.stats.total,
                    homeworkCompleted: homeworkRes.data.stats.completed
                }));
            } else {
                console.log('❌ Homework stats not found in response');
            }

            if (attendanceRes && attendanceRes.data.success && attendanceRes.data.data.statistics) {
                const attStats = attendanceRes.data.data.statistics;
                setStats(prev => ({
                    ...prev,
                    attendancePercent: attStats.percentage || 0,
                    presentDays: attStats.present || 0,
                    totalDays: attStats.total || 0
                }));
            }

            if (notifRes && notifRes.data.success) {
                console.log('🔔 Notifications loaded:', notifRes.data.data.length);
                setNotifications(notifRes.data.data);
            }

            console.log('✅ Dashboard data loaded');
        } catch (error) {
            console.error('❌ Fetch dashboard data error:', error);
        }
    };

    const loadUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1500);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'fee': return '💰';
            case 'homework': return '📚';
            case 'result': return '📊';
            default: return '🔔';
        }
    };

    // Request notification permission and store FCM token
    const requestNotificationPermission = async () => {
        try {
            if (!Device.isDevice) {
                Alert.alert('Notice', 'Push notifications require a physical device');
                return;
            }

            // Check if running in Expo Go (push notifications don't work there)
            const isExpoGo = !Device.isDevice || (await Notifications.getExpoPushTokenAsync({ projectId: 'fecfe46d-66db-4612-8920-5285a69e0d1c' }).catch(() => null)) === null;

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please enable notifications to receive important updates about exams, homework, and announcements.',
                    [{ text: 'OK' }]
                );
                return;
            }

            // Get the token
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: 'fecfe46d-66db-4612-8920-5285a69e0d1c',
            });

            const expoPushToken = tokenData.data;
            console.log('Expo Push Token:', expoPushToken);

            // Send token to server
            const response = await authAPI.updateFcmToken(expoPushToken);

            if (response.data.success) {
                setHasFcmToken(true);
                Alert.alert('Success', 'Notifications enabled successfully!');
            } else {
                Alert.alert('Error', 'Failed to enable notifications. Please try again.');
            }
        } catch (error) {
            console.error('Register push notification error:', error);
            // Check if it's the Expo Go limitation error
            if (error.message?.includes('expo-notifications') || error.message?.includes('Expo Go')) {
                Alert.alert(
                    'Expo Go Limitation',
                    'Push notifications are not available in Expo Go. They will work in your production build (EAS).',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Error', 'Failed to enable notifications. Please try again.');
            }
        }
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Header with Notification Bell */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Dashboard</Text>
                <TouchableOpacity
                    style={styles.bellButton}
                    onPress={hasFcmToken ? null : requestNotificationPermission}
                    disabled={hasFcmToken}
                >
                    <Text style={styles.bellIcon}>{hasFcmToken ? '🔔' : '🔕'}</Text>
                    {!hasFcmToken && <View style={styles.bellBadge} />}
                </TouchableOpacity>
            </View>

            {/* Welcome Card */}
            <View style={styles.welcomeCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>R</Text>
                </View>
                <View>
                    <Text style={styles.welcome}>Welcome Back! 👋</Text>
                    <Text style={styles.studentName}>
                        {profile ? `${profile.first_name} ${profile.last_name || ''}` : (user?.profile?.firstName || 'Student')}
                    </Text>
                    <Text style={styles.classInfo}>
                        {profile ? `${profile.class_name} - ${profile.section_name} | Roll: ${profile.roll_number || 'N/A'}` : 'Loading...'}
                    </Text>
                </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <TouchableOpacity style={[styles.statCard, styles.statAttendance]} onPress={() => navigation.navigate('Attendance')}>
                    <Text style={styles.statIcon}>📋</Text>
                    <Text style={styles.statValue}>{stats.attendancePercent}%</Text>
                    <Text style={styles.statLabel}>Attendance</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.statCard, styles.statFees]} onPress={() => navigation.navigate('Fees')}>
                    <Text style={styles.statIcon}>💰</Text>
                    <Text style={styles.statValue}>₹{stats.pendingFees}</Text>
                    <Text style={styles.statLabel}>Pending Fees</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.statCard, styles.statHomework]} onPress={() => navigation.navigate('StudentHomework')}>
                    <Text style={styles.statIcon}>📚</Text>
                    <Text style={styles.statValue}>{stats.homeworkTotal}</Text>
                    <Text style={styles.statLabel}>Total Homework</Text>
                </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ActiveExams')}>
                    <Text style={styles.actionIcon}>📝</Text>
                    <Text style={styles.actionText}>Exams</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Teachers')}>
                    <Text style={styles.actionIcon}>👨‍🏫</Text>
                    <Text style={styles.actionText}>Teachers</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('StudentHomework')}>
                    <Text style={styles.actionIcon}>📖</Text>
                    <Text style={styles.actionText}>Homework</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Results')}>
                    <Text style={styles.actionIcon}>📊</Text>
                    <Text style={styles.actionText}>Results</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Holidays')}>
                    <Text style={styles.actionIcon}>🏖️</Text>
                    <Text style={styles.actionText}>Holidays</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('CertificateRequest')}>
                    <Text style={styles.actionIcon}>📄</Text>
                    <Text style={styles.actionText}>Certificates</Text>
                </TouchableOpacity>
            </View>

            {/* Notifications */}
            <Text style={styles.sectionTitle}>Recent Updates</Text>
            <View style={styles.notifications}>
                {notifications.map((notif) => (
                    <TouchableOpacity key={notif.id} style={styles.notifCard}>
                        <Text style={styles.notifIcon}>{getNotificationIcon(notif.type)}</Text>
                        <View style={styles.notifContent}>
                            <Text style={styles.notifTitle}>{notif.title}</Text>
                            <Text style={styles.notifMessage}>{notif.message}</Text>
                            <Text style={styles.notifTime}>{notif.time}</Text>
                        </View>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1f2937',
    },
    bellButton: {
        position: 'relative',
        padding: 8,
    },
    bellIcon: {
        fontSize: 28,
    },
    bellBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ef4444',
    },
    welcomeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4f46e5',
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
    studentName: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '700',
    },
    classInfo: {
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
    statAttendance: { backgroundColor: '#ecfdf5' },
    statFees: { backgroundColor: '#fef3c7' },
    statResults: { backgroundColor: '#ede9fe' },
    statRank: { backgroundColor: '#fce7f3' },
    statHomework: { backgroundColor: '#dbeafe' },
    statIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
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
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 12,
    },
    actionButton: {
        width: '47%', // Fits 2 in a row with gap
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
        fontSize: 12,
        color: '#4b5563',
        fontWeight: '500',
    },
    notifications: {
        paddingHorizontal: 16,
    },
    notifCard: {
        flexDirection: 'row',
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
    notifIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    notifContent: {
        flex: 1,
    },
    notifTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
    },
    notifMessage: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    notifTime: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
    },
});

export default StudentDashboard;
