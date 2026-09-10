# Student Client — React + Redux Toolkit Setup Guide

## Project Structure

```
student-client/
├── src/
│   ├── app/
│   │   ├── store.ts
│   │   └── hooks.ts
│   ├── features/
│   │   ├── auth/
│   │   │   ├── authSlice.ts
│   │   │   └── LoginForm.tsx
│   │   └── students/
│   │       ├── studentsSlice.ts
│   │       └── StudentList.tsx
│   ├── api/
│   │   └── axios.ts
│   ├── types/
│   │   └── index.ts
│   ├── components/
│   │   └── PrivateRoute.tsx
│   ├── App.tsx
│   └── main.tsx
```

---

## Step 1 — Scaffold the Project

```bash
npm create vite@latest student-client -- --template react-ts
cd student-client
npm install
```

## Step 2 — Install Dependencies

```bash
npm install @reduxjs/toolkit react-redux axios react-router-dom
```

---

## Step 3 — Foundations

These pieces have no UI and no dependencies on each other — set them up first.

### 3.1 Types — `src/types/index.ts`

```typescript
export interface Student {
  id: number;
  name: string;
  email: string;
  course: string;
  created_at?: string;
}

export interface AuthState {
  token: string | null;
  username: string | null;
}
```

### 3.2 Axios instance — `src/api/axios.ts`

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 3.3 Redux store — `src/app/store.ts`

```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import studentsReducer from '../features/students/studentsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    students: studentsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 3.4 Typed hooks — `src/hooks/hooks.ts`

```typescript
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

## Step 4 — Auth (build and wire this first)

Get login working end-to-end before touching students, so you have a working, protected route to land on.

### 4.1 Auth slice — `src/features/auth/authSlice.ts`

```typescript
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';
import type { AuthState } from '../../types';

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  username: localStorage.getItem('username'),
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string }) => {
    const res = await api.post('/auth/login', credentials);
    return { token: res.data.token, username: credentials.username };
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.username = null;
      localStorage.removeItem('token');
      localStorage.removeItem('username');
    },
  },
  extraReducers: (builder) => {
    builder.addCase(login.fulfilled, (state, action: PayloadAction<{ token: string; username: string }>) => {
      state.token = action.payload.token;
      state.username = action.payload.username;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('username', action.payload.username);
    });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
```

### 4.2 Login form — `src/features/auth/LoginForm.tsx`

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { login } from './authSlice';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(login({ username, password })).unwrap();
      navigate('/students');
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="auth-card">
      <h2>Sign in</h2>
      <form onSubmit={handleSubmit}>
        {error && <p className="error-text">{error}</p>}
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}
```

### 4.3 Private route guard — `src/components/PrivateRoute.tsx`

```tsx
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const token = useAppSelector((state) => state.auth.token);
  return token ? <>{children}</> : <Navigate to="/login" />;
}
```

---

## Step 5 — Students (the protected page behind login)

### 5.1 Students slice — `src/features/students/studentsSlice.ts`

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import type { Student } from '../../types';

interface StudentsState {
  items: Student[];
  status: 'idle' | 'loading' | 'failed';
}

const initialState: StudentsState = {
  items: [],
  status: 'idle',
};

export const fetchStudents = createAsyncThunk('students/fetchAll', async () => {
  const res = await api.get<Student[]>('/students');
  return res.data;
});

export const addStudent = createAsyncThunk(
  'students/add',
  async (student: Omit<Student, 'id' | 'created_at'>) => {
    const res = await api.post<Student>('/students', student);
    return res.data;
  }
);

export const updateStudent = createAsyncThunk(
  'students/update',
  async ({ id, data }: { id: number; data: Omit<Student, 'id' | 'created_at'> }) => {
    const res = await api.put<Student>(`/students/${id}`, data);
    return res.data;
  }
);

export const deleteStudent = createAsyncThunk('students/delete', async (id: number) => {
  await api.delete(`/students/${id}`);
  return id;
});

const studentsSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload;
      })
      .addCase(addStudent.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        const idx = state.items.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s.id !== action.payload);
      });
  },
});

export default studentsSlice.reducer;
```

### 5.2 Student list + inline add/edit form — `src/features/students/StudentList.tsx`

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchStudents, addStudent, deleteStudent, updateStudent } from './studentsSlice';
import { logout } from '../auth/authSlice';

export default function StudentList() {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((state) => state.students);
  const [form, setForm] = useState({ name: '', email: '', course: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchStudents());
  }, [dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId !== null) {
      dispatch(updateStudent({ id: editingId, data: form }));
      setEditingId(null);
    } else {
      dispatch(addStudent(form));
    }
    setForm({ name: '', email: '', course: '' });
  };

  const startEdit = (id: number) => {
    const student = items.find((s) => s.id === id);
    if (student) {
      setForm({ name: student.name, email: student.email, course: student.course });
      setEditingId(id);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="page">
      <div className="students-header">
        <h2>Students</h2>
        <div className="button" onClick={handleLogout}></div>
      </div>

      <form className="student-form" onSubmit={handleSubmit}>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
        <input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="Course" />
        <button type="submit">{editingId !== null ? 'Update' : 'Add'}</button>
      </form>

      {status === 'loading' && <p className="empty-state">Loading…</p>}
      {status !== 'loading' && items.length === 0 && <p className="empty-state">No students yet.</p>}

      <ul className="student-list">
        {items.map((s) => (
          <li key={s.id} className="student-row">
            <div className="student-info">
              <span className="student-name">{s.name}</span>
              <span className="student-meta">{s.email} · {s.course}</span>
            </div>
            <div className="student-actions">
              <button onClick={() => startEdit(s.id)}>Edit</button>
              <button className="delete-btn" onClick={() => dispatch(deleteStudent(s.id))}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Step 6 — Wire Everything Together

### 6.1 App + routing — `src/App.tsx`

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginForm from './features/auth/LoginForm';
import StudentList from './features/students/StudentList';
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route
          path="/students"
          element={
            <PrivateRoute>
              <StudentList />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<LoginForm />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 6.2 Entry point + store provider — `src/main.tsx`

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
```

---

## Step 7 — Styling — `src/index.css`

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #F7F5F0;
  color: #1A1D23;
  min-height: 100vh;
}

h1, h2 {
  font-family: Georgia, 'Times New Roman', serif;
  font-weight: 400;
}

.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 48px 24px;
}

/* Login */
.auth-card {
  max-width: 360px;
  margin: 80px auto;
  padding: 40px 32px;
  background: #fff;
  border: 1px solid #E8E4DA;
}

.auth-card h2 {
  font-size: 28px;
  margin-bottom: 24px;
}

.auth-card form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.error-text {
  color: #C4491D;
  font-size: 14px;
  margin-bottom: 8px;
}

/* Inputs */
input {
  padding: 10px 12px;
  border: 1px solid #C9C4B6;
  background: #fff;
  font-size: 15px;
  font-family: inherit;
}

input:focus {
  outline: 2px solid #3D5A5B;
  outline-offset: 1px;
  border-color: #3D5A5B;
}

button {
  padding: 10px 16px;
  background: #3D5A5B;
  color: #fff;
  border: none;
  font-size: 15px;
  cursor: pointer;
  font-family: inherit;
}

button:hover {
  background: #2E4546;
}

/* Students page */
.students-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 32px;
  border-bottom: 2px solid #1A1D23;
  padding-bottom: 12px;
}

.students-header h2 {
  font-size: 26px;
}

.student-form {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.student-form input {
  flex: 1;
  min-width: 140px;
}

.student-list {
  list-style: none;
  border-top: 1px solid #C9C4B6;
}

.student-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #C9C4B6;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.student-name {
  font-weight: 600;
  font-size: 15px;
}

.student-meta {
  font-size: 13px;
  color: #5A5A52;
}

.student-actions {
  display: flex;
  gap: 8px;
}

.student-actions button {
  padding: 6px 12px;
  font-size: 13px;
  background: transparent;
  color: #3D5A5B;
  border: 1px solid #3D5A5B;
}

.student-actions button:hover {
  background: #3D5A5B;
  color: #fff;
}

.student-actions .delete-btn {
  color: #C4491D;
  border-color: #C4491D;
}

.student-actions .delete-btn:hover {
  background: #C4491D;
  color: #fff;
}

.empty-state {
  padding: 32px 0;
  text-align: center;
  color: #5A5A52;
  font-size: 14px;
}

.button {
  height: 30px;
  width: 50px;
  background: #C4491D;
}
```