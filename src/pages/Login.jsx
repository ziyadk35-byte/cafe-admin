import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'حصل خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-box" onSubmit={handleSubmit}>
        <h1>لوحة التحكم</h1>
        <label>رقم الموبايل</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" />
        <label>كلمة المرور</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        {error && <div className="error-text">{error}</div>}
        <button className="btn" style={{ width: '100%' }} disabled={loading}>
          {loading ? '...جاري الدخول' : 'دخول'}
        </button>
      </form>
    </div>
  );
}
