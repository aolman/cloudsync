import React, { useState, useCallback } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react';
import type { UploadFile } from '../../types/types.ts'
import { filesAPI } from '../../services/api.ts'

interface FileUploadProps {
    onUploadComplete?: (files: File[]) => void;
    maxFileSize ?: number;
    acceptedFileTypes?: string[];
    maxFiles ?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
    onUploadComplete,
    maxFileSize = 100,
    acceptedFileTypes = [],
    maxFiles = 10
}) => {
    const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);

    const createUploadFile = (file: File): UploadFile => ({
        id: Math.random().toString(36).substring(7),
        file,
        progress: 0,
        status: 'pending'
    });

    const validateFile = (file: File): string | null => {
    if (maxFileSize && file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }
    
    if (acceptedFileTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type.toLowerCase();
      
      const isValidType = acceptedFileTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.substring(1);
        }
        return mimeType.includes(type);
      });
      
      if (!isValidType) {
        return `File type not supported. Accepted types: ${acceptedFileTypes.join(', ')}`;
      }
    }
    
    return null;
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (uploadFiles.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newUploadFiles: UploadFile[] = [];
    
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        newUploadFiles.push({
          ...createUploadFile(file),
          status: 'error',
          error
        });
      } else {
        newUploadFiles.push(createUploadFile(file));
      }
    });

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  }, [uploadFiles.length, maxFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting same file again
    e.target.value = '';
  }, [handleFiles]);

  const removeFile = useCallback((id: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  const uploadFileToServer = async (uploadFile: UploadFile) => {
    try {
      setUploadFiles(prev => 
        prev.map(f => f.id === uploadFile.id ? { 
          ...f, 
          status: 'uploading' as const,
          progress: 0 
        } : f)
      );
      const formData = new FormData();
      formData.append('file', uploadFile.file);
      
      const result = await filesAPI.uploadFile(uploadFile.file);
      console.log('Upload successful:', result);

      setUploadFiles(prev => 
        prev.map(f => f.id === uploadFile.id ? { ...f, progress: 50 } : f)
      );
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mark as complete
      setUploadFiles(prev => 
        prev.map(f => f.id === uploadFile.id ? { 
          ...f, 
          status: 'success' as const, 
          progress: 100 
        } : f)
      );

    } catch (error: any) {
      console.error('Upload failed:', error);
      
      // Mark as failed
      setUploadFiles(prev => 
        prev.map(f => f.id === uploadFile.id ? { 
          ...f, 
          status: 'error' as const,
          error: error.response?.data?.detail || 'Upload failed'
        } : f)
      );
    }
  };

  const startUpload = async () => {
    const filesToUpload = uploadFiles.filter(f => f.status === 'pending');
    
    // Upload files one by one (you might want to do this in parallel)
    for (const uploadFile of filesToUpload) {
      await uploadFileToServer(uploadFile);
    }

    // Call callback with successfully uploaded files
    const successfulFiles = uploadFiles
      .filter(f => f.status === 'success')
      .map(f => f.file);
    
    if (successfulFiles.length > 0 && onUploadComplete) {
      onUploadComplete(successfulFiles);
    }
  };

  const clearCompleted = () => {
    setUploadFiles(prev => prev.filter(f => f.status !== 'success'));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <File className="w-5 h-5 text-gray-400" />;
    }
  };

  const hasValidFiles = uploadFiles.some(f => f.status === 'pending');
  const isUploading = uploadFiles.some(f => f.status === 'uploading');

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="space-y-4">
        {/* Drop Zone */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            onChange={handleFileInput}
            accept={acceptedFileTypes.join(',')}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-2">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-600">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-400">
                {maxFileSize && `Max ${maxFileSize}MB per file. `}
                {maxFiles && `Up to ${maxFiles} files.`}
                {acceptedFileTypes.length > 0 && ` Accepted: ${acceptedFileTypes.join(', ')}`}
              </p>
            </div>
          </div>
        </div>

        {/* File List */}
        {uploadFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-700">Files ({uploadFiles.length})</h3>
              <button
                onClick={clearCompleted}
                className="text-sm text-gray-500 hover:text-gray-700"
                disabled={!uploadFiles.some(f => f.status === 'success')}
              >
                Clear completed
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uploadFiles.map(uploadFile => (
                <div
                  key={uploadFile.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  {getStatusIcon(uploadFile.status)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadFile.file.size)}
                    </p>
                    
                    {uploadFile.status === 'uploading' && (
                      <div className="mt-1">
                        <div className="bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadFile.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {uploadFile.error && (
                      <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
                    )}
                  </div>

                  <button
                    onClick={() => removeFile(uploadFile.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    disabled={uploadFile.status === 'uploading'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        {hasValidFiles && (
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setUploadFiles([])}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isUploading}
            >
              Clear All
            </button>
            <button
              onClick={startUpload}
              disabled={isUploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? 'Uploading...' : `Upload ${uploadFiles.filter(f => f.status === 'pending').length} Files`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;