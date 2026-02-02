import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    Linking,
    Alert,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { authAPI } from '../services/api';

const NotificationPermission = ({ navigation, route }) => {
    const [loading, setLoading] = useState(true);
    const [hasToken, setHasToken] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState(null);
    const [requesting, setRequesting] = useState(false);

    const { userRole } = route.params || {};

    useEffect(() => {
        checkFcmTokenStatus();
    }, []);

    const checkFcmTokenStatus = async () => {
        try {
            setLoading(true);
            const response = await authAPI.checkFcmToken();
            if (response.data.success && response.data.data.hasToken) {
                // Token already exists, proceed to app
                setHasToken(true);
                navigateToApp();
            } else {
                // No token, check permission status
                setHasToken(false);
                await checkNotificationPermission();
            }
        } catch (error) {
            console.error('Check FCM token error:', error);
            // If API fails, try to request permission anyway
            await checkNotificationPermission();
        } finally {
            setLoading(false);
        }
    };

    const checkNotificationPermission = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        setPermissionStatus(status);

        if (status === 'granted') {
            // Permission granted, register and store token
            await registerForPushNotifications();
        }
    };

    const registerForPushNotifications = async () => {
        try {
            setRequesting(true);

            if (!Device.isDevice) {
                Alert.alert('Notice', 'Push notifications require a physical device');
                return;
            }

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            setPermissionStatus(finalStatus);

            if (finalStatus !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Notifications are required to receive important updates about exams, homework, and announcements.',
                    [{ text: 'OK' }]
                );
                return;
            }

            // Get the token
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: 'fecfe46d-66db-4612-8920-5285a69e0d1c',
            });

            const expoPushToken = tokenData.data;
            console.log('Expo Push Token:', expoPushToken);

            // Send token to server
            const response = await authAPI.updateFcmToken(expoPushToken);

            if (response.data.success) {
                setHasToken(true);
                navigateToApp();
            } else {
                Alert.alert('Error', response.data.message || 'Failed to register for notifications. Please try again.');
            }
        } catch (error) {
            console.error('Register push notification error:', error);
            Alert.alert('Error', error.message || 'Failed to register for notifications. Please try again.');
        } finally {
            setRequesting(false);
        }
    };

    const navigateToApp = () => {
        const destination = userRole === 'teacher' ? 'TeacherTabs' : 'StudentTabs';
        navigation.reset({
            index: 0,
            routes: [{ name: destination }],
        });
    };

    const openSettings = () => {
        if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
        } else {
            Linking.openSettings();
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.loadingText}>Checking notification status...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.icon}>🔔</Text>
                <Text style={styles.title}>Enable Notifications</Text>
                <Text style={styles.description}>
                    Stay updated with important information about exams, homework submissions, attendance, and school announcements.
                </Text>

                {permissionStatus === 'denied' ? (
                    <>
                        <Text style={styles.deniedText}>
                            Notifications are currently blocked. Please enable them in your device settings to continue.
                        </Text>
                        <TouchableOpacity style={styles.settingsButton} onPress={openSettings}>
                            <Text style={styles.settingsButtonText}>Open Settings</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.retryButton} onPress={checkFcmTokenStatus}>
                            <Text style={styles.retryButtonText}>I've enabled notifications</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity
                        style={[styles.allowButton, requesting && styles.buttonDisabled]}
                        onPress={registerForPushNotifications}
                        disabled={requesting}
                    >
                        {requesting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.allowButtonText}>Allow Notifications</Text>
                        )}
                    </TouchableOpacity>
                )}

                <Text style={styles.note}>
                    You can change this later in your device settings.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    icon: {
        fontSize: 80,
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280',
    },
    allowButton: {
        backgroundColor: '#4f46e5',
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    allowButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    deniedText: {
        fontSize: 14,
        color: '#dc2626',
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    settingsButton: {
        backgroundColor: '#4f46e5',
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        marginBottom: 12,
    },
    settingsButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    retryButton: {
        backgroundColor: '#f1f5f9',
        paddingVertical: 14,
        paddingHorizontal: 48,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    retryButtonText: {
        color: '#4f46e5',
        fontSize: 16,
        fontWeight: '600',
    },
    note: {
        marginTop: 24,
        fontSize: 13,
        color: '#9ca3af',
        textAlign: 'center',
    },
});

export default NotificationPermission;
