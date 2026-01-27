import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import api, { studentAPI } from '../services/api';

const FeesScreen = () => {
    const [loading, setLoading] = useState(true);
    const [fees, setFees] = useState([]);
    const [totals, setTotals] = useState({ totalDue: 0, totalPaid: 0, totalPending: 0 });

    useEffect(() => {
        fetchFees();
    }, []);

    const fetchFees = async () => {
        try {
            const response = await studentAPI.getFees();
            if (response.data.success) {
                setFees(response.data.data.fees);
                setTotals(response.data.data.totals);
            }
        } catch (error) {
            console.error('Fetch fees error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderFeeItem = ({ item }) => (
        <View style={styles.feeCard}>
            <View style={styles.feeHeader}>
                <Text style={styles.feeType}>{item.fee_type_name}</Text>
                <Text style={styles.feeMonth}>{item.month} {item.year}</Text>
            </View>
            <View style={styles.feeDetails}>
                <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Amount</Text>
                    <Text style={styles.feeValue}>₹{item.amount_due}</Text>
                </View>
                <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Paid</Text>
                    <Text style={[styles.feeValue, { color: '#10b981' }]}>₹{item.amount_paid}</Text>
                </View>
                <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Pending</Text>
                    <Text style={[styles.feeValue, { color: item.amount_pending > 0 ? '#ef4444' : '#10b981' }]}>
                        ₹{item.amount_pending}
                    </Text>
                </View>
            </View>
            <View style={styles.statusBadge}>
                <Text style={[styles.statusText, item.status === 'paid' ? styles.statusPaid : styles.statusPending]}>
                    {item.status.toUpperCase()}
                </Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Totals Summary */}
            <View style={styles.summaryContainer}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total Due</Text>
                    <Text style={styles.summaryValue}>₹{totals.totalDue}</Text>
                </View>
                <View style={[styles.summaryCard, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#e5e7eb' }]}>
                    <Text style={styles.summaryLabel}>Paid</Text>
                    <Text style={[styles.summaryValue, { color: '#10b981' }]}>₹{totals.totalPaid}</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Pending</Text>
                    <Text style={[styles.summaryValue, { color: '#ef4444' }]}>₹{totals.totalPending}</Text>
                </View>
            </View>

            <FlatList
                data={fees}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderFeeItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={<Text style={styles.listTitle}>Fee Breakup</Text>}
                ListEmptyComponent={<Text style={styles.emptyText}>No fee records found.</Text>}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryCard: {
        flex: 1,
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 16,
    },
    feeCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    feeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingBottom: 8,
    },
    feeType: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    feeMonth: {
        fontSize: 14,
        color: '#6b7280',
        textTransform: 'capitalize',
    },
    feeDetails: {
        gap: 8,
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    feeLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    feeValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    statusBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    statusPaid: {
        backgroundColor: '#dcfce7',
        color: '#065f46',
    },
    statusPending: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
    },
    emptyText: {
        textAlign: 'center',
        padding: 40,
        color: '#9ca3af',
    }
});

export default FeesScreen;
