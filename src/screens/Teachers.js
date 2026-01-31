import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
    RefreshControl,
} from 'react-native';
import { studentAPI } from '../services/api';

const Teachers = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [teachers, setTeachers] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const response = await studentAPI.getTeachers();
            if (response.data.success) {
                setTeachers(response.data.data);
            }
        } catch (error) {
            console.error('Fetch teachers error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchTeachers();
    };

    const handleCall = (phone) => {
        if (phone) Linking.openURL(`tel:${phone}`);
    };

    const handleEmail = (email) => {
        if (email) Linking.openURL(`mailto:${email}`);
    };

    const renderTeacher = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    {item.photo_url ? (
                        <Image source={{ uri: item.photo_url }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{item.first_name[0]}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
                    <Text style={styles.subject}>{item.subject_name}</Text>
                    {item.is_class_teacher && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Class Teacher</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.contactRow}>
                {item.phone && (
                    <TouchableOpacity style={styles.contactBtn} onPress={() => handleCall(item.phone)}>
                        <Text style={styles.btnIcon}>📞</Text>
                        <Text style={styles.btnText}>Call</Text>
                    </TouchableOpacity>
                )}
                {item.email && (
                    <TouchableOpacity style={[styles.contactBtn, styles.emailBtn]} onPress={() => handleEmail(item.email)}>
                        <Text style={styles.btnIcon}>✉️</Text>
                        <Text style={styles.btnText}>Email</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={teachers}
                renderItem={renderTeacher}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>No teachers assigned yet.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    list: { padding: 16 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatarContainer: { marginRight: 16 },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e0e7ff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarText: { fontSize: 20, color: '#4f46e5', fontWeight: 'bold' },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    subject: { fontSize: 14, color: '#64748b', marginTop: 2 },
    badge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 4
    },
    badgeText: { color: '#166534', fontSize: 10, fontWeight: '600' },
    contactRow: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
    contactBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    emailBtn: { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' },
    btnIcon: { marginRight: 6, fontSize: 14 },
    btnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
    emptyText: { color: '#94a3b8', fontSize: 16 }
});

export default Teachers;
