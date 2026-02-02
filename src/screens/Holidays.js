import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl
} from 'react-native';
import { calendarAPI } from '../services/api';

const Holidays = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [holidays, setHolidays] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        try {
            const response = await calendarAPI.getHolidays();
            if (response.data.success) {
                setHolidays(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch holidays:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchHolidays();
    };

    const renderItem = ({ item }) => {
        const startDate = new Date(item.start_date).toLocaleDateString(undefined, {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
        });
        const endDate = item.end_date ? new Date(item.end_date).toLocaleDateString(undefined, {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
        }) : null;

        const isMultiDay = item.end_date && item.start_date !== item.end_date;

        return (
            <View style={styles.card}>
                <View style={[styles.dateBox, isMultiDay ? styles.multiDayBox : {}]}>
                    <Text style={styles.dateDay}>{new Date(item.start_date).getDate()}</Text>
                    <Text style={styles.dateMonth}>{new Date(item.start_date).toLocaleString('default', { month: 'short' })}</Text>
                </View>
                <View style={styles.content}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.dateText}>
                        {isMultiDay ? `${startDate} - ${endDate}` : startDate}
                    </Text>
                    {item.description && (
                        <Text style={styles.description}>{item.description}</Text>
                    )}
                </View>
            </View>
        );
    };

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
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Holidays & Events</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={holidays}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No upcoming holidays found.</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backButton: {
        padding: 8,
    },
    backText: {
        fontSize: 24,
        color: '#1e293b',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    dateBox: {
        backgroundColor: '#e0e7ff',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
        height: 60,
        marginRight: 16,
    },
    multiDayBox: {
        backgroundColor: '#fce7f3',
    },
    dateDay: {
        fontSize: 20,
        fontWeight: '700',
        color: '#4f46e5',
    },
    dateMonth: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6366f1',
        textTransform: 'uppercase',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
        color: '#94a3b8',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 16,
    },
});

export default Holidays;
