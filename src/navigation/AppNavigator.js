import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import StudentDashboard from '../screens/StudentDashboard';
import FeesScreen from '../screens/FeesScreen';
import TeacherDashboard from '../screens/TeacherDashboard';
import MarkAttendance from '../screens/MarkAttendance';
import ResultsScreen from '../screens/ResultsScreen';
import MyClasses from '../screens/MyClasses';
import StudentList from '../screens/StudentList';
import AddHomework from '../screens/AddHomework';
import StudentHomework from '../screens/StudentHomework';
import HomeworkStatus from '../screens/HomeworkStatus';
import TeacherHomeworkList from '../screens/TeacherHomeworkList';
import Profile from '../screens/Profile';
import Salary from '../screens/Salary';
import ActiveExams from '../screens/ActiveExams';
import AdmitCardView from '../screens/AdmitCardView';
import Teachers from '../screens/Teachers';
import Attendance from '../screens/Attendance';
import CertificateRequest from '../screens/CertificateRequest';
import CertificateStatus from '../screens/CertificateStatus';
import AdminCertificateRequests from '../screens/AdminCertificateRequests';
import CertificateView from '../screens/CertificateView';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Icon component
const TabIcon = ({ icon, label, focused }) => (
    <View style={styles.tabItem}>
        <Text style={{ fontSize: 22 }}>{icon}</Text>
        <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
);

// Student/Parent Tabs
const StudentTabs = () => (
    <Tab.Navigator
        screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarShowLabel: false,
        }}
    >
        <Tab.Screen
            name="Home"
            component={StudentDashboard}
            options={{
                tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} />,
            }}
        />
        <Tab.Screen
            name="Attendance"
            component={Attendance}
            options={{
                tabBarIcon: ({ focused }) => <TabIcon icon="📋" label="Attendance" focused={focused} />,
            }}
        />
        <Tab.Screen
            name="Fees"
            component={FeesScreen}
            options={{
                tabBarIcon: ({ focused }) => <TabIcon icon="💰" label="Fees" focused={focused} />,
            }}
        />
        <Tab.Screen
            name="Results"
            component={ResultsScreen}
            options={{
                tabBarIcon: ({ focused }) => <TabIcon icon="📊" label="Results" focused={focused} />,
            }}
        />
        <Tab.Screen
            name="Profile"
            component={PlaceholderScreen('Profile')}
            options={{
                tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile" focused={focused} />,
            }}
        />
    </Tab.Navigator>
);

// Teacher Tabs
const TeacherTabs = () => (
    <Tab.Navigator
        screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarShowLabel: false,
        }}
    >
        <Tab.Screen
            name="Home"
            component={TeacherDashboard}
            options={{
                tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} />,
            }}
        />
        <Tab.Screen
            name="Classes"
            component={MyClasses}
            options={{
                tabBarIcon: ({ focused }) => <TabIcon icon="📚" label="Classes" focused={focused} />,
            }}
        />
        <Tab.Screen
            name="Salary"
            component={Salary}
            options={{
                tabBarIcon: ({ focused }) => <TabIcon icon="💰" label="Salary" focused={focused} />,
            }}
        />
        <Tab.Screen
            name="Profile"
            component={Profile}
            options={{
                tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile" focused={focused} />,
            }}
        />
    </Tab.Navigator>
);

// Placeholder for coming soon screens
const PlaceholderScreen = (name) => () => (
    <View style={styles.placeholder}>
        <Text style={styles.placeholderIcon}>🚧</Text>
        <Text style={styles.placeholderText}>{name}</Text>
        <Text style={styles.placeholderSubtext}>Coming Soon</Text>
    </View>
);

// Main App Navigator
const AppNavigator = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userData = await AsyncStorage.getItem('user');

            if (token && userData) {
                const user = JSON.parse(userData);
                setUserRole(user.role);
            }
        } catch (error) {
            console.error('Session check error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ fontSize: 40 }}>🏫</Text>
                <Text style={styles.loadingText}>Loading Session...</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={
                    userRole === 'student' || userRole === 'parent'
                        ? 'StudentTabs'
                        : userRole === 'teacher'
                            ? 'TeacherTabs'
                            : 'Login'
                }
                screenOptions={{
                    headerTitleAlign: 'center',
                    headerStyle: { backgroundColor: '#fff' },
                    headerTitleStyle: { fontWeight: '600' },
                }}
            >
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="StudentTabs"
                    component={StudentTabs}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="TeacherTabs"
                    component={TeacherTabs}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="AddHomework"
                    component={AddHomework}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="TeacherHomeworkList"
                    component={TeacherHomeworkList}
                    options={{ title: 'Class Homework' }}
                />
                <Stack.Screen
                    name="HomeworkStatus"
                    component={HomeworkStatus}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="MarkAttendance"
                    component={MarkAttendance}
                    options={{ title: 'Mark Attendance' }}
                />
                <Stack.Screen
                    name="StudentList"
                    component={StudentList}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="ActiveExams"
                    component={ActiveExams}
                    options={{ title: 'Active Exams' }}
                />
                <Stack.Screen
                    name="AdmitCardView"
                    component={AdmitCardView}
                    options={{ title: 'Admit Card' }}
                />
                <Stack.Screen
                    name="Teachers"
                    component={Teachers}
                    options={{ title: 'My Teachers' }}
                />
                <Stack.Screen
                    name="StudentHomework"
                    component={StudentHomework}
                    options={{ title: 'My Homework' }}
                />
                <Stack.Screen
                    name="CertificateRequest"
                    component={CertificateRequest}
                    options={{ title: 'Apply Certificate' }}
                />
                <Stack.Screen
                    name="CertificateStatus"
                    component={CertificateStatus}
                    options={{ title: 'My Certificates' }}
                />
                <Stack.Screen
                    name="AdminCertificateRequests"
                    component={AdminCertificateRequests}
                    options={{ title: 'Certificate Requests' }}
                />
                <Stack.Screen
                    name="CertificateView"
                    component={CertificateView}
                    options={{ title: 'Certificate' }}
                />
            </Stack.Navigator>
            <Toast />
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        height: 70,
        paddingTop: 8,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabLabel: {
        fontSize: 11,
        marginTop: 4,
        color: '#9ca3af',
    },
    tabLabelActive: {
        color: '#4f46e5',
        fontWeight: '600',
    },
    placeholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
    },
    placeholderIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    placeholderText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1f2937',
    },
    placeholderSubtext: {
        fontSize: 16,
        color: '#9ca3af',
        marginTop: 8,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 18,
        color: '#4f46e5',
        fontWeight: '600',
    },
});

export default AppNavigator;
