"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Calendar, Users, Mail, Globe, MapPin, Briefcase, Save, Edit3 } from 'lucide-react';

const BossProfile = () => {
  const router = useRouter();
  const [boss, setBoss] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    company: '',
    position: '',
    timezone: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles', 
    'Europe/London',
    'Asia/Tokyo',
    'Asia/Kolkata',
    'Australia/Sydney'
  ];

  const positions = [
    'CEO',
    'CTO',
    'Manager',
    'Director',
    'VP',
    'Team Lead',
    'Department Head',
    'Other'
  ];

  useEffect(() => {
    fetchBossData();
  }, []);

  const fetchBossData = async () => {
    try {
      const response = await fetch('/api/boss/agent/status');
      if (response.ok) {
        const data = await response.json();
        setBoss(data.boss);
        setEditForm({
          name: data.boss.name,
          company: data.boss.company,
          position: data.boss.position,
          timezone: data.boss.timezone
        });
      } else {
        router.push('/boss/login');
      }
    } catch (error) {
      console.error('Failed to fetch boss data:', error);
      router.push('/boss/login');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPhoto = async () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('photo', selectedFile);
    
    try {
      const response = await fetch('/api/boss/user/upload-photo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setBoss(prev => ({ ...prev, profilePhoto: data.profilePhoto }));
        setSelectedFile(null);
        alert('Profile photo updated successfully!');
      } else {
        alert('Failed to upload photo: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Failed to upload photo. Please try again.');
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/boss/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();
      
      if (data.success) {
        setBoss(prev => ({ ...prev, ...editForm }));
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditForm({
      name: boss.name,
      company: boss.company,
      position: boss.position,
      timezone: boss.timezone
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Boss Profile</h1>
              <p className="text-gray-600 mt-2">Manage your business profile and account settings</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm text-gray-500">Account Type</p>
                <div className="flex items-center mt-1">
                  <Building2 size={16} className="text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-black">Business Manager</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Photo & Basic Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-black mb-6">Profile Photo</h2>
              
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-6 relative">
                  {boss?.profilePhoto ? (
                    <img
                      src={boss.profilePhoto}
                      alt="Boss Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                      <Building2 size={48} className="text-blue-600" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer"
                  />
                  {selectedFile && (
                    <button
                      onClick={uploadPhoto}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Update Photo
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-medium text-black mb-4">Account Overview</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Member Since</span>
                    <span className="text-sm text-black font-medium">
                      {boss?.createdAt ? new Date(boss.createdAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Account Status</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Boss AI Status</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      boss?.bossAgent?.status === 'active' ? 'bg-green-100 text-green-800' :
                      boss?.bossAgent?.status === 'created' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {boss?.bossAgent?.status === 'active' ? 'Active' :
                       boss?.bossAgent?.status === 'created' ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details & Settings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-black">Profile Information</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Edit3 size={16} />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveProfile}
                        disabled={isSaving}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400"
                      >
                        {isSaving ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Save size={16} />
                        )}
                        <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Users size={16} className="mr-2" />
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      />
                    ) : (
                      <p className="text-black font-medium">{boss?.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Mail size={16} className="mr-2" />
                      Email Address
                    </label>
                    <p className="text-black font-medium">{boss?.email}</p>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Company */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Building2 size={16} className="mr-2" />
                      Company Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.company}
                        onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      />
                    ) : (
                      <p className="text-black font-medium">{boss?.company}</p>
                    )}
                  </div>

                  {/* Position */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Briefcase size={16} className="mr-2" />
                      Position
                    </label>
                    {isEditing ? (
                      <select
                        value={editForm.position}
                        onChange={(e) => setEditForm({...editForm, position: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      >
                        {positions.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-black font-medium">{boss?.position}</p>
                    )}
                  </div>

                  {/* Timezone */}
                  <div className="md:col-span-2">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Globe size={16} className="mr-2" />
                      Timezone
                    </label>
                    {isEditing ? (
                      <select
                        value={editForm.timezone}
                        onChange={(e) => setEditForm({...editForm, timezone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      >
                        {timezones.map(tz => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-black font-medium">{boss?.timezone}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Agent Information */}
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-black">Boss AI Agent</h2>
                <p className="text-gray-600 mt-1">Your personal AI assistant for business management</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Agent Status</label>
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        boss?.bossAgent?.status === 'active' ? 'bg-green-500' :
                        boss?.bossAgent?.status === 'created' ? 'bg-blue-600' : 'bg-gray-400'
                      }`}></div>
                      <span className="text-black font-medium">
                        {boss?.bossAgent?.status === 'active' ? 'Fully Operational' :
                         boss?.bossAgent?.status === 'created' ? 'Ready for Management' : 'Setting Up'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Calendar Integration</label>
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        boss?.googleCalendar?.connected ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                      <span className="text-black font-medium">
                        {boss?.googleCalendar?.connected ? 'Connected & Synced' : 'Not Connected'}
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Agent ID</label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-mono text-black break-all">
                        {boss?.bossAgent?.agentId || 'Pending Creation'}
                      </p>
                    </div>
                  </div>
                </div>

                {boss?.bossAgent?.status === 'not_created' && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <Building2 size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-blue-900 font-medium">AI Agent Setup in Progress</p>
                        <p className="text-blue-700 text-sm">Your Boss AI agent is being initialized with management capabilities.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Security Section */}
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-black">Security & Privacy</h2>
                <p className="text-gray-600 mt-1">Manage your account security and privacy settings</p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-black font-medium">Password</p>
                      <p className="text-sm text-gray-600">Last updated 30 days ago</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-medium">
                      Change Password
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-black font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-600">Add an extra layer of security</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-medium">
                      Enable 2FA
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-black font-medium">Data Export</p>
                      <p className="text-sm text-gray-600">Download your account data</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-medium">
                      Request Export
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BossProfile;