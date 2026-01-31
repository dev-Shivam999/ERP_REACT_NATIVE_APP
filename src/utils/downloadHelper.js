import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import Toast from 'react-native-toast-message';

/**
 * Common utility to handle PDF generation and downloading/printing
 * @param {string} html - The HTML content to convert to PDF
 * @param {string} fileName - Suggestion for file name (used in sharing)
 * @param {boolean} forceShare - If true, always use sharing instead of print dialog
 */
export const downloadPDF = async (html, fileName = 'document', forceShare = false) => {
    try {
        Toast.show({
            type: 'info',
            text1: 'Generating PDF',
            text2: 'Please wait a moment...',
            autoHide: false
        });

        if (forceShare) {
            const { uri } = await Print.printToFileAsync({ html });
            Toast.hide();
            await Sharing.shareAsync(uri, {
                UTI: '.pdf',
                mimeType: 'application/pdf',
                dialogTitle: `Share / Save ${fileName}`
            });
        } else {
            // printAsync is better for Android as it opens the system print/save dialog
            // instead of the social share sheet.
            await Print.printAsync({ html });
            Toast.hide();
        }

        Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'PDF processing completed',
        });
    } catch (error) {
        console.error('Download PDF error:', error);
        Toast.hide();
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to generate PDF. Please try again.',
        });
    }
};
