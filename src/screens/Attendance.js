import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { studentAPI } from '../services/api';

const Attendance = () => {
    const [loading, setLoading] = useState(true);
    const [attendance, setAttendance] = useState([]);
    const [stats, setStats] = useState({ present: 0, absent: 0, total: 0, percentage: 0 });
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAttendance();
    }, [currentMonth, currentYear]);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const response = await studentAPI.getAttendance(currentMonth, currentYear);
            console.log('📊 Attendance API Response:', response.data);
            if (response.data.success) {
                const data = response.data.data;
                setAttendance(data.attendance || []);
                // API returns 'statistics', not 'stats'
                setStats(data.statistics || { present: 0, absent: 0, total: 0, percentage: 0 });
                console.log('✅ Stats:', data.statistics);
            }
        } catch (error) {
            console.error('❌ Fetch attendance error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchAttendance();
    };

    const getMonthName = (month) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[month - 1];
    };

    const changeMonth = (direction) => {
        let newMonth = currentMonth + direction;
        let newYear = currentYear;

        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }

        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'present': return '#22c55e';
            case 'absent': return '#ef4444';
            case 'late': return '#f59e0b';
            case 'half_day': return '#3b82f6';
            case 'holiday': return '#9ca3af';
            default: return '#e5e7eb';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'present': return '✓';
            case 'absent': return '✗';
            case 'late': return '⏰';
            case 'half_day': return '½';
            case 'holiday': return '🏖';
            default: return '-';
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />}
        >
            {/* Month Selector */}
            <View style={styles.monthSelector}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthBtn}>
                    <Text style={styles.monthBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.monthText}>{getMonthName(currentMonth)} {currentYear}</Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthBtn}>
                    <Text style={styles.monthBtnText}>›</Text>
                </TouchableOpacity>
            </View>

            {/* Stats Card */}
            <View style={styles.statsCard}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{stats.percentage || 0}%</Text>
                    <Text style={styles.statLabel}>Attendance</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats.present || 0}</Text>
                    <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.absent || 0}</Text>
                    <Text style={styles.statLabel}>Absent</Text>
                </View>
            </View>

            {/* Attendance List */}
            <View style={styles.listContainer}>
                <Text style={styles.sectionTitle}>Daily Record</Text>
                {attendance.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No attendance records for this month</Text>
                    </View>
                ) : (
                    attendance.map((record, index) => (
                        <View key={index} style={styles.recordCard}>
                            <View style={styles.dateBox}>
                                <Text style={styles.dateDay}>{new Date(record.date).getDate()}</Text>
                                <Text style={styles.dateMonth}>{getMonthName(new Date(record.date).getMonth() + 1)}</Text>
                            </View>
                            <View style={styles.recordInfo}>
                                <Text style={styles.recordDate}>
                                    {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                </Text>
                                {record.remarks && (
                                    <Text style={styles.recordRemarks}>{record.remarks}</Text>
                                )}
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) }]}>
                                <Text style={styles.statusIcon}>{getStatusIcon(record.status)}</Text>
                                <Text style={styles.statusText}>{record.status}</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    monthBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthBtnText: { fontSize: 24, color: '#4f46e5', fontWeight: '600' },
    monthText: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        margin: 16,
        marginTop: 8,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statBox: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: '700', color: '#4f46e5' },
    statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
    statDivider: { width: 1, backgroundColor: '#e2e8f0', marginHorizontal: 16 },
    listContainer: { padding: 16, paddingTop: 0 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#94a3b8', fontSize: 14 },
    recordCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    dateBox: {
        width: 50,
        alignItems: 'center',
        marginRight: 16,
    },
    dateDay: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
    dateMonth: { fontSize: 10, color: '#64748b', textTransform: 'uppercase' },
    recordInfo: { flex: 1 },
    recordDate: { fontSize: 14, fontWeight: '600', color: '#334155' },
    recordRemarks: { fontSize: 12, color: '#64748b', marginTop: 2 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    statusIcon: { color: '#fff', fontSize: 12, fontWeight: '600' },
    statusText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
});

export default Attendance;
