'use client'

import { useState, useEffect } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Calendar,
  Edit2, 
  Save, 
  X, 
  Camera, 
  Shield, 
  CreditCard, 
  Bell,
  Globe,
  Download,
  Upload,
  LogOut,
  CheckCircle,
  Eye,
  EyeOff,
  Trash2,
  Key,
  Users
} from 'lucide-react'
import AppLayout from '@/app/(page)/layouts/AppLayout'

const Page = () => {
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Mock user data
  const mockUser = {
    id: 1,
    name: 'Alex Johnson',
    email: 'alex.johnson@techcorp.com',
    phone: '+1 (555) 987-6543',
    position: 'Customer Support Manager',
    department: 'Customer Service',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    startDate: '2022-06-10',
    avatar: '/avatars/alex-johnson.jpg',
    bio: 'Experienced customer support manager with 8+ years in the industry. Passionate about building strong customer relationships and improving service quality.',
    stats: {
      totalCalls: 2_148,
      totalMessages: 1_567,
      satisfactionRate: 96.2,
      averageResponseTime: '1.8 min'
    },
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      language: 'en',
      timezone: 'America/Los_Angeles',
      theme: 'dark'
    },
    subscription: {
      plan: 'Team',
      status: 'active',
      renewalDate: '2024-12-20',
      users: 10,
      price: '$99/month',
      features: ['Unlimited Calls', 'Unlimited SMS', 'Advanced Analytics', 'Priority Support', 'Team Management']
    },
    team: [
      { id: 1, name: 'Sarah Wilson', role: 'Support Agent', status: 'active', lastActive: '2 hours ago' },
      { id: 2, name: 'Mike Chen', role: 'Support Agent', status: 'active', lastActive: '30 minutes ago' },
      { id: 3, name: 'Emily Davis', role: 'Support Specialist', status: 'away', lastActive: '5 hours ago' },
      { id: 4, name: 'David Brown', role: 'Team Lead', status: 'active', lastActive: 'Just now' }
    ]
  }

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    company: '',
    location: '',
    bio: ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    language: 'en',
    timezone: 'America/Los_Angeles',
    theme: 'dark'
  })

  useEffect(() => {
    // Simulate API call
    setIsLoading(true)
    setTimeout(() => {
      setUser(mockUser)
      setFormData({
        name: mockUser.name,
        email: mockUser.email,
        phone: mockUser.phone,
        position: mockUser.position,
        department: mockUser.department,
        company: mockUser.company,
        location: mockUser.location,
        bio: mockUser.bio
      })
      setPreferences(mockUser.preferences)
      setIsLoading(false)
    }, 1000)
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePreferenceChange = (name, value) => {
    setPreferences(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setUser(prev => ({
        ...prev,
        ...formData
      }))
      setIsEditing(false)
      setIsLoading(false)
      // Show success message
      alert('Profile updated successfully!')
    }, 1500)
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!')
      return
    }

    if (passwordData.newPassword.length < 8) {
      alert('New password must be at least 8 characters long!')
      return
    }

    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setIsLoading(false)
      // Show success message
      alert('Password changed successfully!')
    }, 1500)
  }

  const handleSavePreferences = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setUser(prev => ({
        ...prev,
        preferences: preferences
      }))
      setIsLoading(false)
      // Show success message
      alert('Preferences updated successfully!')
    }, 1000)
  }

  const handleExportData = () => {
    const data = {
      user: user,
      preferences: preferences,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `account-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDeleteAccount = () => {
    const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.')
    
    if (confirmDelete) {
      setIsLoading(true)
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false)
        alert('Account deletion scheduled. You will receive a confirmation email.')
        // Redirect to home page
        window.location.href = '/'
      }, 2000)
    }
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      // Simulate logout
      alert('Logged out successfully!')
      // Redirect to login page
      window.location.href = '/login'
    }
  }

  if (isLoading && !user) {
    return (
      <AppLayout>
        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60">Loading your account...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Account</h1>
              <p className="text-white/60">Manage your account settings and preferences</p>
            </div>
            
            <div className="flex space-x-3">
              {isEditing && activeTab === 'profile' ? (
                <>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white rounded-xl transition-all duration-200"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                </>
              ) : activeTab === 'profile' ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all duration-200"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sticky top-8">
                <nav className="space-y-2">
                  {[
                    { id: 'profile', label: 'Profile', icon: User },
                    { id: 'security', label: 'Security', icon: Shield },
                    { id: 'preferences', label: 'Preferences', icon: Bell },
                    { id: 'subscription', label: 'Subscription', icon: CreditCard },
                    { id: 'team', label: 'Team', icon: Users },
                    { id: 'privacy', label: 'Privacy & Data', icon: Globe }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id)
                        setIsEditing(false)
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                        activeTab === item.id
                          ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>
                
                <div className="mt-8 pt-6 border-t border-white/10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Log Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <div className="flex items-start space-x-6">
                      <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                          <User className="h-12 w-12 text-white" />
                        </div>
                        <button className="absolute bottom-2 right-2 w-8 h-8 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center transition-all duration-200">
                          <Camera className="h-4 w-4 text-white" />
                        </button>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                          {isEditing ? (
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              className="text-3xl font-bold text-white bg-white/10 border border-white/20 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          ) : (
                            <h2 className="text-3xl font-bold text-white">{user?.name}</h2>
                          )}
                          <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                            <span className="text-green-400 text-sm font-medium">Active</span>
                          </div>
                        </div>
                        
                        {isEditing ? (
                          <input
                            type="text"
                            name="position"
                            value={formData.position}
                            onChange={handleInputChange}
                            className="text-xl text-white/80 bg-white/10 border border-white/20 rounded-xl px-4 py-2 mb-2 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-xl text-white/80 mb-2">{user?.position}</p>
                        )}
                        
                        <div className="flex items-center space-x-6 text-white/60">
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4" />
                            {isEditing ? (
                              <input
                                type="text"
                                name="company"
                                value={formData.company}
                                onChange={handleInputChange}
                                className="bg-white/10 border border-white/20 rounded-xl px-3 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                            ) : (
                              <span>{user?.company}</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            {isEditing ? (
                              <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                className="bg-white/10 border border-white/20 rounded-xl px-3 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                            ) : (
                              <span>{user?.location}</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>Since {user?.startDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Personal Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Full Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          />
                        ) : (
                          <p className="text-white text-lg">{user?.name}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Email Address</label>
                        {isEditing ? (
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-white/40" />
                            <p className="text-white text-lg">{user?.email}</p>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Phone Number</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-white/40" />
                            <p className="text-white text-lg">{user?.phone}</p>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Department</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="department"
                            value={formData.department}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          />
                        ) : (
                          <p className="text-white text-lg">{user?.department}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <label className="block text-white/60 text-sm font-medium mb-2">Bio</label>
                      {isEditing ? (
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          rows="4"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                        />
                      ) : (
                        <p className="text-white/80 leading-relaxed">{user?.bio}</p>
                      )}
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Performance Overview</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Total Calls', value: user?.stats.totalCalls.toLocaleString(), color: 'bg-blue-500/20' },
                        { label: 'Messages Sent', value: user?.stats.totalMessages.toLocaleString(), color: 'bg-green-500/20' },
                        { label: 'Satisfaction Rate', value: `${user?.stats.satisfactionRate}%`, color: 'bg-purple-500/20' },
                        { label: 'Avg Response Time', value: user?.stats.averageResponseTime, color: 'bg-orange-500/20' }
                      ].map((stat, index) => (
                        <div key={index} className={`${stat.color} border border-white/10 rounded-2xl p-4 text-center`}>
                          <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                          <p className="text-white/60 text-sm">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Change Password</h3>
                    
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Current Password</label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
                          >
                            {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
                          >
                            {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleChangePassword}
                        disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-white/10 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200"
                      >
                        {isLoading ? 'Updating...' : 'Change Password'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Two-factor authentication is disabled</p>
                        <p className="text-white/60 text-sm mt-1">Add an extra layer of security to your account</p>
                      </div>
                      <button className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all duration-200">
                        Enable 2FA
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Active Sessions</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <div>
                          <p className="text-white font-medium">Current Session</p>
                          <p className="text-white/60 text-sm">San Francisco, CA • Chrome on Windows</p>
                          <p className="text-white/40 text-xs">Active now</p>
                        </div>
                        <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                          <span className="text-green-400 text-sm font-medium">Current</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <div>
                          <p className="text-white font-medium">Mobile Session</p>
                          <p className="text-white/60 text-sm">New York, NY • Safari on iPhone</p>
                          <p className="text-white/40 text-xs">2 days ago</p>
                        </div>
                        <button className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200">
                          Revoke
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Notification Preferences</h3>
                    
                    <div className="space-y-4">
                      {[
                        { id: 'emailNotifications', label: 'Email Notifications', description: 'Receive email notifications for important updates' },
                        { id: 'smsNotifications', label: 'SMS Notifications', description: 'Receive text messages for urgent matters' },
                        { id: 'pushNotifications', label: 'Push Notifications', description: 'Receive browser push notifications' }
                      ].map((pref) => (
                        <div key={pref.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <div>
                            <p className="text-white font-medium">{pref.label}</p>
                            <p className="text-white/60 text-sm">{pref.description}</p>
                          </div>
                          <button
                            onClick={() => handlePreferenceChange(pref.id, !preferences[pref.id])}
                            className={`w-12 h-6 rounded-full transition-all duration-200 ${
                              preferences[pref.id] ? 'bg-green-500' : 'bg-white/20'
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 transform ${
                              preferences[pref.id] ? 'translate-x-7' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={handleSavePreferences}
                      disabled={isLoading}
                      className="mt-6 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200"
                    >
                      {isLoading ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>

                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Appearance & Language</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Theme</label>
                        <select
                          value={preferences.theme}
                          onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="dark">Dark</option>
                          <option value="light">Light</option>
                          <option value="auto">Auto</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Language</label>
                        <select
                          value={preferences.language}
                          onChange={(e) => handlePreferenceChange('language', e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Timezone</label>
                        <select
                          value={preferences.timezone}
                          onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="America/New_York">Eastern Time (ET)</option>
                          <option value="America/Chicago">Central Time (CT)</option>
                          <option value="America/Denver">Mountain Time (MT)</option>
                          <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subscription Tab */}
              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Current Plan</h3>
                    
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-2xl font-bold text-white">{user?.subscription.plan} Plan</h4>
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                              <span className="text-green-400 text-sm font-medium capitalize">{user?.subscription.status}</span>
                            </div>
                            <span className="text-white/60 text-sm">Renews on {user?.subscription.renewalDate}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-white">{user?.subscription.price}<span className="text-lg text-white/60">/month</span></p>
                          <p className="text-white/60 text-sm">for {user?.subscription.users} users</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        {user?.subscription.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                            <span className="text-white/80">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex space-x-4 mt-6">
                        <button className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all duration-200">
                          Upgrade Plan
                        </button>
                        <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200">
                          Cancel Subscription
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Billing History</h3>
                    
                    <div className="space-y-4">
                      {[
                        { date: '2024-11-20', amount: '$99.00', status: 'Paid', invoice: 'INV-004' },
                        { date: '2024-10-20', amount: '$99.00', status: 'Paid', invoice: 'INV-003' },
                        { date: '2024-09-20', amount: '$99.00', status: 'Paid', invoice: 'INV-002' },
                        { date: '2024-08-20', amount: '$99.00', status: 'Paid', invoice: 'INV-001' }
                      ].map((invoice, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <div>
                            <p className="text-white font-medium">{invoice.date}</p>
                            <p className="text-white/60 text-sm">{invoice.invoice}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">{invoice.amount}</p>
                            <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full inline-block">
                              <span className="text-green-400 text-xs font-medium">{invoice.status}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button className="w-full mt-6 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200">
                      View All Invoices
                    </button>
                  </div>
                </div>
              )}

              {/* Team Tab */}
              {activeTab === 'team' && (
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Team Members</h3>
                    
                    <div className="space-y-4">
                      {user?.team.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{member.name}</p>
                              <p className="text-white/60 text-sm">{member.role} • {member.lastActive}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              member.status === 'active' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            }`}>
                              {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                            </div>
                            <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button className="w-full mt-6 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all duration-200">
                      Invite Team Member
                    </button>
                  </div>

                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Team Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Team Size</label>
                        <p className="text-white text-lg">{user?.team.length} members</p>
                      </div>
                      
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Available Seats</label>
                        <p className="text-white text-lg">{user?.subscription.users - user?.team.length} of {user?.subscription.users} available</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy & Data Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Data Management</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <div>
                          <p className="text-white font-medium">Export Your Data</p>
                          <p className="text-white/60 text-sm">Download all your personal data in JSON format</p>
                        </div>
                        <button
                          onClick={handleExportData}
                          className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all duration-200"
                        >
                          <Download className="h-4 w-4" />
                          <span>Export Data</span>
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <div>
                          <p className="text-white font-medium">Delete Account</p>
                          <p className="text-white/60 text-sm">Permanently delete your account and all associated data</p>
                        </div>
                        <button 
                          onClick={handleDeleteAccount}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Account</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Privacy Settings</h3>
                    
                    <div className="space-y-4">
                      {[
                        { id: 'dataCollection', label: 'Allow Data Collection', description: 'Help us improve by sharing usage data', enabled: true },
                        { id: 'personalizedAds', label: 'Personalized Advertising', description: 'See relevant ads based on your activity', enabled: false },
                        { id: 'thirdPartySharing', label: 'Third-Party Data Sharing', description: 'Share data with trusted partners', enabled: false }
                      ].map((setting) => (
                        <div key={setting.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <div>
                            <p className="text-white font-medium">{setting.label}</p>
                            <p className="text-white/60 text-sm">{setting.description}</p>
                          </div>
                          <button
                            className={`w-12 h-6 rounded-full transition-all duration-200 ${
                              setting.enabled ? 'bg-green-500' : 'bg-white/20'
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 transform ${
                              setting.enabled ? 'translate-x-7' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default Page