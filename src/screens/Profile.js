import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import api from '../services/api';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/teachers/me/profile');
            if (response.data.success) {
                setProfile(response.data.data);
            }
        } catch (error) {
            console.error('Fetch profile error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>;
    if (!profile) return <View style={styles.center}><Text>Failed to load profile</Text></View>;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={[styles.avatarContainer, { backgroundColor: '#e0e7ff' }]}>
                    {profile.photo_url ? (
                        <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
                    ) : (
                        <Text style={styles.avatarText}>{profile.first_name[0]}{profile.last_name ? profile.last_name[0] : ''}</Text>
                    )}
                </View>
                <Text style={styles.name}>{profile.first_name} {profile.last_name}</Text>
                <Text style={styles.designation}>{profile.designation.toUpperCase()}</Text>
                <Text style={styles.id}>ID: {profile.employee_id}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personal Details</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{profile.email}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Phone</Text>
                    <Text style={styles.value}>{profile.phone || 'N/A'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>DOB</Text>
                    <Text style={styles.value}>{profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'N/A'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Address</Text>
                    <Text style={styles.value}>{profile.address}, {profile.city}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Professional Info</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Qualification</Text>
                    <Text style={styles.value}>{profile.qualification}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Experience</Text>
                    <Text style={styles.value}>{profile.experience_years} Years</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Joining Date</Text>
                    <Text style={styles.value}>{new Date(profile.joining_date).toLocaleDateString()}</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { alignItems: 'center', padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    avatarContainer: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    avatar: { width: 100, height: 100, borderRadius: 50 },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: '#4f46e5' },
    name: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
    designation: { fontSize: 14, color: '#4f46e5', fontWeight: '600', marginTop: 4 },
    id: { fontSize: 14, color: '#6b7280', marginTop: 2 },
    section: { marginTop: 16, backgroundColor: '#fff', padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    label: { color: '#6b7280', fontSize: 15 },
    value: { color: '#374151', fontSize: 15, fontWeight: '500', maxWidth: '60%', textAlign: 'right' }
});

export default Profile;
