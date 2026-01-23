const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/* Register */
export const registerUser = async (data: any) => {
    return fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }).then(r => r.json());
};

/* Login */
export const loginUser = async (data: any) => {
    return fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }).then(r => r.json());
};

/* Google Login */
export const googleLogin = async (token: string) => {
    return fetch(`${API_BASE_URL}/api/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
    }).then(r => r.json());
};

/* Predict */
export const predictJob = async (data: any) => {
    return fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }).then(r => r.json());
};

/* Get User By ID */
export const getUserById = async (id: string) => {
    return fetch(`${API_BASE_URL}/api/user/${id}`).then(r => r.json());
};

/* Update User */
export const updateUser = async (id: string, data: any) => {
    return fetch(`${API_BASE_URL}/api/user/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }).then(r => r.json());
};
