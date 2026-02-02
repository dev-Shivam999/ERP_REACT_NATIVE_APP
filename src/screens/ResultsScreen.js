import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { downloadPDF } from '../utils/downloadHelper';
import api from '../services/api';

const { width } = Dimensions.get('window');

const ResultsScreen = ({ navigation, route }) => {
    const [results, setResults] = useState([]);
    const [selectedResult, setSelectedResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        fetchMyResults();
    }, []);

    const fetchMyResults = async () => {
        try {
            setLoading(true);
            const response = await api.get('/results/my-results');
            setResults(response.data.data || []);
        } catch (error) {
            console.error('Fetch results error:', error);
            Alert.alert('Error', 'Failed to fetch results. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchResultDetails = async (sessionId, studentId) => {
        try {
            setDetailLoading(true);
            const response = await api.get(`/results/sessions/${sessionId}/students/${studentId}/result`);
            setSelectedResult(response.data.data);
        } catch (error) {
            console.error('Fetch result details error:', error);
            Alert.alert('Error', 'Failed to fetch result details. Please try again.');
        } finally {
            setDetailLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMyResults();
        setRefreshing(false);
    };

    const getGradeColor = (grade) => {
        switch (grade) {
            case 'A+':
            case 'A':
                return '#10b981';
            case 'B+':
            case 'B':
                return '#3b82f6';
            case 'C+':
            case 'C':
                return '#f59e0b';
            case 'D':
                return '#f97316';
            case 'F':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const downloadReportCard = async (sessionId, studentId) => {
        try {
            // Ensure we have the details
            let resultData = selectedResult;
            if (!resultData || resultData.result_session_id !== sessionId || resultData.student_id !== studentId) {
                const response = await api.get(`/results/sessions/${sessionId}/students/${studentId}/result`);
                resultData = response.data.data;
            }

            if (!resultData) {
                Alert.alert('Error', 'Could not find result data to download.');
                return;
            }

            const htmlContent = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #1e293b; }
                        .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 20px; }
                        .school-name { fontSize: 28px; fontWeight: bold; margin: 0; color: #1e293b; text-transform: uppercase; }
                        .report-title { fontSize: 20px; color: #4f46e5; margin: 10px 0; font-weight: bold; }
                        
                        .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
                        .info-box { width: 48%; }
                        .info-row { margin-bottom: 8px; font-size: 14px; }
                        .label { font-weight: bold; color: #64748b; margin-right: 5px; }
                        
                        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
                        .summary-item { text-align: center; }
                        .summary-value { font-size: 18px; font-weight: bold; display: block; }
                        .summary-label { font-size: 10px; color: #64748b; text-transform: uppercase; }
                        
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        th { background: #4f46e5; color: white; padding: 12px; text-align: left; font-size: 14px; }
                        td { border-bottom: 1px solid #e2e8f0; padding: 12px; font-size: 14px; }
                        tr:nth-child(even) { background: #f8fafc; }
                        
                        .grade-badge { padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; font-size: 12px; display: inline-block; }
                        
                        .footer { margin-top: 50px; display: flex; justify-content: space-between; }
                        .signature-box { width: 200px; text-align: center; border-top: 1px solid #1e293b; padding-top: 10px; font-size: 14px; font-weight: bold; }
                        
                        .timestamp { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1 class="school-name">SCHOOL ERP SYSTEM</h1>
                        <div class="report-title">REPORT CARD - ${resultData.exam_name}</div>
                        <div style="font-size: 14px; color: #64748b;">Academic Session: ${resultData.session_name}</div>
                    </div>

                    <div class="info-section">
                        <div class="info-box">
                            <div class="info-row"><span class="label">Student Name:</span> ${resultData.first_name} ${resultData.last_name}</div>
                            <div class="info-row"><span class="label">Admission No:</span> ${resultData.admission_number}</div>
                            <div class="info-row"><span class="label">Roll Number:</span> ${resultData.roll_number || 'N/A'}</div>
                        </div>
                        <div class="info-box">
                            <div class="info-row"><span class="label">Class:</span> ${resultData.class_name}</div>
                            <div class="info-row"><span class="label">Section:</span> ${resultData.section_name}</div>
                        </div>
                    </div>

                    <div class="summary-grid">
                        <div class="summary-item">
                            <span class="summary-value">${resultData.obtained_marks} / ${resultData.total_marks}</span>
                            <span class="summary-label">Total Marks</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-value">${resultData.percentage}%</span>
                            <span class="summary-label">Percentage</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-value">${resultData.grade}</span>
                            <span class="summary-label">Overal Grade</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-value">#${resultData.rank}</span>
                            <span class="summary-label">Class Rank</span>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Code</th>
                                <th>Max Marks</th>
                                <th>Obtained</th>
                                <th>Percentage</th>
                                <th>Grade</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${resultData.subject_marks.map(sub => `
                                <tr>
                                    <td style="font-weight: bold;">${sub.subject_name}</td>
                                    <td>${sub.subject_code || '-'}</td>
                                    <td>${sub.max_marks}</td>
                                    <td>${sub.obtained_marks}</td>
                                    <td>${sub.percentage}%</td>
                                    <td>
                                        <div class="grade-badge" style="background-color: ${getGradeColor(sub.grade)};">
                                            ${sub.grade}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="footer">
                        <div class="signature-box">Class Teacher</div>
                        <div class="signature-box">Exam Controller</div>
                        <div class="signature-box">Principal</div>
                    </div>

                    <div class="timestamp">
                        Report generated on ${new Date().toLocaleString()} | Computer Generated Document
                    </div>
                </body>
                </html>
            `;

            await downloadPDF(htmlContent, `ReportCard_${resultData.first_name}_${resultData.exam_name}.pdf`);

        } catch (error) {
            console.error('Download report card error:', error);
            Alert.alert('Error', 'Failed to generate report card PDF.');
        }
    };

    const renderResultCard = (result) => (
        <TouchableOpacity
            key={result.id}
            style={styles.resultCard}
            onPress={() => fetchResultDetails(result.result_session_id, result.student_id)}
        >
            <View style={styles.resultHeader}>
                <View style={styles.resultInfo}>
                    <Text style={styles.examName}>{result.exam_name}</Text>
                    <Text style={styles.sessionName}>{result.session_name}</Text>
                    <Text style={styles.className}>
                        {result.class_name} - {result.section_name}
                    </Text>
                </View>
                <View style={styles.resultSummary}>
                    <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(result.grade) }]}>
                        <Text style={styles.gradeText}>{result.grade}</Text>
                    </View>
                    <Text style={styles.percentage}>{result.percentage}%</Text>
                </View>
            </View>

            <View style={styles.resultStats}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Marks</Text>
                    <Text style={styles.statValue}>{result.total_marks}</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Obtained</Text>
                    <Text style={styles.statValue}>{result.obtained_marks}</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Rank</Text>
                    <Text style={styles.statValue}>#{result.rank}</Text>
                </View>
            </View>

            <View style={styles.resultFooter}>
                <Text style={styles.publishDate}>
                    Published: {new Date(result.published_at).toLocaleDateString()}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </View>
        </TouchableOpacity>
    );

    const renderSubjectMarks = () => {
        if (!selectedResult?.subject_marks) return null;

        return (
            <View style={styles.subjectMarksContainer}>
                <Text style={styles.sectionTitle}>📚 Subject-wise Marks</Text>
                {selectedResult.subject_marks.map((subject, index) => (
                    <View key={index} style={styles.subjectCard}>
                        <View style={styles.subjectHeader}>
                            <Text style={styles.subjectName}>{subject.subject_name}</Text>
                            <Text style={styles.subjectCode}>{subject.subject_code}</Text>
                        </View>
                        <View style={styles.subjectMarks}>
                            <View style={styles.markItem}>
                                <Text style={styles.markLabel}>Obtained</Text>
                                <Text style={styles.markValue}>{subject.obtained_marks}</Text>
                            </View>
                            <View style={styles.markItem}>
                                <Text style={styles.markLabel}>Max</Text>
                                <Text style={styles.markValue}>{subject.max_marks}</Text>
                            </View>
                            <View style={styles.markItem}>
                                <Text style={styles.markLabel}>%</Text>
                                <Text style={styles.markValue}>{subject.percentage}%</Text>
                            </View>
                            <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(subject.grade) }]}>
                                <Text style={styles.gradeText}>{subject.grade}</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.loadingText}>Loading results...</Text>
            </View>
        );
    }

    if (selectedResult) {
        return (
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => setSelectedResult(null)}
                    >
                        <Ionicons name="arrow-back" size={24} color="#4f46e5" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>📊 Result Details</Text>
                    <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={() => downloadReportCard(selectedResult.result_session_id, selectedResult.student_id)}
                    >
                        <Ionicons name="download" size={24} color="#4f46e5" />
                    </TouchableOpacity>
                </View>

                {detailLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4f46e5" />
                        <Text style={styles.loadingText}>Loading details...</Text>
                    </View>
                ) : (
                    <>
                        {/* Student Info */}
                        <View style={styles.studentInfoCard}>
                            <Text style={styles.studentName}>
                                {selectedResult.first_name} {selectedResult.last_name}
                            </Text>
                            <Text style={styles.studentDetails}>
                                Roll No: {selectedResult.roll_number} | Admission: {selectedResult.admission_number}
                            </Text>
                            <Text style={styles.classInfo}>
                                {selectedResult.class_name} - {selectedResult.section_name}
                            </Text>
                        </View>

                        {/* Exam Info */}
                        <View style={styles.examInfoCard}>
                            <Text style={styles.examTitle}>{selectedResult.exam_name}</Text>
                            <Text style={styles.examType}>{selectedResult.exam_type}</Text>
                            <Text style={styles.sessionName}>{selectedResult.session_name}</Text>
                        </View>

                        {/* Overall Result */}
                        <View style={styles.overallResultCard}>
                            <Text style={styles.sectionTitle}>🏆 Overall Result</Text>
                            <View style={styles.overallStats}>
                                <View style={styles.overallStatItem}>
                                    <Text style={styles.overallStatValue}>{selectedResult.obtained_marks}</Text>
                                    <Text style={styles.overallStatLabel}>Obtained Marks</Text>
                                </View>
                                <View style={styles.overallStatItem}>
                                    <Text style={styles.overallStatValue}>{selectedResult.total_marks}</Text>
                                    <Text style={styles.overallStatLabel}>Total Marks</Text>
                                </View>
                                <View style={styles.overallStatItem}>
                                    <Text style={[styles.overallStatValue, { color: getGradeColor(selectedResult.grade) }]}>
                                        {selectedResult.percentage}%
                                    </Text>
                                    <Text style={styles.overallStatLabel}>Percentage</Text>
                                </View>
                                <View style={styles.overallStatItem}>
                                    <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(selectedResult.grade) }]}>
                                        <Text style={styles.gradeText}>{selectedResult.grade}</Text>
                                    </View>
                                    <Text style={styles.overallStatLabel}>Grade</Text>
                                </View>
                            </View>
                            <View style={styles.rankContainer}>
                                <Text style={styles.rankText}>Class Rank: #{selectedResult.rank}</Text>
                            </View>
                        </View>

                        {/* Subject-wise Marks */}
                        {renderSubjectMarks()}

                        {/* Download Button */}
                        <TouchableOpacity
                            style={styles.downloadReportButton}
                            onPress={() => downloadReportCard(selectedResult.result_session_id, selectedResult.student_id)}
                        >
                            <Ionicons name="download" size={20} color="#fff" />
                            <Text style={styles.downloadReportText}>Download Report Card</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📊 My Results</Text>
            </View>

            {results.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
                    <Text style={styles.emptyTitle}>No Results Available</Text>
                    <Text style={styles.emptySubtitle}>
                        Your exam results will appear here once they are published by the school.
                    </Text>
                </View>
            ) : (
                <View style={styles.resultsContainer}>
                    {results.map(renderResultCard)}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        padding: 8,
    },
    downloadButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#374151',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 24,
    },
    resultsContainer: {
        padding: 16,
    },
    resultCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    resultInfo: {
        flex: 1,
    },
    examName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    sessionName: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 2,
    },
    className: {
        fontSize: 14,
        color: '#4f46e5',
        fontWeight: '500',
    },
    resultSummary: {
        alignItems: 'center',
    },
    gradeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 4,
    },
    gradeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    percentage: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    resultStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    resultFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    publishDate: {
        fontSize: 12,
        color: '#6b7280',
    },
    studentInfoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    studentName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    studentDetails: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 2,
    },
    classInfo: {
        fontSize: 14,
        color: '#4f46e5',
        fontWeight: '500',
    },
    examInfoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    examTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    examType: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 2,
    },
    overallResultCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
    },
    overallStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    overallStatItem: {
        alignItems: 'center',
    },
    overallStatValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    overallStatLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
    rankContainer: {
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    rankText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4f46e5',
    },
    subjectMarksContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    subjectCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    subjectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    subjectName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    subjectCode: {
        fontSize: 12,
        color: '#6b7280',
    },
    subjectMarks: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    markItem: {
        alignItems: 'center',
    },
    markLabel: {
        fontSize: 10,
        color: '#6b7280',
        marginBottom: 2,
    },
    markValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    downloadReportButton: {
        backgroundColor: '#4f46e5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    downloadReportText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default ResultsScreen;