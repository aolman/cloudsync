import React, { useState, useEffect } from 'react';
import { Download, Trash2, FileText, Image, Video, Music, Archive, File, RefreshCw } from 'lucide-react';
import { filesAPI } from '../../services/api';
import type { FileItem } from '../../types/types.ts';

// No props needed right now
interface FileListProps {

}

function FileList(props: FileListProps) {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getFileIcon = (contentType: string): React.ReactNode => {
        if (contentType.startsWith('image/')) {
            return <Image className="w-5 h-5 text-blue-500" />;
        } else if (contentType.startsWith('video/')) {
            return <Video className="w-5 h-5 text-purple-500" />;
        } else if (contentType.startsWith('audio/')) {
            return <Music className="w-5 h-5 text-green-500" />;
        } else if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('tar')) {
            return <Archive className="w-5 h-5 text-yellow-500" />;
        } else if (contentType.includes('text') || contentType.includes('document')) {
            return <FileText className="w-5 h-5 text-gray-600" />;
        } else {
            return <File className="w-5 h-5 text-gray-400" />;
        }
    };

    const fetchFiles = async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const response = await filesAPI.getFiles();
            setFiles(response.files || []);
        } catch (err: any) {
            console.error('Failed to fetch files:', err);
            setError(err.response?.data?.detail || 'Failed to load files');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (fileId: string, filename: string): Promise<void> => {
        try {
            const response = await filesAPI.getDownloadUrl(fileId);
            const link = document.createElement('a');
            link.href = response.download_url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err: any) {
            console.error('Download failed:', err);
            alert('Download failed. Please try again.');
        }
    };

    const handleDelete = async (fileId: string, filename: string): Promise<void> => {
        const confirmed = window.confirm(`Are you sure you want to delete "${filename}"?`)
        if (!confirmed) return;

        try {
            await filesAPI.deleteFile(fileId);
            setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
        } catch (err: any) {
            console.error('Delete failed:', err);
            alert('Delete failed. Please try again.');
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-gray-600">Loading your files...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-600 mb-4">{error}</div>
                <button
                onClick={fetchFiles}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                Try Again
                </button>
            </div>
        );
    }

    if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No files yet</h3>
        <p className="text-gray-600 mb-4">Upload some files to get started!</p>
        <button
          onClick={fetchFiles}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with file count and refresh button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Your Files ({files.length})
        </h3>
        <button
          onClick={fetchFiles}
          className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* File list - each file is a row */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {files.map((file) => (
            <div
              key={file.id}
              className="p-4 hover:bg-gray-50 flex items-center justify-between"
            >
              {/* Left side - file info */}
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getFileIcon(file.content_type)}
                
                {/* File details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.filename}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{formatDate(file.upload_date)}</span>
                    {file.is_public && (
                      <>
                        <span>•</span>
                        <span className="text-green-600">Public</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side - action buttons */}
              <div className="flex items-center space-x-2">
                {/* Download button */}
                <button
                  onClick={() => handleDownload(file.id, file.filename)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Download file"
                >
                  <Download className="w-4 h-4" />
                </button>
                
                {/* Delete button */}
                <button
                  onClick={() => handleDelete(file.id, file.filename)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileList;