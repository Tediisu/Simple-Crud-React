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