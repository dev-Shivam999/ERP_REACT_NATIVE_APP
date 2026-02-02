import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { certificateAPI } from '../services/api';

const CertificateRequest = ({ navigation }) => {
    const [certificateType, setCertificateType] = useState('study');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const certificateTypes = [
        { label: 'Study Certificate', value: 'study' },
        { label: 'Character Certificate', value: 'character' },
        { label: 'Transfer Certificate (TC)', value: 'transfer' },
        { label: 'No Dues Certificate', value: 'no_dues' },
    ];

    const handleSubmit = async () => {
        if (!reason.trim()) {
            Alert.alert('Error', 'Please provide a reason for the request.');
            return;
        }

        setLoading(true);
        try {
            const response = await certificateAPI.request({
                certificateType,
                reason: reason.trim()
            });

            if (response.data.success) {
                Alert.alert('Success', 'Your certificate request has been submitted.', [
                    { text: 'OK', onPress: () => navigation.navigate('CertificateStatus') }
                ]);
            }
        } catch (error) {
            console.error('Request certificate error:', error);
            Alert.alert('Error', 'Failed to submit request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <Text style={styles.title}>Apply for Certificate</Text>
                <Text style={styles.subtitle}>Select the type of certificate you need and provide a reason.</Text>

                <View style={styles.section}>
                    <Text style={styles.label}>Certificate Type</Text>
                    <View style={styles.typeGrid}>
                        {certificateTypes.map((type) => (
                            <TouchableOpacity
                                key={type.value}
                                style={[
                                    styles.typeCard,
                                    certificateType === type.value && styles.typeCardActive
                                ]}
                                onPress={() => setCertificateType(type.value)}
                            >
                                <Text style={[
                                    styles.typeText,
                                    certificateType === type.value && styles.typeTextActive
                                ]}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Reason for Request</Text>
                    <TextInput
                        style={styles.textArea}
                        value={reason}
                        onChangeText={setReason}
                        placeholder="e.g., Higher education, Job application, etc."
                        multiline
                        numberOfLines={4}
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitText}>Submit Request</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.statusButton}
                    onPress={() => navigation.navigate('CertificateStatus')}
                >
                    <Text style={styles.statusButtonText}>View My Requests</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },
    section: { marginBottom: 24 },
    label: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 12 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    typeCard: {
        width: '48%',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeCardActive: {
        backgroundColor: '#4f46e5',
        borderColor: '#4f46e5',
    },
    typeText: { fontSize: 14, color: '#475569', textAlign: 'center', fontWeight: '500' },
    typeTextActive: { color: '#fff' },
    textArea: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        fontSize: 15,
        color: '#1e293b',
        textAlignVertical: 'top',
        height: 120,
    },
    submitButton: {
        backgroundColor: '#4f46e5',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: { backgroundColor: '#94a3b8' },
    submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    statusButton: {
        marginTop: 16,
        padding: 16,
        alignItems: 'center',
    },
    statusButtonText: { color: '#4f46e5', fontWeight: '600', fontSize: 15 },
});

export default CertificateRequest;
