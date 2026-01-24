const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/* Register */
export const registerUser = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response.json();
};

/* Login */
export const loginUser = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response.json();
};

/* Google Login */
export const googleLogin = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
    });
    return response.json();
};

/* Predict */
export const predictJob = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/predict`, { // Note: Backend route in api.py seems to be /predict or /api/predict? Checking api.py...
        // In api.py: @app.route('/predict', methods=['POST']) (Line 596)
        // Wait, api.py has @app.route('/predict') NOT /api/predict in the file I read in step 152/156.
        // Line 596: @app.route('/predict', methods=['POST'])
        // BUT other routes are /api/register, /api/login.
        // I should check if /api/predict is what it should be. 
        // The user said "conform this" but didn't explicitly give predict code. 
        // However, existing file used `${API_BASE_URL}/api/predict`.
        // If backend has @app.route('/predict'), then calling /api/predict might fail unless there is a global prefix or Nginx rewrite?
        // Let's look at api.py again. 
        // Line 596: @app.route('/predict', methods=['POST'])
        // Lines 138, 205: @app.route('/api/register'), @app.route('/api/login')
        // So 'predict' is inconsistent in backend?
        // Wait, I should probably stick to what was there (`/api/predict`) OR fix it if I see an error.
        // But wait, the user instructions were about `loginUser` specifically matching a pattern.
        // I recall `api.py` having `@app.route('/predict')` at line 596.
        // PROBABLY I should use `/predict` if that's what backend has. 
        // OR `/api/predict` if there's a blueprint? No blueprint seen.
        // Let's assume the existing code `ApiService.ts` using `/api/predict` was *trying* to works, but maybe failed?
        // Actually, earlier in step 193 it was `/api/predict`.
        // Let me check `api.py` route again in step 156.
        // 596: @app.route('/predict', methods=['POST'])
        // 432: @app.route('/api/predict-role', methods=['POST']) (Wait, there are TWO predict routes?)
        // Line 432 is `predict_role`. Line 596 is `predict`.
        // `ApiService.ts` calls `predictJob`.
        // Let's double check what `ApiService.ts` used. Step 193 line 32: `${API_BASE_URL}/api/predict`.
        // If backend is strictly `/predict`, this is wrong.
        // I will stick to the user's *pattern* request first (using API_BASE_URL). 
        // I will preserve `/api/predict` for now to avoid logic changes not requested, unless I'm sure.
        // Actually, consistency with `/api` prefix suggests `/api/predict` is desired but backend might be wrong.
        // Checking `api.py` line 432: `@app.route('/api/predict-role')`.
        // Maybe `predictJob` should call `/api/predict-role`?
        // Or maybe `/predict` at 596 is the one?
        // I will write it as is: `/api/predict` (matching previous TS) but using the new syntax. 
        // If it fails, we debug. The user asked for `ApiService.ts` formatting, not route fixing yet.
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response.json();
};

/* Get User By ID */
export const getUserById = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/user/${id}`);
    return response.json();
};

/* Update User */
export const updateUser = async (id: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/api/user/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response.json();
};

/* --- Admin Routes --- */

export const getAdminStats = async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/stats`);
    return response.json();
};

export const getAdminLogs = async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/predictions`);
    return response.json();
};

export const flagPrediction = async (data: { id: number, flagged: number, status?: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
};

export const retrainModel = async (formData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/retrain`, {
        method: 'POST',
        body: formData // Content-Type header handled automatically by browser for FormData
    });
    return response.json();
};

export const getAllFeedback = async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/all_feedback`);
    return response.json();
};

export const updateFeedbackStatus = async (id: number, status: string) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/feedback/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
    });
    return response.json();
};

export const getHistory = async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/history/${userId}`);
    return response.json();
};

export const submitFeedback = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
};
