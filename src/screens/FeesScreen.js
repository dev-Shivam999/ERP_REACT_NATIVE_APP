import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    RefreshControl,
} from 'react-native';
import api, { studentAPI } from '../services/api';
import { downloadPDF } from '../utils/downloadHelper';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FeesScreen = () => {
    const [loading, setLoading] = useState(true);
    const [fees, setFees] = useState([]);
    const [totals, setTotals] = useState({ totalDue: 0, totalPaid: 0, totalPending: 0 });
    const [studentProfile, setStudentProfile] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

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
            setRefreshing(false);
        }

        // Fetch profile for receipt info
        try {
            const profileRes = await studentAPI.getProfile();
            if (profileRes.data.success) {
                setStudentProfile(profileRes.data.data);
            }
        } catch (e) {
            console.log('Error fetching profile for receipt:', e);
        }
    };

    const downloadReceipt = async (fee) => {
        if (fee.status !== 'paid' && fee.amount_paid <= 0) {
            alert('Receipt only available for paid or partially paid fees');
            return;
        }

        const html = `
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #334155; }
                    .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
                    .school-name { font-size: 24px; font-weight: bold; color: #1e293b; margin: 0; }
                    .receipt-title { font-size: 18px; color: #4f46e5; margin-top: 10px; font-weight: bold; text-transform: uppercase; }
                    
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
                    .info-box { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; }
                    .info-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; }
                    .info-value { font-size: 14px; font-weight: bold; margin-top: 4px; }
                    
                    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                    th { text-align: left; border-bottom: 2px solid #e2e8f0; padding: 12px; color: #64748b; font-size: 12px; text-transform: uppercase; }
                    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
                    
                    .total-section { text-align: right; margin-top: 20px; }
                    .total-row { font-size: 18px; font-weight: bold; color: #1e293b; border-top: 2px solid #4f46e5; padding-top: 10px; display: inline-block; min-width: 200px; }
                    
                    .paid-stamp { border: 3px solid #10b981; color: #10b981; padding: 10px 20px; border-radius: 8px; font-size: 24px; font-weight: bold; display: inline-block; transform: rotate(-15deg); position: absolute; top: 150px; right: 80px; text-transform: uppercase; }
                    
                    .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 class="school-name">SCHOOL ERP SYSTEM</h1>
                    <div class="receipt-title">Payment Receipt</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Academic Session: 2023-24</div>
                </div>

                <div class="paid-stamp">PAID</div>

                <div class="info-grid">
                    <div class="info-box">
                        <div class="info-label">Student Details</div>
                        <div class="info-value">${studentProfile ? `${studentProfile.first_name} ${studentProfile.last_name || ''}` : 'Student'}</div>
                        <div class="info-value">Class: ${studentProfile ? `${studentProfile.class_name} - ${studentProfile.section_name}` : 'N/A'}</div>
                        <div class="info-value">Adm No: ${studentProfile ? studentProfile.admission_number : 'N/A'}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">Receipt Details</div>
                        <div class="info-value">Date: ${new Date().toLocaleDateString()}</div>
                        <div class="info-value">Receipt No: RCP-${fee.id.toString().substr(0, 6).toUpperCase()}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Month</th>
                            <th style="text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${fee.fee_type_name}</td>
                            <td style="text-transform: capitalize;">${fee.month} ${fee.year}</td>
                            <td style="text-align: right; font-weight: bold;">₹${fee.amount_paid}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="total-section">
                    <div class="total-row">
                        <span>Paid Amount: </span>
                        <span>₹${fee.amount_paid}</span>
                    </div>
                </div>

                <div class="footer">
                    This is a computer-generated receipt and does not require a physical signature.<br>
                    Thank you for your payment.
                </div>
            </body>
            </html>
        `;

        await downloadPDF(html, `Receipt_${fee.fee_type_name}_${fee.month}.pdf`);
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

            {item.amount_paid > 0 && (
                <TouchableOpacity
                    style={styles.downloadIcon}
                    onPress={() => downloadReceipt(item)}
                >
                    <Ionicons name="download-outline" size={20} color="#4f46e5" />
                </TouchableOpacity>
            )}
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
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFees(); }} colors={['#4f46e5']} />}
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
    downloadIcon: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        padding: 5,
        backgroundColor: '#f5f3ff',
        borderRadius: 8,
    },
    emptyText: {
        textAlign: 'center',
        padding: 40,
        color: '#9ca3af',
    }
});

export default FeesScreen;
