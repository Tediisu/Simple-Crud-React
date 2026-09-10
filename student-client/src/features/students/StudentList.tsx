import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchStudents, addStudent, deleteStudent, updateStudent } from './studentsSlice';
import { logout } from '../auth/authSlice';

export default function StudentList() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
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