import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { printToFileAsync, printAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import api from '../services/api';
import { useEffect, useState } from 'react';

const Salary = () => {
    const [salaryHistory, setSalaryHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSalary();
    }, []);

    const fetchSalary = async () => {
        try {
            const response = await api.get('/payroll/me/history');
            if (response.data.success) {
                setSalaryHistory(response.data.data);
            }
        } catch (error) {
            console.error('Fetch salary error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMonthName = (month) => {
        const date = new Date();
        date.setMonth(month - 1);
        return date.toLocaleString('default', { month: 'long' });
    };

    const generatePayslip = async (item) => {
        const html = `
            <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; padding: 40px; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                        .title { font-size: 24px; font-weight: bold; color: #4f46e5; }
                        .subtitle { font-size: 16px; color: #666; margin-top: 5px; }
                        .section { margin-bottom: 25px; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                        .label { font-weight: bold; color: #555; }
                        .value { color: #000; }
                        .total-row { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 15px; border-top: 2px solid #333; font-size: 18px; font-weight: bold; }
                        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #888; }
                        .status-paid { color: #22c55e; border: 1px solid #22c55e; padding: 5px 10px; border-radius: 5px; display: inline-block; }
                        .status-pending { color: #f59e0b; border: 1px solid #f59e0b; padding: 5px 10px; border-radius: 5px; display: inline-block; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="title">SCHOOL ERP SYSTEM</div>
                        <div class="subtitle">Salary Slip for ${getMonthName(item.month)} ${item.year}</div>
                    </div>

                    <div class="section">
                        <div style="text-align: right; margin-bottom: 20px;">
                            <span class="${item.status === 'paid' ? 'status-paid' : 'status-pending'}">
                                ${item.status.toUpperCase()}
                            </span>
                        </div>
                        
                        <div class="row">
                            <span class="label">Employee ID</span>
                            <span class="value">EMP-${item.teacher_id?.substr(0, 8).toUpperCase() || '####'}</span>
                        </div>
                        <div class="row">
                            <span class="label">Pay Period</span>
                            <span class="value">${getMonthName(item.month)} ${item.year}</span>
                        </div>
                        ${item.payment_date ? `
                        <div class="row">
                            <span class="label">Payment Date</span>
                            <span class="value">${new Date(item.payment_date).toLocaleDateString()}</span>
                        </div>` : ''}
                    </div>

                    <div class="section">
                        <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px; background: #f3f4f6; padding: 8px;">Earnings</div>
                        <div class="row">
                            <span class="label">Basic Salary</span>
                            <span class="value">₹ ${parseFloat(item.basic_salary).toFixed(2)}</span>
                        </div>
                        <div class="row">
                            <span class="label">Allowances</span>
                            <span class="value">₹ ${parseFloat(item.allowances || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="section">
                        <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px; background: #f3f4f6; padding: 8px;">Deductions</div>
                        <div class="row">
                            <span class="label">Deductions</span>
                            <span class="value" style="color: #ef4444;">- ₹ ${parseFloat(item.deductions || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="total-row">
                        <span>Net Salary Pay</span>
                        <span>₹ ${parseFloat(item.net_salary).toFixed(2)}</span>
                    </div>

                    <div class="footer">
                        This is a computer-generated document and does not require a signature.<br>
                        Generated on ${new Date().toLocaleString()}
                    </div>
                </body>
            </html>
        `;

        try {
            if (Platform.OS === 'web') {
                await printAsync({ html });
            } else {
                const { uri } = await printToFileAsync({ html });
                await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }
        } catch (error) {
            console.error('PDF Generation Error:', error);
            Alert.alert('Error', 'Failed to generate PDF');
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.month}>{getMonthName(item.month)} {item.year}</Text>
                <Text style={[styles.status, { color: item.status === 'paid' ? '#22c55e' : '#f59e0b' }]}>
                    {item.status.toUpperCase()}
                </Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Net Salary</Text>
                <Text style={styles.amount}>₹ {item.net_salary}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.subLabel}>Basic: ₹{item.basic_salary}</Text>
                <Text style={styles.subLabel}>Deductions: ₹{item.deductions}</Text>
            </View>
            {item.payment_date && (
                <Text style={styles.date}>Paid on: {new Date(item.payment_date).toLocaleDateString()}</Text>
            )}

            <TouchableOpacity
                style={styles.downloadBtn}
                onPress={() => generatePayslip(item)}
            >
                <Text style={styles.downloadText}>📄 Download Salary Slip</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Salary History</Text>
            </View>
            {salaryHistory.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>No salary records found</Text>
                </View>
            ) : (
                <FlatList
                    data={salaryHistory}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    list: { padding: 16 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    month: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    status: { fontWeight: 'bold', fontSize: 14 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    label: { fontSize: 16, color: '#4b5563' },
    amount: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    subLabel: { fontSize: 12, color: '#9ca3af' },
    date: { fontSize: 12, color: '#6b7280', marginTop: 8, fontStyle: 'italic' },
    emptyText: { color: '#6b7280', fontSize: 16 },
    downloadBtn: {
        marginTop: 12,
        backgroundColor: '#e0e7ff',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#c7d2fe'
    },
    downloadText: {
        color: '#4338ca',
        fontWeight: '600',
        fontSize: 14
    }
});

export default Salary;
