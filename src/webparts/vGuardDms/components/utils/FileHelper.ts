import { File as FileIcon, FileText, FileSpreadsheet } from 'lucide-react';
import * as React from 'react';

export class FileHelper {
    public static getFileIcon(fileName: string): React.ReactElement {
        const extension = this.getFileExtension(fileName).toLowerCase();
        //Document files
        if(['doc', 'docx'].includes(extension)) {
            return React.createElement( FileText, { size: 32, color: '#2b579a'});
        }

        //Spreadsheet files
        if(['xls', 'xlsx', 'csv'].includes(extension)){
           return React.createElement( FileSpreadsheet, { size: 32, color: '#217346'}); 
        }

        //pdf files
        if(extension === 'pdf'){
            return React.createElement( FileText, { size: 32, color: '#d32f2f'});
        }

        // //Images
        // if(['jpg','jpeg','png','svg'].includes(extension)){
        //     return React.createElement( FileImage, { size: 32, color: '#ff9800'});
        // }

        //  // video
        // if(['mp4','avi','mov','mkv'].includes(extension)){
        //     return React.createElement( FileVideo, { size: 32, color: '#9c27b0'});
        // }

        // //Archive files
        // if(['zip','rar','7z','tar'].includes(extension)){
        //     return React.createElement( FileArchive, { size: 32, color: '#795548'});
        // }

        // // Code files
        // if (['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'json', 'xml'].includes(extension)) {
        //     return React.createElement(FileCode, { size: 32, color: '#4caf50' });
        // }

        // PowerPoint
        if (['ppt', 'pptx'].includes(extension)) {
            return React.createElement(FileText, { size: 32, color: '#d04423' });
        }

         // Default file icon
        return React.createElement(FileIcon, { size: 32, color: '#757575' });
    }

        public static getFileExtension(fileName: string): string {
            const lastName = fileName.lastIndexOf('.');
            if(lastName === -1) return '';
            return fileName.substring(lastName + 1);
        }

        public static formatFileSize(bytes: number | string): string {
            const sizeInBytes = typeof bytes === 'string' ? parseInt(bytes,10) : bytes;

            if(isNaN(sizeInBytes) || sizeInBytes === 0){
                return '0 B';
            }

            const units = ['B', 'KB', 'MB', 'DB', 'TB'];
            const k = 1024;
            const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));
            const size = sizeInBytes / Math.pow(k, i);

            return `${size.toFixed(1)} ${units[i]}`;
        }

        public static getFileType(fileName: string): string{
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
        // if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) {
        //     return 'Image';
        // }
        // if (['mp4', 'avi', 'mov', 'wmv', 'mkv'].includes(extension)) {
        //     return 'Video';
        // }
        // if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
        //     return 'Archive';
        // }
        // if (['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'json'].includes(extension)) {
        //     return 'Code';
        // }

        return 'File';
        }
    }
