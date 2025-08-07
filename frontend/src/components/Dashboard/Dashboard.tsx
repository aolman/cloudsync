import React, { useState } from 'react';
import { Upload, Files, Grid, List } from 'lucide-react';
import FileUpload from '../FileUpload/FileUpload';
import FileList from '../FileList/FileList'

type ViewMode = 'upload' | 'files';

const Dashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleUploadComplete = (files: File[]) => {
    console.log('Files uploaded successfully:', files);
    setUploadedFiles(prev => [...prev, ...files]);
    
    // Optional: Switch to files view after upload
    // setActiveView('files');
    
    // You might want to refresh the file list here
    // or trigger a refetch of files from the backend
  };

  const tabs = [
    {
      id: 'upload' as ViewMode,
      label: 'Upload Files',
      icon: Upload,
    },
    {
      id: 'files' as ViewMode,
      label: 'My Files',
      icon: Files,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`
                  group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm
                  ${activeView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon 
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${activeView === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="min-h-96">
        {activeView === 'upload' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Upload Files
              </h2>
              <p className="text-gray-600">
                Drag and drop your files here or click to browse.
              </p>
            </div>
            
            <FileUpload 
              onUploadComplete={handleUploadComplete}
              maxFileSize={100} // 100MB
              maxFiles={10}
              acceptedFileTypes={[]} // Accept all file types for now
            />

            {/* Recent uploads summary */}
            {uploadedFiles.length > 0 && (
              <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">
                  Recently Uploaded ({uploadedFiles.length})
                </h3>
                <div className="space-y-1">
                  {uploadedFiles.slice(-3).map((file, index) => (
                    <p key={index} className="text-sm text-green-700">
                      ✓ {file.name}
                    </p>
                  ))}
                  {uploadedFiles.length > 3 && (
                    <p className="text-sm text-green-600">
                      ... and {uploadedFiles.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'files' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                My Files
              </h2>
              <p className="text-gray-600">
                Manage and download your uploaded files.
              </p>
            </div>
            
            <FileList />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;