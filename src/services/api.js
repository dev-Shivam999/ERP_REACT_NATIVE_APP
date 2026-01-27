import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your backend URL
const API_BASE_URL = 'http://localhost:5000/api'; // Use your computer's IP

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Add token to requests
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth APIs
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    getCurrentUser: () => api.get('/auth/me'),
};

// Student APIs
export const studentAPI = {
    getProfile: () => api.get('/students/me'),
    getAttendance: (month, year) => api.get('/attendance/student/me', { params: { month, year } }),
    getFees: () => api.get('/fees/student/me'),
    getResults: () => api.get('/results/student/me'),
    getHomework: (studentId) => api.get(`/homework/student/${studentId}`),
    getNotifications: () => api.get('/notifications/me'),
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

export default api;
