import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const fetchBanners = async () => {
    const res = await api.get('/api/banners', { auth: 'admin' });
    if (res.success && Array.isArray(res.data)) {
      setBanners(res.data);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const addBanner = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file first.');
      return;
    }
    
    const formData = new FormData();
    formData.append('image', selectedFile);

    const res = await api.upload('/api/banners', formData, { auth: 'admin' });
    if (res.success) {
      fetchBanners();
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      alert(res.error || 'Gagal menambahkan banner.');
    }
  };

  const deleteBanner = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    const res = await api.delete(`/api/banners/${id}`, { auth: 'admin' });
    if (res.success) {
      fetchBanners();
    } else {
      alert(res.error || 'Gagal menghapus banner.');
    }
  };

  return (
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
  );
}
