import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
    Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { studentAPI } from '../services/api';

const StudentProfile = ({ navigation }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await studentAPI.getProfile();
            if (response.data.success) {
                setProfile(response.data.data);
            }
        } catch (error) {
            console.error('Fetch profile error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProfile();
    }, []);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.multiRemove(['token', 'user']);
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Failed to load profile</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    {profile.photo_url ? (
                        <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
                    ) : (
                        <Text style={styles.avatarText}>
                            {profile.first_name?.[0]}{profile.last_name?.[0] || ''}
                        </Text>
                    )}
                </View>
                <Text style={styles.name}>{profile.first_name} {profile.last_name}</Text>
                <Text style={styles.classInfo}>{profile.class_name} - {profile.section_name}</Text>
                <Text style={styles.admNo}>Admission No: {profile.admission_number}</Text>
            </View>

            {/* Personal Information */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Personal Information</Text>
                <InfoRow label="Roll Number" value={profile.roll_number || 'N/A'} />
                <InfoRow label="Date of Birth" value={profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'N/A'} />
                <InfoRow label="Gender" value={profile.gender || 'N/A'} />
                <InfoRow label="Blood Group" value={profile.blood_group || 'N/A'} />
                <InfoRow label="Aadhar Number" value={profile.aadhar_number || 'N/A'} />
                <InfoRow label="Religion" value={profile.religion || 'N/A'} />
                <InfoRow label="Category" value={profile.category?.toUpperCase() || 'N/A'} />
                <InfoRow label="Caste" value={profile.caste || 'N/A'} />
                <InfoRow label="Nationality" value={profile.nationality || 'N/A'} />
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📞 Contact Information</Text>
                <InfoRow label="Phone" value={profile.phone || 'N/A'} />
                <InfoRow label="Email" value={profile.email || 'N/A'} />
                <InfoRow label="Address" value={profile.address || 'N/A'} />
                <InfoRow label="City" value={profile.city || 'N/A'} />
                <InfoRow label="State" value={profile.state || 'N/A'} />
                <InfoRow label="Pincode" value={profile.pincode || 'N/A'} />
            </View>

            {/* Parent Information */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>👨‍👩‍👧 Parent/Guardian</Text>
                <InfoRow label="Father's Name" value={profile.father_name || 'N/A'} />
                <InfoRow label="Mother's Name" value={profile.mother_name || 'N/A'} />
                <InfoRow label="Guardian" value={profile.guardian_name || 'N/A'} />
                {profile.parents && profile.parents.length > 0 && profile.parents.slice(0, 1).map((parent, index) => (
                    <InfoRow
                        key={index}
                        label={`${parent.relationship?.charAt(0).toUpperCase() + parent.relationship?.slice(1)} Phone`}
                        value={profile.phone || 'N/A'}
                    />
                ))}
            </View>

            {/* Academic Info */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎓 Academic Details</Text>
                <InfoRow label="Admission Class" value={profile.admission_class_name || 'N/A'} />
                <InfoRow label="Admission Date" value={profile.admission_date ? new Date(profile.admission_date).toLocaleDateString() : 'N/A'} />
                <InfoRow label="Status" value={profile.status?.toUpperCase() || 'N/A'} valueStyle={{ color: profile.status === 'active' ? '#16a34a' : '#dc2626' }} />
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>🚪 Logout</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const InfoRow = ({ label, value, valueStyle = {} }) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, valueStyle]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
    errorText: { color: '#6b7280', fontSize: 16, marginBottom: 12 },
    retryButton: { backgroundColor: '#4f46e5', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
    retryText: { color: '#fff', fontWeight: '600' },

    header: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb'
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e0e7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    avatar: { width: 100, height: 100, borderRadius: 50 },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: '#4f46e5' },
    name: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
    classInfo: { fontSize: 16, color: '#4f46e5', fontWeight: '600', marginTop: 4 },
    admNo: { fontSize: 14, color: '#6b7280', marginTop: 2 },

    section: {
        marginTop: 16,
        backgroundColor: '#fff',
        padding: 16,
        marginHorizontal: 0
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6'
    },
    label: { color: '#6b7280', fontSize: 14, flex: 1 },
    value: { color: '#374151', fontSize: 14, fontWeight: '500', flex: 1, textAlign: 'right' },

    logoutButton: {
        marginTop: 24,
        marginHorizontal: 16,
        backgroundColor: '#fef2f2',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fecaca'
    },
    logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 16 }
});

export default StudentProfile;
