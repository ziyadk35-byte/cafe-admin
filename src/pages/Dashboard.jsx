import React, { useEffect, useState } from 'react';
import client from '../api/client';

export default function Dashboard() {
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    client.get('/branches').then((res) => setBranches(res.data));
    client.get('/products').then((res) => setProducts(res.data));
  }, []);

  return (
    <div>
      <h1>نظرة عامة</h1>
      <div className="grid">
        <div className="card">
          <h2>الفروع</h2>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{branches.length}</div>
        </div>
        <div className="card">
          <h2>المنتجات</h2>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{products.length}</div>
        </div>
      </div>
      <div className="card">
        <h2>الفروع النشطة</h2>
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>العنوان</th>
              <th>نطاق التوصيل</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b._id}>
                <td>{b.name}</td>
                <td>{b.address}</td>
                <td>{(b.deliveryRadiusMeters / 1000).toFixed(1)} كم</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
