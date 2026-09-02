import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { logout } = useAuth();
  return (
    <div className="sidebar">
      <div className="brand">☕ لوحة الكافيه</div>
      <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
        نظرة عامة
      </NavLink>
      <NavLink to="/branches" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
        الفروع
      </NavLink>
      <NavLink to="/products" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
        المنتجات
      </NavLink>
      <NavLink to="/staff" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
        الموظفين
      </NavLink>
      <NavLink to="/coupons" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
        الكوبونات
      </NavLink>
      <NavLink to="/reports" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
        التقارير
      </NavLink>
      <NavLink to="/orders" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
        الطلبات
      </NavLink>
      <button className="logout-link" onClick={logout}>
        تسجيل الخروج
      </button>
    </div>
  );
}
