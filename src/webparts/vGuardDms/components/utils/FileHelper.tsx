import * as React from 'react';
import { File, FileText } from 'lucide-react';

export class FileHelper {

  public static getFileIcon(fileName: string): React.ReactElement {
    const extension = this.getFileExtension(fileName).toLowerCase();

    // Word documents
    if (['doc', 'docx'].includes(extension)) {
      return (
  <div style={{
    width: 80,
    height: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <img
      src={require('../../assets/DocIcon.jpg')}
      alt="Word"
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain'
      }}
    />
  </div>
);

    }

    // Excel / CSV
    if (['xls', 'xlsx', 'csv'].includes(extension)) {
     return (
  <div style={{
    width: 80,
    height: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <img
      src={require('../../assets/ExcelIcon.png')}
      alt="Excel"
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain'
      }}
    />
  </div>
);

    }

    // PDF
    if (extension === 'pdf') {
      return (
  <div style={{
    width: 80,
    height: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <img
      src={require('../../assets/pdfIcon.jpg')}
      alt="PDF"
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain'
      }}
    />
  </div>
);

    }

    // PowerPoint
    if (['ppt', 'pptx'].includes(extension)) {
      return (
  <div style={{
    width: 80,
    height: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <img
      src={require('../../assets/pptIcon.png')}
      alt="PPT"
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain'
      }}
    />
  </div>
);
    }


    // Default icon
    return <File size={32} />;
  }

  public static getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1) return '';
    return fileName.substring(lastDot + 1);
  }

  public static formatFileSize(bytes: number | string): string {
    const sizeInBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;

    if (isNaN(sizeInBytes) || sizeInBytes === 0) {
      return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));
    const size = sizeInBytes / Math.pow(k, i);

    return `${size.toFixed(1)} ${units[i]}`;
  }

  public static getFileType(fileName: string): string {
    const extension = this.getFileExtension(fileName).toLowerCase();

    if (['doc', 'docx', 'pdf'].includes(extension)) {
      return 'Document';
    }
    if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return 'Spreadsheet';
    }
    if (['ppt', 'pptx'].includes(extension)) {
      return 'Presentation';
    }

    return 'File';
  }
}
