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
import { certificateAPI } from '../services/api';

const CertificateStatus = ({ navigation }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await certificateAPI.getMyRequests();
            if (response.data.success) {
                setRequests(response.data.data);
            }
        } catch (error) {
            console.error('Fetch requests error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'accepted': return '#10b981';
            case 'rejected': return '#ef4444';
            default: return '#f59e0b';
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.certificateType}>{item.certificate_type.toUpperCase()} CERTIFICATE</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText}>{item.reason}</Text>

            {item.admin_remarks && (
                <View style={styles.remarkBox}>
                    <Text style={styles.remarkLabel}>Admin Remarks:</Text>
                    <Text style={styles.remarkText}>{item.admin_remarks}</Text>
                </View>
            )}

            <View style={styles.cardFooter}>
                <Text style={styles.dateText}>Requested: {new Date(item.created_at).toLocaleDateString()}</Text>
                {item.status === 'accepted' && (
                    <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={() => navigation.navigate('CertificateView', { id: item.id })}
                    >
                        <Text style={styles.downloadButtonText}>Download</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={requests}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No certificate requests found.</Text>
                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={() => navigation.navigate('CertificateRequest')}
                        >
                            <Text style={styles.applyButtonText}>Apply Now</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    listContent: { padding: 16 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 8,
    },
    certificateType: { fontSize: 13, fontWeight: '800', color: '#64748b', letterSpacing: 0.5 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    reasonLabel: { fontSize: 12, color: '#64748b', marginBottom: 2 },
    reasonText: { fontSize: 15, color: '#1e293b', marginBottom: 12 },
    remarkBox: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 12 },
    remarkLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 2 },
    remarkText: { fontSize: 13, color: '#334155' },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    dateText: { fontSize: 12, color: '#94a3b8' },
    downloadButton: { backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    downloadButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 16, color: '#64748b', marginBottom: 20 },
    applyButton: { backgroundColor: '#4f46e5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    applyButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default CertificateStatus;
