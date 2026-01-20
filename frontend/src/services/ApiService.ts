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

const API_URL = 'http://localhost:5000/api';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
const ADMIN_API_URL = 'http://localhost:5000/admin';

/**
 * Login user (Unified: Tries User DB first, then Admin DB)
 */
export const loginUser = async (data: LoginData): Promise<ApiResponse> => {
    try {
        // 1. Try Regular User Login
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            return await response.json();
        }

        // 2. If User Login fails, Try Admin Login
        // We assume failure might be due to it being an admin account on the other backend
        console.log("User login failed, trying admin login...");

        const adminResponse = await fetch(`${ADMIN_API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: data.email,
                password: data.password
            }),
        });

        if (adminResponse.ok) {
            const adminResult = await adminResponse.json();
            // Normalize admin response to match expected User structure for Context
            return {
                success: true,
                message: 'Admin Login Successful',
                token: adminResult.token,
                data: {
                    id: 'admin-' + Date.now(),
                    name: 'Administrator',
                    email: data.email,
                    isAdmin: true, // Flag for frontend redirection
                    // Dummy data to prevent crashes in Dashboard UI
                    createdAt: new Date().toISOString(),
                    educations: [],
                    skills: [],
                    certifications: [],
                    placementStatus: []
                }
            };
        }

        // If both fail, return original error or generic
        return {
            success: false,
            message: 'Invalid email or password'
        };

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

export const predictJob = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response.json();
};
