import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Modal
} from 'react-native';
import { certificateAPI } from '../services/api';

const AdminCertificateRequests = () => {
    const [requests, setRequests] = useState([]);
    const [todayRequests, setTodayRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminRemarks, setAdminRemarks] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [filter, setFilter] = useState('pending'); // 'pending' or 'today'

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        try {
            let response;
            if (filter === 'pending') {
                response = await certificateAPI.getPending();
                setRequests(response.data.data);
            } else {
                response = await certificateAPI.getToday();
                setTodayRequests(response.data.data);
            }
        } catch (error) {
            console.error('Fetch admin requests error:', error);
            Alert.alert('Error', 'Failed to fetch requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAction = (request, status) => {
        setSelectedRequest({ ...request, targetStatus: status });
        setAdminRemarks('');
        setModalVisible(true);
    };

    const submitStatusUpdate = async () => {
        if (!selectedRequest) return;

        try {
            const response = await certificateAPI.updateStatus(selectedRequest.id, {
                status: selectedRequest.targetStatus,
                adminRemarks: adminRemarks.trim()
            });

            if (response.data.success) {
                Alert.alert('Success', `Request ${selectedRequest.targetStatus}ed`);
                setModalVisible(false);
                fetchData();
            }
        } catch (error) {
            console.error('Update status error:', error);
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const handleDelete = (id) => {
        Alert.alert('Delete Request', 'Are you sure you want to delete this request?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await certificateAPI.delete(id);
                        fetchData();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete');
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.studentName}>{item.student_name}</Text>
                    <Text style={styles.studentInfo}>{item.class_name} - {item.section_name} | Adm: {item.admission_number}</Text>
                </View>
                <View style={[styles.badge, styles[`typeBadge_${item.certificate_type}`]]}>
                    <Text style={styles.badgeText}>{item.certificate_type.replace('_', ' ').toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.label}>Reason:</Text>
                <Text style={styles.value}>{item.reason}</Text>
                <Text style={styles.date}>Requested on: {new Date(item.created_at).toLocaleString()}</Text>
            </View>

            {item.status === 'pending' ? (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.btn, styles.acceptBtn]}
                        onPress={() => handleAction(item, 'accepted')}
                    >
                        <Text style={styles.btnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btn, styles.rejectBtn]}
                        onPress={() => handleAction(item, 'rejected')}
                    >
                        <Text style={styles.btnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btn, styles.deleteBtn]}
                        onPress={() => handleDelete(item.id)}
                    >
                        <Text style={styles.btnText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.statusFooter}>
                    <Text style={[styles.statusLabel, { color: item.status === 'accepted' ? '#10b981' : '#ef4444' }]}>
                        Status: {item.status.toUpperCase()}
                    </Text>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                        <Text style={styles.deleteLink}>Delete</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, filter === 'pending' && styles.activeTab]}
                    onPress={() => setFilter('pending')}
                >
                    <Text style={[styles.tabText, filter === 'pending' && styles.activeTabText]}>Pending</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, filter === 'today' && styles.activeTab]}
                    onPress={() => setFilter('today')}
                >
                    <Text style={[styles.tabText, filter === 'today' && styles.activeTabText]}>Today's All</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#4f46e5" />
                </View>
            ) : (
                <FlatList
                    data={filter === 'pending' ? requests : todayRequests}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
                    ListEmptyComponent={<Text style={styles.empty}>No requests available.</Text>}
                />
            )}

            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {selectedRequest?.targetStatus === 'accepted' ? 'Accept Request' : 'Reject Request'}
                        </Text>
                        <Text style={styles.modalSubtitle}>For: {selectedRequest?.student_name}</Text>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Add remarks (optional)"
                            multiline
                            numberOfLines={3}
                            value={adminRemarks}
                            onChangeText={setAdminRemarks}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmBtn} onPress={submitStatusUpdate}>
                                <Text style={styles.confirmBtnText}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
    activeTab: { borderBottomWidth: 3, borderBottomColor: '#4f46e5' },
    tabText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
    activeTabText: { color: '#4f46e5' },
    list: { padding: 16 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    studentName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    studentInfo: { fontSize: 12, color: '#64748b' },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
    typeBadge_study: { backgroundColor: '#3b82f6' },
    typeBadge_character: { backgroundColor: '#8b5cf6' },
    typeBadge_transfer: { backgroundColor: '#f59e0b' },
    typeBadge_no_dues: { backgroundColor: '#10b981' },
    content: { marginBottom: 15 },
    label: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
    value: { fontSize: 14, color: '#334155' },
    date: { fontSize: 10, color: '#94a3b8', marginTop: 8 },
    actions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
    btn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
    acceptBtn: { backgroundColor: '#10b981' },
    rejectBtn: { backgroundColor: '#ef4444' },
    deleteBtn: { backgroundColor: '#64748b' },
    btnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    statusFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
    statusLabel: { fontSize: 12, fontWeight: 'bold' },
    deleteLink: { color: '#ef4444', fontSize: 12 },
    empty: { textAlign: 'center', marginTop: 50, color: '#64748b' },
    loading: { flex: 1, justifyContent: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    modalSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },
    modalInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, textAlignVertical: 'top', minHeight: 80, marginBottom: 20 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
    cancelBtnText: { color: '#64748b', fontWeight: '600' },
    confirmBtn: { backgroundColor: '#4f46e5', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    confirmBtnText: { color: '#fff', fontWeight: '600' },
});

export default AdminCertificateRequests;
