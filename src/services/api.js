import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import Toast from 'react-native-toast-message';

// Change this to your backend URL
const API_BASE_URL = 'http://localhost:5000/api'; // Use your computer's IP

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Add token and network check to requests
api.interceptors.request.use(async (config) => {
    // Check network connectivity
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected) {
        Toast.show({
            type: 'error',
            text1: 'Offline',
            text2: 'You are currently offline. Please check your connection.',
        });
        return Promise.reject(new Error('OFFLINE'));
    }

    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add error handling to responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.message === 'OFFLINE') {
            return Promise.reject(error);
        }

        if (error.code === 'ECONNABORTED' || !error.response || error.response.status >= 500) {
            Toast.show({
                type: 'error',
                text1: 'Server Busy',
                text2: 'Our servers are currently busy. Please try again later.',
            });
        }

        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    getCurrentUser: () => api.get('/auth/me'),
    updateFcmToken: (fcmToken) => api.post('/auth/update-fcm-token', { fcmToken }),
};

// Certificate APIs
export const certificateAPI = {
    request: (data) => api.post('/certificates/request', data),
    getMyRequests: () => api.get('/certificates/my-requests'),
    getPending: () => api.get('/certificates/pending'),
    getToday: () => api.get('/certificates/today'),
    updateStatus: (id, data) => api.put(`/certificates/${id}/status`, data),
    delete: (id) => api.delete(`/certificates/${id}`),
    getData: (id) => api.get(`/certificates/${id}/data`),
};

// Student APIs
export const studentAPI = {
    getProfile: () => api.get('/students/me'),
    getAttendance: (month, year) => api.get('/attendance/student/me', { params: { month, year } }),
    getFees: () => api.get('/fees/student/me'),
    getResults: () => api.get('/results/student/me'),
    getHomework: (studentId, days) => api.get(`/homework/student/${studentId}`, { params: days ? { days } : {} }),
    getMyHomework: (days) => api.get('/homework/me', { params: days ? { days } : {} }), // New
    getNotifications: () => api.get('/notifications/me'),
    getTeachers: () => api.get('/students/me/teachers'),
};

// Teacher APIs
export const teacherAPI = {
    getClasses: () => api.get('/teachers/me/classes'),
    getStudentsByClass: (classId, sectionId) => api.get(`/students?classId=${classId}&sectionId=${sectionId}`),
    markAttendance: (data) => api.post('/attendance/mark', data),
    uploadHomework: (data) => api.post('/homework/create', data),
    getSalarySlips: () => api.get('/salary/me'),
    getDashboardStats: () => api.get('/teachers/me/dashboard'),
    updateRollNumber: (studentId, rollNumber) => api.put(`/teachers/students/${studentId}/roll-number`, { rollNumber }),
};

// Attendance APIs
export const attendanceAPI = {
    getTeacherClasses: (params) => api.get('/teachers/me/classes', { params }),
    getClassAttendance: (classId, sectionId, date) => api.get(`/attendance/class/${classId}/${sectionId}/${date}`),
    markAttendance: (data) => api.post('/attendance/mark', data),
    getStudentAttendance: (studentId, month, year) => api.get(`/attendance/student/${studentId}`, { params: { month, year } }),
    getAttendanceSummary: (date) => api.get(`/attendance/summary/${date}`),
    getMonthlyReport: (month, year, classId) => api.get('/attendance/monthly', { params: { month, year, classId } }),
};

// Exam APIs
export const examAPI = {
    getActiveExams: () => api.get('/exams/active'),
    getAdmitCard: (examId, studentId) => api.get(`/exams/${examId}/admit-card`, { params: studentId ? { studentId } : {} }),
    getExamStudents: (examId, params) => api.get(`/exams/${examId}/admit-card-status`, { params }),
};

export default api;
