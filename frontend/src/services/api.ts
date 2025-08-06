import axios from 'axios';

import type {
    AuthResponse,
    RegisterResponse,
    FileItem,
    FileListResponse,
    DownloadResponse,
    DeleteResponse
} from '../types/types.ts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export const authAPI = {
    register: async (email: string, password: string): Promise<RegisterResponse> => {
        const response = await api.post('/auth/register', {
            email,
            password
        });

        return response.data;
    },

    login: async (email: string, password: string): Promise<AuthResponse> => {
        const response = await api.post('/auth/login', {
            email,
            password
        });

        return response.data;
    },

};

export const filesAPI = {
    getFiles: async (page: number = 1, page_size: number = 50): Promise<FileListResponse> => {
        const response = await api.get('/files', {
            params: {page, page_size}
        });

        return response.data;
    },

    uploadFile: async (file: File): Promise<FileItem> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },

    getDownloadUrl: async (fileId: string): Promise<DownloadResponse> => {
        const response = await api.get(`/files/${fileId}/download`);

        return response.data;
    },

    deleteFile: async (fileId: string): Promise<DeleteResponse> => {
        const response = await api.delete(`/files/${fileId}`);

        return response.data;
    },
};