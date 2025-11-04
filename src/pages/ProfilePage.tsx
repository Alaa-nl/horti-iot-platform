import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import profileService, { UpdateProfileData } from '../services/profileService';
import Card from '../components/common/Card';
import { User } from '../services/authService';
import Layout from '../components/layout/Layout';

const ProfilePage: React.FC = () => {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<UpdateProfileData>({
    name: '',
    phone_number: '',
    department: '',
    location: '',
    bio: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone_number: profile.phone_number || '',
        department: profile.department || '',
        location: profile.location || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await profileService.getProfile();
      if (response.success && response.data) {
        setProfile(response.data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const response = await profileService.updateProfile(formData);
      if (response.success && response.data) {
        setProfile(response.data.user);
        setSuccess('Profile updated successfully');
        setIsEditing(false);
        await refreshUser();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const response = await profileService.uploadProfilePhoto(file);
      if (response.success && response.data) {
        setProfile(response.data.user);
        setSuccess('Profile photo updated successfully');
        await refreshUser();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) {
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const response = await profileService.removeProfilePhoto();
      if (response.success && response.data) {
        setProfile(response.data.user);
        setSuccess('Profile photo removed successfully');
        await refreshUser();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove photo');
    } finally {
      setUploading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30';
      case 'researcher': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30';
      case 'grower': return 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30';
      case 'farmer': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30';
      default: return 'bg-secondary text-foreground border';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="mt-2 text-muted-foreground">Manage your account information and preferences</p>
        </div>

        {error && (
          <div className="mb-6 bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-destructive hover:text-destructive"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
            <button
              onClick={() => setSuccess(null)}
              className="ml-4 text-green-500 hover:text-green-700"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Photo Section */}
          <Card>
            <div className="p-6 text-center">
              <div className="mb-4">
                {profile?.profile_photo ? (
                  <img
                    src={`${process.env.REACT_APP_API_URL?.replace('/api', '')}${profile.profile_photo}`}
                    alt="Profile"
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full mx-auto bg-secondary flex items-center justify-center">
                    <span className="text-muted-foreground text-4xl font-semibold">
                      {profile?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">{profile?.name}</h3>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleColor(profile?.role || '')}`}>
                {profile?.role}
              </span>

              <div className="mt-6 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </button>

                {profile?.profile_photo && (
                  <button
                    onClick={handleRemovePhoto}
                    disabled={uploading}
                    className="w-full bg-red-600 text-primary-foreground py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Profile Information */}
          <Card className="lg:col-span-2">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Profile Information</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        if (profile) {
                          setFormData({
                            name: profile.name || '',
                            phone_number: profile.phone_number || '',
                            department: profile.department || '',
                            location: profile.location || '',
                            bio: profile.bio || ''
                          });
                        }
                      }}
                      className="bg-gray-600 text-primary-foreground px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-background text-foreground border border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                        className="w-full bg-background text-foreground border border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Department
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="w-full bg-background text-foreground border border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full bg-background text-foreground border border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      rows={4}
                      className="w-full bg-background text-foreground border border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                      <p className="text-foreground">{profile?.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Role</label>
                      <p className="text-foreground capitalize">{profile?.role}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Phone Number</label>
                      <p className="text-foreground">{profile?.phone_number || 'Not provided'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Department</label>
                      <p className="text-foreground">{profile?.department || 'Not provided'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Location</label>
                      <p className="text-foreground">{profile?.location || 'Not provided'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Member Since</label>
                      <p className="text-foreground">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {profile?.bio && (
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Bio</label>
                      <p className="text-foreground whitespace-pre-wrap">{profile.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;