import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    SafeAreaView
} from 'react-native';
import { examAPI } from '../services/api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const AdmitCardView = ({ route, navigation }) => {
    const { examId } = route.params;
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchAdmitCard();
    }, []);

    const fetchAdmitCard = async () => {
        try {
            const response = await examAPI.getAdmitCard(examId);
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (error) {
            console.error('Fetch admit card error:', error);
            if (error.response && error.response.status === 404) {
                Alert.alert('Not Found', 'Admit card not found or not yet active for this exam.');
                navigation.goBack();
            } else {
                Alert.alert('Error', 'Failed to fetch admit card details.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getExamTemplate = (type) => {
        const typeStr = (type || '').toLowerCase();
        if (typeStr.includes('final') || typeStr.includes('annual')) return 'final';
        if (typeStr.includes('unit') || typeStr.includes('test')) return 'compact';
        return 'standard';
    };

    const handlePrint = async () => {
        if (!data) return;

        const { exam, schedule, card } = data;
        const template = getExamTemplate(exam.exam_type);

        // Dynamic CSS based on template
        let customCSS = '';
        if (template === 'final') {
            customCSS = `
                .card-container { border: 4px double #000; padding: 20px; }
                .header { border-bottom: 2px solid #000; }
                .title { background: #000; color: #fff; padding: 5px 20px; font-size: 24px; }
                .photo-box { width: 100px; height: 120px; border: 1px solid #000; position: absolute; right: 20px; top: 120px; text-align: center; line-height: 120px; font-size: 10px; background: #eee; }
             `;
        } else if (template === 'compact') {
            customCSS = `
                .card-container { border: 1px dotted #000; padding: 10px; font-size: 12px; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                .title { font-size: 16px; margin: 0; }
                .school-name { font-size: 18px; }
                .info-row { width: 33%; display: inline-block; }
                .table th, .table td { padding: 4px; font-size: 11px; }
             `;
        } else {
            customCSS = `
                .card-container { border: 2px solid #4f46e5; padding: 20px; border-radius: 10px; }
                .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 15px; }
                .title { color: #4f46e5; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; margin: 10px 0; }
             `;
        }

        const htmlContent = `
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica', sans-serif; padding: 20px; }
                    .header { margin-bottom: 20px; }
                    .school-name { font-size: 24px; font-weight: bold; margin: 0; text-align: center; }
                    .school-address { font-size: 12px; margin: 5px 0; text-align: center; color: #555; }
                    .title-container { text-align: center; margin: 15px 0; }
                    .title { font-weight: bold; display: inline-block; }
                    
                    .student-info { margin-bottom: 20px; position: relative; }
                    .info-row { margin-bottom: 5px; font-size: 14px; }
                    .label { font-weight: bold; display: inline-block; width: 120px; }
                    
                    .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    .table th, .table td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 13px; }
                    .table th { background-color: #f0f0f0; }
                    
                    .footer { margin-top: 50px; display: flex; justify-content: space-between; padding-top: 10px; }
                    .sig-box { text-align: center; width: 30%; border-top: 1px solid #000; padding-top: 5px; font-size: 12px; }
                    
                    /* Custom CSS Injection */
                    ${customCSS}
                </style>
            </head>
            <body>
                <div class="card-container">
                    <div class="header">
                        <div class="school-name">${exam.school_name || 'School Name'}</div>
                        <div class="school-address">${exam.school_address || 'Address not available'}</div>
                    </div>
                    
                    <div class="title-container">
                        <div class="title">${exam.exam_type} ADMIT CARD</div>
                    </div>
                    
                    <div class="student-info">
                        ${template === 'final' ? '<div class="photo-box">PHOTO</div>' : ''}
                        <div class="info-row"><span class="label">Exam Name:</span> ${exam.exam_name}</div>
                        <div class="info-row"><span class="label">Student Name:</span> ${exam.student_name}</div>
                        <div class="info-row"><span class="label">Admission No:</span> ${exam.admission_number}</div>
                        <div class="info-row"><span class="label">Class/Section:</span> ${exam.class_name} - ${exam.section_name}</div>
                        <div class="info-row"><span class="label">Roll Number:</span> ${exam.roll_number || 'N/A'}</div>
                    </div>

                    <table class="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Subject</th>
                                ${template !== 'compact' ? '<th>Invigilator</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${schedule.map(item => `
                                <tr>
                                    <td>${new Date(item.exam_date).toLocaleDateString()}</td>
                                    <td>${item.start_time.substring(0, 5)} - ${item.end_time.substring(0, 5)}</td>
                                    <td>${item.subject_name}</td>
                                    ${template !== 'compact' ? '<td></td>' : ''}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="footer">
                        <div class="sig-box">Class Teacher</div>
                        ${template === 'final' ? '<div class="sig-box">Exam Controller</div>' : ''}
                        <div class="sig-box">Principal</div>
                    </div>
                    
                    <div style="margin-top: 15px; font-size: 10px; text-align: center; color: #777;">
                        Card ID: ${card.id.split('-')[0]} | Generated: ${new Date().toLocaleDateString()}
                    </div>
                </div>
            </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error('Print error:', error);
            Alert.alert('Error', 'Failed to generate PDF');
        }
    };

    const renderCardContent = () => {
        const { exam, schedule } = data;
        const template = getExamTemplate(exam.exam_type);

        if (template === 'final') {
            return (
                <View style={[styles.card, styles.finalCard]}>
                    <View style={styles.finalHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.schoolName}>{exam.school_name}</Text>
                            <Text style={styles.schoolAddress}>{exam.school_address}</Text>
                        </View>
                        <View style={styles.photoPlaceholder}><Text style={{ fontSize: 10 }}>PHOTO</Text></View>
                    </View>
                    <View style={styles.finalTitleBox}>
                        <Text style={styles.finalTitle}>ADMIT CARD - {exam.exam_type.toUpperCase()}</Text>
                    </View>

                    <View style={styles.detailsGrid}>
                        <View style={styles.microRow}><Text style={styles.microLabel}>Name:</Text><Text style={styles.microValue}>{exam.student_name}</Text></View>
                        <View style={styles.microRow}><Text style={styles.microLabel}>Adm No:</Text><Text style={styles.microValue}>{exam.admission_number}</Text></View>
                        <View style={styles.microRow}><Text style={styles.microLabel}>Class:</Text><Text style={styles.microValue}>{exam.class_name} ({exam.section_name})</Text></View>
                        <View style={styles.microRow}><Text style={styles.microLabel}>Exam:</Text><Text style={styles.microValue}>{exam.exam_name}</Text></View>
                    </View>

                    <View style={styles.table}>
                        <View style={[styles.tableHeader, { backgroundColor: '#333' }]}>
                            <Text style={[styles.colHead, { color: '#fff' }]}>Date</Text>
                            <Text style={[styles.colHead, { color: '#fff' }]}>Subject</Text>
                            <Text style={[styles.colHead, { color: '#fff' }]}>Time</Text>
                        </View>
                        {schedule.map((item, i) => (
                            <View key={i} style={styles.tableRow}>
                                <Text style={styles.cell}>{new Date(item.exam_date).toLocaleDateString()}</Text>
                                <Text style={styles.cell}>{item.subject_name}</Text>
                                <Text style={styles.cell}>{item.start_time.substring(0, 5)}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            );
        } else if (template === 'compact') {
            return (
                <View style={[styles.card, styles.compactCard]}>
                    <Text style={styles.compactSchool}>{exam.school_name}</Text>
                    <Text style={styles.compactTitle}>{exam.exam_name} (Admit Slip)</Text>
                    <Text style={styles.compactStudent}>{exam.student_name} | {exam.class_name}-{exam.section_name}</Text>

                    <View style={styles.compactTable}>
                        {schedule.map((item, i) => (
                            <View key={i} style={styles.compactRow}>
                                <Text style={styles.compactCell}>{new Date(item.exam_date).getDate()}/{new Date(item.exam_date).getMonth() + 1}</Text>
                                <Text style={[styles.compactCell, { flex: 2 }]}>{item.subject_name}</Text>
                                <Text style={styles.compactCell}>{item.start_time.substring(0, 5)}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            );
        }

        // Standard Default
        return (
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.schoolName}>{exam.school_name}</Text>
                    <Text style={styles.examName}>{exam.exam_name}</Text>
                    <Text style={styles.cardTitle}>ADMIT CARD</Text>
                </View>

                <View style={styles.studentDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Student Name:</Text>
                        <Text style={styles.detailValue}>{exam.student_name}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Admission No:</Text>
                        <Text style={styles.detailValue}>{exam.admission_number}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Class:</Text>
                        <Text style={styles.detailValue}>{exam.class_name} - {exam.section_name}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Roll No:</Text>
                        <Text style={styles.detailValue}>{exam.roll_number || 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.scheduleSection}>
                    <Text style={styles.scheduleTitle}>Exam Schedule</Text>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.columnHeader, { flex: 2 }]}>Subject</Text>
                        <Text style={[styles.columnHeader, { flex: 2 }]}>Date</Text>
                        <Text style={[styles.columnHeader, { flex: 2 }]}>Time</Text>
                    </View>
                    {schedule.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={[styles.cell, { flex: 2 }]}>{item.subject_name}</Text>
                            <Text style={[styles.cell, { flex: 2 }]}>{new Date(item.exam_date).toLocaleDateString()}</Text>
                            <Text style={[styles.cell, { flex: 2 }]}>{item.start_time.substring(0, 5)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.note}>Please bring this card to the examination hall.</Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    if (!data) return null;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {renderCardContent()}

                <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
                    <Text style={styles.printButtonText}>Download / Print PDF</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    scrollContent: { padding: 16 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Standard Card
    card: { backgroundColor: '#fff', borderRadius: 8, padding: 24, marginBottom: 20, shadowOpacity: 0.1, elevation: 3 },
    header: { alignItems: 'center', marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 16 },
    schoolName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
    schoolAddress: { fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 5 },
    examName: { fontSize: 14, color: '#64748b', marginTop: 4 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#4f46e5', marginTop: 12, letterSpacing: 1, borderWidth: 1, borderColor: '#4f46e5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 },
    studentDetails: { marginBottom: 24 },
    detailRow: { flexDirection: 'row', marginBottom: 8 },
    detailLabel: { width: 120, fontSize: 14, color: '#64748b', fontWeight: '500' },
    detailValue: { flex: 1, fontSize: 14, color: '#1e293b', fontWeight: '600' },
    scheduleSection: { marginBottom: 24 },
    scheduleTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 8 },
    columnHeader: { fontSize: 12, fontWeight: '600', color: '#64748b' },
    tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    cell: { fontSize: 13, color: '#334155' },
    footer: { alignItems: 'center', marginTop: 16 },
    note: { fontSize: 12, color: '#ef4444', fontStyle: 'italic' },

    // Final Card Styles
    finalCard: { borderWidth: 4, borderColor: '#1e293b', borderRadius: 0, borderStyle: 'solid' },
    finalHeader: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#1e293b', paddingBottom: 10, marginBottom: 15 },
    photoPlaceholder: { width: 60, height: 80, borderWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
    finalTitleBox: { backgroundColor: '#1e293b', padding: 5, alignItems: 'center', marginBottom: 20 },
    finalTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    microRow: { width: '50%', flexDirection: 'row', marginBottom: 5 },
    microLabel: { fontWeight: 'bold', marginRight: 5, fontSize: 12 },
    microValue: { fontSize: 12 },
    colHead: { fontWeight: 'bold', flex: 1 },

    // Compact Card Styles
    compactCard: { padding: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#999' },
    compactSchool: { fontWeight: 'bold', fontSize: 16 },
    compactTitle: { fontSize: 14, color: '#555', marginBottom: 5 },
    compactStudent: { fontSize: 12, fontWeight: 'bold', borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 5, marginBottom: 5 },
    compactTable: { marginTop: 5 },
    compactRow: { flexDirection: 'row', paddingVertical: 2 },
    compactCell: { fontSize: 11, flex: 1 },

    printButton: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 40 },
    printButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default AdmitCardView;
