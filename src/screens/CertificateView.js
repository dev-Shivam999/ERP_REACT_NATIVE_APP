import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    Alert,
    SafeAreaView
} from 'react-native';
import { certificateAPI } from '../services/api';
import { downloadPDF } from '../utils/downloadHelper';

const CertificateView = ({ route, navigation }) => {
    const { id } = route.params;
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await certificateAPI.getData(id);
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (error) {
            console.error('Fetch certificate data error:', error);
            Alert.alert('Error', 'Failed to fetch certificate details.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async () => {
        if (!data) return;

        const {
            certificate_type, student_name, admission_number, admission_date,
            class_name, section_name, school_name, school_address,
            school_phone, school_email, father_name, mother_name,
            date_of_birth, address, academic_year
        } = data;

        const title = certificate_type === 'study' ? 'Study Certificate' :
            certificate_type === 'character' ? 'Character Certificate' :
                certificate_type === 'transfer' ? 'Transfer Certificate' : 'No Dues Certificate';

        const dob = new Date(date_of_birth).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

        const htmlContent = `
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica', sans-serif; padding: 40px; border: 20px solid #f0f0f0; height: 90vh; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                    .school-name { font-size: 32px; font-weight: bold; color: #1a56db; margin: 0; }
                    .school-info { font-size: 14px; color: #666; margin-top: 5px; }
                    
                    .cert-title { text-align: center; margin: 40px 0; }
                    .cert-title h1 { border-bottom: 2px solid #1a56db; display: inline-block; padding-bottom: 5px; color: #1a56db; text-transform: uppercase; letter-spacing: 2px; }
                    
                    .content { font-size: 18px; line-height: 2; color: #333; text-align: justify; }
                    .field { font-weight: bold; border-bottom: 1px dotted #000; padding: 0 10px; color: #000; }
                    
                    .footer { margin-top: 100px; display: flex; justify-content: space-between; }
                    .sig-box { text-align: center; width: 40%; }
                    .sig-line { border-top: 1px solid #000; margin-bottom: 10px; }
                    
                    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(0,0,0,0.03); white-space: nowrap; z-index: -1; }
                </style>
            </head>
            <body>
                <div class="watermark">${school_name}</div>
                <div class="header">
                    <h1 class="school-name">${school_name}</h1>
                    <div class="school-info">${school_address}</div>
                    <div class="school-info">Contact: ${school_phone} | Email: ${school_email}</div>
                </div>
                
                <div class="cert-title">
                    <h1>${title}</h1>
                </div>
                
                <div class="content">
                    TO WHOM SO EVER IT MAY CONCERN
                    <br><br>
                    This is certified that Mstr/Ms. <span class="field">${student_name}</span> 
                    Son/Daughter of <span class="field">${father_name || 'N/A'}</span> 
                    Mother's Name <span class="field">${mother_name || 'N/A'}</span>
                    Address <span class="field">${address || 'N/A'}</span>
                    is the regular student of this Institution.
                    <br><br>
                    He/She has been studying in class <span class="field">${class_name} (${section_name})</span> 
                    in the academic year <span class="field">${academic_year || 'N/A'}</span> 
                    under S.R. No. <span class="field">${admission_number}</span>.
                    <br><br>
                    His/Her date of birth as per our record is <span class="field">${dob}</span>.
                </div>

                <div class="footer">
                    <div class="sig-box">
                        <div class="sig-line"></div>
                        <div>Date: ${new Date().toLocaleDateString()}</div>
                    </div>
                    <div class="sig-box">
                        <div class="sig-line"></div>
                        <div>Initials of the Head of the Institution</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        try {
            await downloadPDF(htmlContent, `${certificate_type}_Certificate_${student_name}.pdf`);
        } catch (error) {
            console.error('Print error:', error);
            Alert.alert('Error', 'Failed to generate PDF');
        }
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
            <View style={styles.previewContainer}>
                <Text style={styles.previewTitle}>Certificate Preview</Text>
                <View style={styles.previewCard}>
                    <Text style={styles.schoolName}>{data.school_name}</Text>
                    <Text style={styles.certType}>{data.certificate_type.toUpperCase()} CERTIFICATE</Text>
                    <View style={styles.divider} />
                    <Text style={styles.studentName}>{data.student_name}</Text>
                    <Text style={styles.details}>D/O, S/O: {data.father_name}</Text>
                    <Text style={styles.details}>Class: {data.class_name} - {data.section_name}</Text>
                    <Text style={styles.details}>Adm No: {data.admission_number}</Text>
                </View>

                <TouchableOpacity style={styles.downloadButton} onPress={handlePrint}>
                    <Text style={styles.downloadButtonText}>Download PDF</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    previewContainer: { padding: 20, flex: 1 },
    previewTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
    previewCard: { backgroundColor: '#fff', borderRadius: 16, padding: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
    schoolName: { fontSize: 18, fontWeight: 'bold', color: '#4f46e5', textAlign: 'center', marginBottom: 10 },
    certType: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginVertical: 10 },
    divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 15 },
    studentName: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    details: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 5 },
    downloadButton: { backgroundColor: '#4f46e5', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 'auto', marginBottom: 20 },
    downloadButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default CertificateView;
