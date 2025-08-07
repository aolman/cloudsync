

export interface User {
    id: string;
    email: string;
    created_date: string;
    is_active: boolean;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: {
        id: string;
        email: string;
    };
}

export interface RegisterResponse {
    id: string;
    email: string;
    created_date: string;
    is_active: boolean;
}

export interface UploadFile {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

export interface FileItem {
    id: string;
    filename: string;
    content_type: string;
    size: number;
    upload_date: string;
    is_public: boolean;
}

export interface UploadResponse extends FileItem {
    // UploadResponse is just a FileItem
}

export interface FileListResponse {
    files: FileItem[];
    total_count: number;
    page: number;
    page_size: number;
}

export interface DownloadResponse {
    download_url: string;
}

export interface DeleteResponse {
    detail: string;
}

export interface ShareLinkCreate {
    file_id: string;
    expires_in_hours?: number;
    allow_download: boolean;
}

export interface ShareLink {
    id: string;
    file_id: string;
    share_token: string;
    created_date: string;
    expires_date: string;
    allow_download: boolean;
    access_count: number;
}