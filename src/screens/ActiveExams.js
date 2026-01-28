import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { examAPI } from '../services/api';

const ActiveExams = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedExam, setExpandedExam] = useState(null);

    useEffect(() => {
        fetchActiveExams();
    }, []);

    const fetchActiveExams = async () => {
        try {
            const response = await examAPI.getActiveExams();
            if (response.data.success) {
                setExams(response.data.data);
            }
        } catch (error) {
            console.error('Fetch active exams error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchActiveExams();
    };

    const toggleExpand = (examId) => {
        setExpandedExam(expandedExam === examId ? null : examId);
    };

    const formatDate = (dateString) => {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const formatTime = (timeString) => {
        return timeString.substring(0, 5);
    };

    const renderScheduleItem = ({ item }) => (
        <View style={styles.scheduleItem}>
            <View style={styles.scheduleHeader}>
                <Text style={styles.subjectName}>{item.subject_name}</Text>
                {item.class_name && <Text style={styles.className}>{item.class_name}</Text>}
            </View>
            <View style={styles.scheduleDetails}>
                <Text style={styles.detailText}>📅 {formatDate(item.exam_date)}</Text>
                <Text style={styles.detailText}>⏰ {formatTime(item.start_time)} - {formatTime(item.end_time)}</Text>
            </View>
            {item.max_marks && (
                <View style={styles.marksContainer}>
                    <Text style={styles.marksText}>Max: {item.max_marks}</Text>
                    <Text style={styles.marksText}>Pass: {item.passing_marks}</Text>
                </View>
            )}
        </View>
    );

    const renderExamItem = ({ item }) => {
        const isExpanded = expandedExam === item.id;
        return (
            <View style={styles.card}>
                <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => toggleExpand(item.id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.headerContent}>
                        <Text style={styles.examName}>{item.name}</Text>
                        <Text style={styles.examType}>{item.exam_type?.replace('_', ' ').toUpperCase()}</Text>
                        <Text style={styles.dateRange}>
                            {formatDate(item.start_date)} - {formatDate(item.end_date)}
                        </Text>
                    </View>
                    <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.scheduleList}>
                        <Text style={styles.scheduleTitle}>Exam Schedule</Text>
                        {item.schedule && item.schedule.length > 0 ? (
                            item.schedule.map((scheduleItem, index) => (
                                <View key={index} style={styles.scheduleRow}>
                                    {renderScheduleItem({ item: scheduleItem })}
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noSchedule}>No schedule details available.</Text>
                        )}

                        <TouchableOpacity
                            style={styles.admitCardButton}
                            onPress={() => navigation.navigate('AdmitCardView', { examId: item.id })}
                        >
                            <Text style={styles.admitCardButtonText}>📄 View Admit Card</Text>
                        </TouchableOpacity>
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
            {exams.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📅</Text>
                    <Text style={styles.emptyText}>No Active Exams</Text>
                    <Text style={styles.emptySubtext}>There are no exams currently scheduled.</Text>
                </View>
            ) : (
                <FlatList
                    data={exams}
                    renderItem={renderExamItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                />
            )}
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    cardHeader: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
    },
    headerContent: {
        flex: 1,
    },
    examName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    examType: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4f46e5',
        marginBottom: 4,
    },
    dateRange: {
        fontSize: 14,
        color: '#6b7280',
    },
    expandIcon: {
        fontSize: 16,
        color: '#9ca3af',
        marginLeft: 16,
    },
    scheduleList: {
        backgroundColor: '#f9fafb',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    scheduleTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    scheduleRow: {
        marginBottom: 12,
    },
    scheduleItem: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    scheduleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    subjectName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    className: {
        fontSize: 12,
        fontWeight: '500',
        color: '#fff',
        backgroundColor: '#6366f1',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        overflow: 'hidden',
    },
    scheduleDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#4b5563',
    },
    marksContainer: {
        flexDirection: 'row',
        gap: 16,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    marksText: {
        fontSize: 12,
        color: '#6b7280',
    },
    noSchedule: {
        fontStyle: 'italic',
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 8,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
        opacity: 0.5,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 16,
        color: '#9ca3af',
        textAlign: 'center',
    },
    admitCardButton: {
        marginTop: 16,
        backgroundColor: '#4f46e5',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    admitCardButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default ActiveExams;
