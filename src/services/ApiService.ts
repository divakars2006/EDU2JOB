// Frontend API Service
// Connects to the Python Backend API

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
    createdAt: string;
    certifications?: any[];
    skills?: string[];
    placementStatus?: any[];
    educations?: any[];
}

interface RegisterData {
    name: string;
    email: string;
    password: string;
}

interface LoginData {
    email: string;
    password: string;
}

interface ApiResponse {
    success: boolean;
    message?: string;
    data?: any;
    token?: string;
}

const API_URL = 'http://localhost:3001/api';

/**
 * Register a new user
 */
export const registerUser = async (data: RegisterData): Promise<ApiResponse> => {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Registration error:', error);
        return {
            success: false,
            message: 'Failed to connect to server.'
        };
    }
};

/**
 * Login user
 */
export const loginUser = async (data: LoginData): Promise<ApiResponse> => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            message: 'Failed to connect to server.'
        };
    }
};

/**
 * Google Login
 */
export const googleLogin = async (token: string): Promise<ApiResponse> => {
    try {
        const response = await fetch(`${API_URL}/google-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Google login error:', error);
        return {
            success: false,
            message: 'Failed to connect to server.'
        };
    }
};

/**
 * Get user by ID
 */
export const getUserById = async (id: string): Promise<ApiResponse> => {
    try {
        const response = await fetch(`${API_URL}/user/${id}`);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Get user error:', error);
        return {
            success: false,
            message: 'Failed to fetch user data.'
        };
    }
};

/**
 * Update user data
 */
export const updateUser = async (id: string, data: Partial<User> & { newPassword?: string }): Promise<ApiResponse> => {
    try {
        const response = await fetch(`${API_URL}/user/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Update user error:', error);
        return {
            success: false,
            message: 'Failed to update user data.'
        };
    }
};
