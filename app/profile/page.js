"use client";

import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/agent/status');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPhoto = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('photo', selectedFile);
    try {
      const response = await fetch('/api/user/upload-photo', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setUser(prev => ({ ...prev, profilePhoto: data.profilePhoto }));
        setSelectedFile(null);
        alert('Profile photo updated!');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
        <div className="text-center mb-4">
          <div className="w-20 h-20 mx-auto mb-4">
            {user?.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border border-gray-300"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-600 text-2xl">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFile && (
              <button
                onClick={uploadPhoto}
                className="w-full bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700"
              >
                Upload Photo
              </button>
            )}
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">Name:</span> {user?.name}</p>
          <p><span className="font-medium">Email:</span> {user?.email}</p>
          <p><span className="font-medium">Timezone:</span> {user?.timezone}</p>
        </div>
      </div>
    </div>
  );
} 