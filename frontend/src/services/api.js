const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

// ─── AUTH ────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    }).then(handleResponse),

  register: (userData) =>
    fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    }).then(handleResponse),

  getMe: () =>
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: getHeaders()
    }).then(handleResponse),

  updateProfile: (data) =>
    fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  changePassword: (data) =>
    fetch(`${API_BASE_URL}/auth/password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse)
};

// ─── ASSESSMENTS ────────────────────────────────────────
export const assessmentAPI = {
  getAll: () =>
    fetch(`${API_BASE_URL}/assessments`, { headers: getHeaders() }).then(handleResponse),

  getStudentAssessments: () =>
    fetch(`${API_BASE_URL}/assessments/student`, { headers: getHeaders() }).then(handleResponse),

  getInstructorAssessments: () =>
    fetch(`${API_BASE_URL}/assessments/instructor`, { headers: getHeaders() }).then(handleResponse),

  getAdminAssessments: () =>
    fetch(`${API_BASE_URL}/assessments/admin`, { headers: getHeaders() }).then(handleResponse),

  getById: (id) =>
    fetch(`${API_BASE_URL}/assessments/${id}`, { headers: getHeaders() }).then(handleResponse),

  create: (data) =>
    fetch(`${API_BASE_URL}/assessments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  update: (id, data) =>
    fetch(`${API_BASE_URL}/assessments/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  delete: (id) =>
    fetch(`${API_BASE_URL}/assessments/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(handleResponse),

  enroll: (id, studentIds) =>
    fetch(`${API_BASE_URL}/assessments/${id}/enroll`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ studentIds })
    }).then(handleResponse)
};

// ─── SUBMISSIONS ────────────────────────────────────────
export const submissionAPI = {
  submit: (data) =>
    fetch(`${API_BASE_URL}/submissions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  getStudentSubmissions: () =>
    fetch(`${API_BASE_URL}/submissions/student`, { headers: getHeaders() }).then(handleResponse),

  getPendingSubmissions: () =>
    fetch(`${API_BASE_URL}/submissions/pending`, { headers: getHeaders() }).then(handleResponse),

  getByAssessment: (id) =>
    fetch(`${API_BASE_URL}/submissions/assessment/${id}`, { headers: getHeaders() }).then(handleResponse),

  getAll: () =>
    fetch(`${API_BASE_URL}/submissions/all`, { headers: getHeaders() }).then(handleResponse),

  evaluate: (id, data) =>
    fetch(`${API_BASE_URL}/submissions/${id}/evaluate`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse)
};

// ─── USERS ──────────────────────────────────────────────
export const userAPI = {
  getAll: () =>
    fetch(`${API_BASE_URL}/users`, { headers: getHeaders() }).then(handleResponse),

  getStudents: () =>
    fetch(`${API_BASE_URL}/users/students`, { headers: getHeaders() }).then(handleResponse),

  getInstructorStudentOverview: () =>
    fetch(`${API_BASE_URL}/users/instructor/overview`, { headers: getHeaders() }).then(handleResponse),

  create: (data) =>
    fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  update: (id, data) =>
    fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  delete: (id) =>
    fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(handleResponse)
};

// ─── ADMIN ──────────────────────────────────────────────
export const adminAPI = {
  getStats: () =>
    fetch(`${API_BASE_URL}/admin/stats`, { headers: getHeaders() }).then(handleResponse),

  getLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE_URL}/admin/logs?${query}`, { headers: getHeaders() }).then(handleResponse);
  },

  getSettings: () =>
    fetch(`${API_BASE_URL}/admin/settings`, { headers: getHeaders() }).then(handleResponse),

  updateSettings: (data) =>
    fetch(`${API_BASE_URL}/admin/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse)
};