/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
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
  Bell, 
  Shield, 
  Globe, 
  CreditCard,
  Download,
  LogOut,
  CheckCircle,
  Eye,
  EyeOff
} from "lucide-react";
import AppLayout from "@/app/(page)/layouts/AppLayout";

const Page = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Mock user data
  const mockUser = {
    id: 1,
    name: "John Doe",
    email: "john.doe@company.com",
    phone: "+1 (555) 123-4567",
    position: "Senior Customer Support Specialist",
    department: "Customer Service",
    company: "TechCorp Inc.",
    location: "New York, NY",
    startDate: "2023-03-15",
    avatar: "/avatars/john-doe.jpg",
    coverImage: "/covers/profile-cover.jpg",
    bio: "Dedicated customer support professional with 5+ years of experience in providing exceptional service and building strong customer relationships.",
    stats: {
      totalCalls: 1_247,
      totalMessages: 892,
      satisfactionRate: 94.5,
      averageResponseTime: "2.3 min"
    },
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      callReminders: true,
      marketingEmails: false,
      language: "en",
      timezone: "America/New_York",
      theme: "dark"
    },
    subscription: {
      plan: "Professional",
      status: "active",
      renewalDate: "2024-12-15",
      users: 5,
      features: ["Unlimited Calls", "Unlimited SMS", "Advanced Analytics", "Priority Support"]
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    company: "",
    location: "",
    bio: ""
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    callReminders: true,
    marketingEmails: false,
    language: "en",
    timezone: "America/New_York",
    theme: "dark"
  });

  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      setUser(mockUser);
      setFormData({
        name: mockUser.name,
        email: mockUser.email,
        phone: mockUser.phone,
        position: mockUser.position,
        department: mockUser.department,
        company: mockUser.company,
        location: mockUser.location,
        bio: mockUser.bio
      });
      setPreferences(mockUser.preferences);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePreferenceChange = (name, value) => {
    setPreferences(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setUser(prev => ({
        ...prev,
        ...formData
      }));
      setIsEditing(false);
      setIsLoading(false);
      // Show success message
      alert("Profile updated successfully!");
    }, 1500);
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setIsLoading(false);
      // Show success message
      alert("Password changed successfully!");
    }, 1500);
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setUser(prev => ({
        ...prev,
        preferences: preferences
      }));
      setIsLoading(false);
      // Show success message
      alert("Preferences updated successfully!");
    }, 1000);
  };

  const handleExportData = () => {
    // Simulate data export
    const data = {
      user: user,
      preferences: preferences,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      // Simulate logout
      alert("Logged out successfully!");
      // Redirect to login page
      window.location.href = "/login";
    }
  };

  if (isLoading && !user) {
    return (
      <AppLayout>
        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60">Loading your profile...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-y-auto">
        {/* Cover Photo */}
        <div className="w-full h-64 bg-gradient-to-r from-purple-600 to-pink-600 relative">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute bottom-6 left-8">
            <h1 className="text-4xl font-bold text-white mb-2">Profile Settings</h1>
            <p className="text-white/80">Manage your account and preferences</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 -mt-16 relative z-10">
          {/* Profile Header */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-6">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <User className="h-16 w-16 text-white" />
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
              
              <div className="flex space-x-3">
                {isEditing ? (
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
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all duration-200"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sticky top-8">
                <nav className="space-y-2">
                  {[
                    { id: "profile", label: "Profile Information", icon: User },
                    { id: "security", label: "Security", icon: Shield },
                    { id: "preferences", label: "Preferences", icon: Bell },
                    { id: "subscription", label: "Subscription", icon: CreditCard },
                    { id: "privacy", label: "Privacy & Data", icon: Globe }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                        activeTab === item.id
                          ? "bg-purple-500/20 border border-purple-500/30 text-purple-300"
                          : "text-white/60 hover:text-white hover:bg-white/5"
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
              {/* Profile Information */}
              {activeTab === "profile" && (
                <div className="space-y-6">
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
                        <label className="block text-white/60 text-sm font-medium mb-2">Location</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-white/40" />
                            <p className="text-white text-lg">{user?.location}</p>
                          </div>
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
                        { label: "Total Calls", value: user?.stats.totalCalls.toLocaleString(), color: "bg-blue-500/20" },
                        { label: "Messages Sent", value: user?.stats.totalMessages.toLocaleString(), color: "bg-green-500/20" },
                        { label: "Satisfaction Rate", value: `${user?.stats.satisfactionRate}%`, color: "bg-purple-500/20" },
                        { label: "Avg Response Time", value: user?.stats.averageResponseTime, color: "bg-orange-500/20" }
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

              {/* Security */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Change Password</h3>
                    
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Current Password</label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
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
                            type={showNewPassword ? "text" : "password"}
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
                            type={showConfirmPassword ? "text" : "password"}
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
                        {isLoading ? "Updating..." : "Change Password"}
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
                </div>
              )}

              {/* Preferences */}
              {activeTab === "preferences" && (
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Notification Preferences</h3>
                    
                    <div className="space-y-4">
                      {[
                        { id: "emailNotifications", label: "Email Notifications", description: "Receive email notifications for important updates" },
                        { id: "smsNotifications", label: "SMS Notifications", description: "Receive text messages for urgent matters" },
                        { id: "callReminders", label: "Call Reminders", description: "Get reminders for scheduled calls" },
                        { id: "marketingEmails", label: "Marketing Emails", description: "Receive updates about new features and promotions" }
                      ].map((pref) => (
                        <div key={pref.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <div>
                            <p className="text-white font-medium">{pref.label}</p>
                            <p className="text-white/60 text-sm">{pref.description}</p>
                          </div>
                          <button
                            onClick={() => handlePreferenceChange(pref.id, !preferences[pref.id])}
                            className={`w-12 h-6 rounded-full transition-all duration-200 ${
                              preferences[pref.id] ? "bg-green-500" : "bg-white/20"
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 transform ${
                              preferences[pref.id] ? "translate-x-7" : "translate-x-1"
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
                      {isLoading ? "Saving..." : "Save Preferences"}
                    </button>
                  </div>

                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Appearance & Language</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Theme</label>
                        <select
                          value={preferences.theme}
                          onChange={(e) => handlePreferenceChange("theme", e.target.value)}
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
                          onChange={(e) => handlePreferenceChange("language", e.target.value)}
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
                          onChange={(e) => handlePreferenceChange("timezone", e.target.value)}
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

              {/* Subscription */}
              {activeTab === "subscription" && (
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
                          <p className="text-3xl font-bold text-white">$49<span className="text-lg text-white/60">/month</span></p>
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
                        { date: "2024-11-15", amount: "$49.00", status: "Paid", invoice: "INV-001" },
                        { date: "2024-10-15", amount: "$49.00", status: "Paid", invoice: "INV-002" },
                        { date: "2024-09-15", amount: "$49.00", status: "Paid", invoice: "INV-003" }
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

              {/* Privacy & Data */}
              {activeTab === "privacy" && (
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
                        <button className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200">
                          <span>Delete Account</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Privacy Settings</h3>
                    
                    <div className="space-y-4">
                      {[
                        { id: "dataCollection", label: "Allow Data Collection", description: "Help us improve by sharing usage data", enabled: true },
                        { id: "personalizedAds", label: "Personalized Advertising", description: "See relevant ads based on your activity", enabled: false },
                        { id: "thirdPartySharing", label: "Third-Party Data Sharing", description: "Share data with trusted partners", enabled: false }
                      ].map((setting) => (
                        <div key={setting.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <div>
                            <p className="text-white font-medium">{setting.label}</p>
                            <p className="text-white/60 text-sm">{setting.description}</p>
                          </div>
                          <button
                            className={`w-12 h-6 rounded-full transition-all duration-200 ${
                              setting.enabled ? "bg-green-500" : "bg-white/20"
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 transform ${
                              setting.enabled ? "translate-x-7" : "translate-x-1"
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
  );
};

export default Page;