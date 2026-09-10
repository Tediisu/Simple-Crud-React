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