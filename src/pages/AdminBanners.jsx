import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../components/AdminNav';

export default function AdminBanners() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [banners, setBanners] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      setToken('');
      localStorage.removeItem('adminToken');
    }
  };

  const login = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      setToken(data.data.token);
      localStorage.setItem('adminToken', data.data.token);
      fetchBanners();
    } else {
      alert(data.error);
    }
  };

  const fetchBanners = async () => {
    const res = await fetch('/api/banners');
    const data = await res.json();
    if (data.success) {
      setBanners(data.data);
    }
  };

  useEffect(() => {
    if (token) fetchBanners();
  }, [token]);

  const addBanner = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file first.');
      return;
    }
    
    const formData = new FormData();
    formData.append('image', selectedFile);

    const res = await fetch('/api/banners', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      fetchBanners();
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      alert(data.error);
    }
  };

  const deleteBanner = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    const res = await fetch(`/api/banners/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      fetchBanners();
    } else {
      alert(data.error);
    }
  };

  if (!token) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
        <form onSubmit={login} className="flex flex-col gap-3">
          <input className="border p-2" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
          <input className="border p-2" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
          <button className="bg-blue-600 text-white p-2" type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-cream/40 pb-16">
      <AdminNav activeTab="banners" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

      <div className="bg-gray-100 p-4 rounded mb-8">
        <h2 className="font-bold mb-3">Add Banner (webp, png, jpg)</h2>
        <form onSubmit={addBanner} className="flex gap-2">
          <input 
            type="file" 
            accept="image/png, image/jpeg, image/jpg, image/webp" 
            className="border p-2 flex-1 bg-white" 
            ref={fileInputRef}
            onChange={e => setSelectedFile(e.target.files[0])} 
          />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Upload</button>
        </form>
      </div>

      <div className="flex flex-col gap-4">
        {banners.map(b => (
          <div key={b.id} className="border p-3 flex justify-between items-center bg-white shadow-sm rounded">
            <div className="flex items-center gap-4">
              <img src={b.image_url} alt="Banner" className="h-16 w-32 object-cover rounded" />
              <div>
                <p className="text-sm text-gray-500">Uploaded: {new Date(b.created_at).toLocaleString()}</p>
                <p className="text-xs text-gray-400">File: {b.filename}</p>
              </div>
            </div>
            <button onClick={() => deleteBanner(b.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Delete</button>
          </div>
        ))}
        {banners.length === 0 && <p className="text-gray-500 italic">No banners uploaded yet.</p>}
      </div>
    </div>
    </div>
  );
}
