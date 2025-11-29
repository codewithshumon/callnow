/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Save, 
  Bell, 
  Phone, 
  MessageCircle, 
  Shield, 
  Globe, 
  Palette,
  Database,
  Users,
  CreditCard,
  Download,
  Upload,
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  Server,
  Cpu,
  HardDrive,
  Calendar
} from "lucide-react";
import AppLayout from "@/app/(page)/layouts/AppLayout";

const Page = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Mock settings data
  const [settings, setSettings] = useState({
    general: {
      companyName: "TechCorp Inc.",
      timezone: "America/New_York",
      language: "en",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      autoLogout: 30,
      maxUploadSize: 10
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      callAlerts: true,
      messageAlerts: true,
      lowBalanceAlerts: true,
      systemMaintenance: false,
      marketingEmails: false,
      soundEnabled: true,
      desktopNotifications: true
    },
    calling: {
      defaultCountryCode: "+1",
      callRecording: true,
      voicemailEnabled: true,
      callForwarding: false,
      forwardToNumber: "",
      ringDuration: 30,
      defaultCallerId: "+15551234567",
      noiseCancellation: true,
      echoCancellation: true
    },
    messaging: {
      autoReply: false,
      autoReplyMessage: "Thank you for your message. We'll get back to you soon.",
      deliveryReports: true,
      readReceipts: true,
      characterLimit: 1600,
      spamFilter: true,
      scheduleMessages: true,
      quickReplies: [
        "Thank you for your message!",
        "We'll get back to you shortly.",
        "Is there anything else I can help with?"
      ]
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 60,
      passwordExpiry: 90,
      failedAttempts: 5,
      ipWhitelist: [],
      apiKey: "sk_live_1234567890abcdef",
      encryptData: true,
      auditLog: true
    },
    appearance: {
      theme: "dark",
      primaryColor: "purple",
      sidebarStyle: "floating",
      compactMode: false,
      fontSize: "medium",
      animations: true,
      highContrast: false,
      reducedMotion: false
    },
    integration: {
      twilio: {
        enabled: true,
        accountSid: "AC1234567890abcdef",
        authToken: "hidden",
        phoneNumber: "+15551234567"
      },
      slack: {
        enabled: false,
        webhookUrl: ""
      },
      googleCalendar: {
        enabled: true,
        syncEnabled: true
      },
      crm: {
        enabled: false,
        apiKey: "",
        url: ""
      }
    },
    storage: {
      autoBackup: true,
      backupFrequency: "daily",
      cloudSync: true,
      localStorage: true,
      retentionPeriod: 365,
      maxStorage: 50
    }
  });

  const [tempSettings, setTempSettings] = useState({});
  const [systemStatus, setSystemStatus] = useState({
    twilio: "connected",
    database: "healthy",
    api: "operational",
    storage: "normal",
    lastBackup: "2024-01-15 14:30:00",
    uptime: "99.9%"
  });

  useEffect(() => {
    // Simulate loading settings
    setIsLoading(true);
    setTimeout(() => {
      setTempSettings(JSON.parse(JSON.stringify(settings)));
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleSettingChange = (category, key, value) => {
    setTempSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleNestedSettingChange = (category, subcategory, key, value) => {
    setTempSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subcategory]: {
          ...prev[category][subcategory],
          [key]: value
        }
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSettings(JSON.parse(JSON.stringify(tempSettings)));
      setHasUnsavedChanges(false);
      setIsLoading(false);
      // Show success message
      alert("Settings saved successfully!");
    }, 1500);
  };

  const handleResetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to default? This cannot be undone.")) {
      setTempSettings(JSON.parse(JSON.stringify(settings)));
      setHasUnsavedChanges(false);
    }
  };

  const handleExportSettings = () => {
    const data = {
      settings: settings,
      exportDate: new Date().toISOString(),
      version: "1.0.0"
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `settings-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setTempSettings(importedSettings.settings);
          setHasUnsavedChanges(true);
          alert("Settings imported successfully!");
        } catch (error) {
          alert("Error importing settings. Please check the file format.");
        }
      };
      reader.readAsText(file);
    }
  };

  const testIntegration = (integration) => {
    setIsLoading(true);
    // Simulate integration test
    setTimeout(() => {
      setIsLoading(false);
      alert(`${integration} integration test completed successfully!`);
    }, 2000);
  };

  const regenerateApiKey = () => {
    if (confirm("Are you sure you want to regenerate the API key? This will invalidate the current key.")) {
      const newApiKey = "sk_live_" + Math.random().toString(36).substr(2, 24);
      handleSettingChange("security", "apiKey", newApiKey);
      alert("API key regenerated successfully!");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "connected":
      case "healthy":
      case "operational":
        return "text-green-400";
      case "degraded":
        return "text-yellow-400";
      case "disconnected":
      case "unhealthy":
      case "down":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "connected":
      case "healthy":
      case "operational":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "degraded":
        return <XCircle className="h-5 w-5 text-yellow-400" />;
      case "disconnected":
      case "unhealthy":
      case "down":
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  if (isLoading && Object.keys(tempSettings).length === 0) {
    return (
      <AppLayout>
        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60">Loading settings...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
              <p className="text-white/60">Manage your application preferences and configuration</p>
            </div>
            
            <div className="flex space-x-3">
              {hasUnsavedChanges && (
                <button
                  onClick={handleResetSettings}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset</span>
                </button>
              )}
              
              <button
                onClick={handleSaveSettings}
                disabled={!hasUnsavedChanges || isLoading}
                className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white rounded-xl transition-all duration-200"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{isLoading ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">System Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Twilio", status: systemStatus.twilio, icon: <Phone className="h-4 w-4" /> },
                { label: "Database", status: systemStatus.database, icon: <Database className="h-4 w-4" /> },
                { label: "API", status: systemStatus.api, icon: <Server className="h-4 w-4" /> },
                { label: "Storage", status: systemStatus.storage, icon: <HardDrive className="h-4 w-4" /> },
                { label: "Last Backup", value: systemStatus.lastBackup.split(' ')[0], icon: <Download className="h-4 w-4" /> },
                { label: "Uptime", value: systemStatus.uptime, icon: <Cpu className="h-4 w-4" /> }
              ].map((item, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    {item.icon}
                    <span className="text-white/60 text-sm">{item.label}</span>
                  </div>
                  {item.status ? (
                    <div className="flex items-center justify-center space-x-1">
                      {getStatusIcon(item.status)}
                      <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-white text-sm font-medium">{item.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sticky top-8">
                <nav className="space-y-1">
                  {[
                    { id: "general", label: "General", icon: Settings },
                    { id: "notifications", label: "Notifications", icon: Bell },
                    { id: "calling", label: "Calling", icon: Phone },
                    { id: "messaging", label: "Messaging", icon: MessageCircle },
                    { id: "security", label: "Security", icon: Shield },
                    { id: "appearance", label: "Appearance", icon: Palette },
                    { id: "integration", label: "Integrations", icon: Globe },
                    { id: "storage", label: "Storage & Backup", icon: Database }
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

                {/* Import/Export */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="space-y-2">
                    <button
                      onClick={handleExportSettings}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                    >
                      <Download className="h-5 w-5" />
                      <span className="font-medium">Export Settings</span>
                    </button>
                    
                    <label className="w-full flex items-center space-x-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 cursor-pointer">
                      <Upload className="h-5 w-5" />
                      <span className="font-medium">Import Settings</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportSettings}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {/* General Settings */}
              {activeTab === "general" && (
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">General Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Company Name</label>
                        <input
                          type="text"
                          value={tempSettings.general?.companyName || ""}
                          onChange={(e) => handleSettingChange("general", "companyName", e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Timezone</label>
                        <select
                          value={tempSettings.general?.timezone || ""}
                          onChange={(e) => handleSettingChange("general", "timezone", e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="America/New_York">Eastern Time (ET)</option>
                          <option value="America/Chicago">Central Time (CT)</option>
                          <option value="America/Denver">Mountain Time (MT)</option>
                          <option value="America/Los_Angeles">Pacific Time (PT)</option>
                          <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Language</label>
                        <select
                          value={tempSettings.general?.language || ""}
                          onChange={(e) => handleSettingChange("general", "language", e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Date Format</label>
                        <select
                          value={tempSettings.general?.dateFormat || ""}
                          onChange={(e) => handleSettingChange("general", "dateFormat", e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Auto Logout (minutes)</label>
                        <input
                          type="number"
                          min="5"
                          max="240"
                          value={tempSettings.general?.autoLogout || 30}
                          onChange={(e) => handleSettingChange("general", "autoLogout", parseInt(e.target.value))}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Max Upload Size (MB)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={tempSettings.general?.maxUploadSize || 10}
                          onChange={(e) => handleSettingChange("general", "maxUploadSize", parseInt(e.target.value))}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Notification Preferences</h3>
                    
                    <div className="space-y-4">
                      {[
                        { id: "emailNotifications", label: "Email Notifications", description: "Receive email notifications for important updates" },
                        { id: "smsNotifications", label: "SMS Notifications", description: "Receive text messages for urgent matters" },
                        { id: "pushNotifications", label: "Push Notifications", description: "Receive browser push notifications" },
                        { id: "callAlerts", label: "Call Alerts", description: "Get alerts for incoming and missed calls" },
                        { id: "messageAlerts", label: "Message Alerts", description: "Get alerts for new messages" },
                        { id: "lowBalanceAlerts", label: "Low Balance Alerts", description: "Receive alerts when your account balance is low" },
                        { id: "systemMaintenance", label: "System Maintenance Alerts", description: "Get notified about scheduled maintenance" },
                        { id: "marketingEmails", label: "Marketing Emails", description: "Receive updates about new features and promotions" },
                        { id: "soundEnabled", label: "Sound Notifications", description: "Play sounds for new notifications" },
                        { id: "desktopNotifications", label: "Desktop Notifications", description: "Show desktop notifications" }
                      ].map((pref) => (
                        <div key={pref.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <div>
                            <p className="text-white font-medium">{pref.label}</p>
                            <p className="text-white/60 text-sm">{pref.description}</p>
                          </div>
                          <button
                            onClick={() => handleSettingChange("notifications", pref.id, !tempSettings.notifications?.[pref.id])}
                            className={`w-12 h-6 rounded-full transition-all duration-200 ${
                              tempSettings.notifications?.[pref.id] ? "bg-green-500" : "bg-white/20"
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 transform ${
                              tempSettings.notifications?.[pref.id] ? "translate-x-7" : "translate-x-1"
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Calling Settings */}
              {activeTab === "calling" && (
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Calling Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Default Country Code</label>
                        <select
                          value={tempSettings.calling?.defaultCountryCode || ""}
                          onChange={(e) => handleSettingChange("calling", "defaultCountryCode", e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="+1">United States (+1)</option>
                          <option value="+44">United Kingdom (+44)</option>
                          <option value="+91">India (+91)</option>
                          <option value="+86">China (+86)</option>
                          <option value="+49">Germany (+49)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Default Caller ID</label>
                        <input
                          type="text"
                          value={tempSettings.calling?.defaultCallerId || ""}
                          onChange={(e) => handleSettingChange("calling", "defaultCallerId", e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Ring Duration (seconds)</label>
                        <input
                          type="number"
                          min="10"
                          max="60"
                          value={tempSettings.calling?.ringDuration || 30}
                          onChange={(e) => handleSettingChange("calling", "ringDuration", parseInt(e.target.value))}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 space-y-4">
                      {[
                        { id: "callRecording", label: "Call Recording", description: "Automatically record all calls" },
                        { id: "voicemailEnabled", label: "Voicemail", description: "Enable voicemail for missed calls" },
                        { id: "callForwarding", label: "Call Forwarding", description: "Forward calls to another number" },
                        { id: "noiseCancellation", label: "Noise Cancellation", description: "Reduce background noise during calls" },
                        { id: "echoCancellation", label: "Echo Cancellation", description: "Remove echo from calls" }
                      ].map((setting) => (
                        <div key={setting.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <div>
                            <p className="text-white font-medium">{setting.label}</p>
                            <p className="text-white/60 text-sm">{setting.description}</p>
                          </div>
                          <button
                            onClick={() => handleSettingChange("calling", setting.id, !tempSettings.calling?.[setting.id])}
                            className={`w-12 h-6 rounded-full transition-all duration-200 ${
                              tempSettings.calling?.[setting.id] ? "bg-green-500" : "bg-white/20"
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 transform ${
                              tempSettings.calling?.[setting.id] ? "translate-x-7" : "translate-x-1"
                            }`} />
                          </button>
                        </div>
                      ))}
                      
                      {tempSettings.calling?.callForwarding && (
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                          <label className="block text-white/60 text-sm font-medium mb-2">Forward To Number</label>
                          <input
                            type="text"
                            value={tempSettings.calling?.forwardToNumber || ""}
                            onChange={(e) => handleSettingChange("calling", "forwardToNumber", e.target.value)}
                            placeholder="+1234567890"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Messaging Settings */}
              {activeTab === "messaging" && (
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Messaging Settings</h3>
                    
                    <div className="space-y-4">
                      {[
                        { id: "deliveryReports", label: "Delivery Reports", description: "Receive reports when messages are delivered" },
                        { id: "readReceipts", label: "Read Receipts", description: "See when messages are read by recipients" },
                        { id: "spamFilter", label: "Spam Filter", description: "Automatically filter spam messages" },
                        { id: "scheduleMessages", label: "Schedule Messages", description: "Allow scheduling messages for later" }
                      ].map((setting) => (
                        <div key={setting.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <div>
                            <p className="text-white font-medium">{setting.label}</p>
                            <p className="text-white/60 text-sm">{setting.description}</p>
                          </div>
                          <button
                            onClick={() => handleSettingChange("messaging", setting.id, !tempSettings.messaging?.[setting.id])}
                            className={`w-12 h-6 rounded-full transition-all duration-200 ${
                              tempSettings.messaging?.[setting.id] ? "bg-green-500" : "bg-white/20"
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 transform ${
                              tempSettings.messaging?.[setting.id] ? "translate-x-7" : "translate-x-1"
                            }`} />
                          </button>
                        </div>
                      ))}
                      
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-white font-medium">Auto-Reply</p>
                            <p className="text-white/60 text-sm">Automatically reply to incoming messages</p>
                          </div>
                          <button
                            onClick={() => handleSettingChange("messaging", "autoReply", !tempSettings.messaging?.autoReply)}
                            className={`w-12 h-6 rounded-full transition-all duration-200 ${
                              tempSettings.messaging?.autoReply ? "bg-green-500" : "bg-white/20"
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 transform ${
                              tempSettings.messaging?.autoReply ? "translate-x-7" : "translate-x-1"
                            }`} />
                          </button>
                        </div>
                        
                        {tempSettings.messaging?.autoReply && (
                          <div>
                            <label className="block text-white/60 text-sm font-medium mb-2">Auto-Reply Message</label>
                            <textarea
                              value={tempSettings.messaging?.autoReplyMessage || ""}
                              onChange={(e) => handleSettingChange("messaging", "autoReplyMessage", e.target.value)}
                              rows="3"
                              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                              placeholder="Thank you for your message. We'll get back to you soon."
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <label className="block text-white/60 text-sm font-medium mb-2">Character Limit</label>
                        <input
                          type="number"
                          min="100"
                          max="5000"
                          value={tempSettings.messaging?.characterLimit || 1600}
                          onChange={(e) => handleSettingChange("messaging", "characterLimit", parseInt(e.target.value))}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Security Settings</h3>
                    
                    <div className="space-y-4">
                      {[
                        { id: "twoFactorAuth", label: "Two-Factor Authentication", description: "Add an extra layer of security to your account" },
                        { id: "encryptData", label: "Encrypt Data", description: "Encrypt all stored data" },
                        { id: "auditLog", label: "Audit Log", description: "Keep a log of all account activities" }
                      ].map((setting) => (
                        <div key={setting.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <div>
                            <p className="text-white font-medium">{setting.label}</p>
                            <p className="text-white/60 text-sm">{setting.description}</p>
                          </div>
                          <button
                            onClick={() => handleSettingChange("security", setting.id, !tempSettings.security?.[setting.id])}
                            className={`w-12 h-6 rounded-full transition-all duration-200 ${
                              tempSettings.security?.[setting.id] ? "bg-green-500" : "bg-white/20"
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 transform ${
                              tempSettings.security?.[setting.id] ? "translate-x-7" : "translate-x-1"
                            }`} />
                          </button>
                        </div>
                      ))}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-white/60 text-sm font-medium mb-2">Session Timeout (min)</label>
                          <input
                            type="number"
                            min="5"
                            max="240"
                            value={tempSettings.security?.sessionTimeout || 60}
                            onChange={(e) => handleSettingChange("security", "sessionTimeout", parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-white/60 text-sm font-medium mb-2">Password Expiry (days)</label>
                          <input
                            type="number"
                            min="30"
                            max="365"
                            value={tempSettings.security?.passwordExpiry || 90}
                            onChange={(e) => handleSettingChange("security", "passwordExpiry", parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-white/60 text-sm font-medium mb-2">Failed Attempts</label>
                          <input
                            type="number"
                            min="3"
                            max="10"
                            value={tempSettings.security?.failedAttempts || 5}
                            onChange={(e) => handleSettingChange("security", "failedAttempts", parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>
                      
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-white font-medium">API Key</p>
                            <p className="text-white/60 text-sm">Your secret API key for integrations</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200"
                            >
                              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={regenerateApiKey}
                              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200"
                            >
                              Regenerate
                            </button>
                          </div>
                        </div>
                        
                        <div className="relative">
                          <input
                            type={showApiKey ? "text" : "password"}
                            value={tempSettings.security?.apiKey || ""}
                            readOnly
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === "appearance" && (
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Appearance Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Theme</label>
                        <select
                          value={tempSettings.appearance?.theme || "dark"}
                          onChange={(e) => handleSettingChange("appearance", "theme", e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="dark">Dark</option>
                          <option value="light">Light</option>
                          <option value="auto">Auto</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Primary Color</label>
                        <select
                          value={tempSettings.appearance?.primaryColor || "purple"}
                          onChange={(e) => handleSettingChange("appearance", "primaryColor", e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="purple">Purple</option>
                          <option value="blue">Blue</option>
                          <option value="green">Green</option>
                          <option value="red">Red</option>
                          <option value="orange">Orange</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Sidebar Style</label>
                        <select
                          value={tempSettings.appearance?.sidebarStyle || "floating"}
                          onChange={(e) => handleSettingChange("appearance", "sidebarStyle", e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="floating">Floating</option>
                          <option value="solid">Solid</option>
                          <option value="minimal">Minimal</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">Font Size</label>
                        <select
                          value={tempSettings.appearance?.fontSize || "medium"}
                          onChange={(e) => handleSettingChange("appearance", "fontSize", e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-6 space-y-4">
                      {[
                        { id: "compactMode", label: "Compact Mode", description: "Use compact spacing for lists and tables" },
                        { id: "animations", label: "Animations", description: "Enable interface animations and transitions" },
                        { id: "highContrast", label: "High Contrast", description: "Increase contrast for better readability" },
                        { id: "reducedMotion", label: "Reduced Motion", description: "Reduce animations for accessibility" }
                      ].map((setting) => (
                        <div key={setting.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <div>
                            <p className="text-white font-medium">{setting.label}</p>
                            <p className="text-white/60 text-sm">{setting.description}</p>
                          </div>
                          <button
                            onClick={() => handleSettingChange("appearance", setting.id, !tempSettings.appearance?.[setting.id])}
                            className={`w-12 h-6 rounded-full transition-all duration-200 ${
                              tempSettings.appearance?.[setting.id] ? "bg-green-500" : "bg-white/20"
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 transform ${
                              tempSettings.appearance?.[setting.id] ? "translate-x-7" : "translate-x-1"
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Integration Settings */}
              {activeTab === "integration" && (
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Integration Settings</h3>
                    
                    <div className="space-y-4">
                      {/* Twilio Integration */}
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              tempSettings.integration?.twilio?.enabled ? "bg-green-500/20" : "bg-white/10"
                            }`}>
                              <Phone className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-medium">Twilio</p>
                              <p className="text-white/60 text-sm">Voice and SMS services</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleNestedSettingChange("integration", "twilio", "enabled", !tempSettings.integration?.twilio?.enabled)}
                            className={`w-12 h-6 rounded-full transition-all duration-200 ${
                              tempSettings.integration?.twilio?.enabled ? "bg-green-500" : "bg-white/20"
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 transform ${
                              tempSettings.integration?.twilio?.enabled ? "translate-x-7" : "translate-x-1"
                            }`} />
                          </button>
                        </div>
                        
                        {tempSettings.integration?.twilio?.enabled && (
                          <div className="space-y-3 mt-4">
                            <div>
                              <label className="block text-white/60 text-sm font-medium mb-1">Account SID</label>
                              <input
                                type="text"
                                value={tempSettings.integration?.twilio?.accountSid || ""}
                                onChange={(e) => handleNestedSettingChange("integration", "twilio", "accountSid", e.target.value)}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-white/60 text-sm font-medium mb-1">Auth Token</label>
                              <input
                                type="password"
                                value={tempSettings.integration?.twilio?.authToken || ""}
                                onChange={(e) => handleNestedSettingChange("integration", "twilio", "authToken", e.target.value)}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-white/60 text-sm font-medium mb-1">Phone Number</label>
                              <input
                                type="text"
                                value={tempSettings.integration?.twilio?.phoneNumber || ""}
                                onChange={(e) => handleNestedSettingChange("integration", "twilio", "phoneNumber", e.target.value)}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                              />
                            </div>
                            <button
                              onClick={() => testIntegration("Twilio")}
                              disabled={isLoading}
                              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg transition-all duration-200"
                            >
                              {isLoading ? "Testing..." : "Test Connection"}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Slack Integration */}
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              tempSettings.integration?.slack?.enabled ? "bg-purple-500/20" : "bg-white/10"
                            }`}>
                              <MessageCircle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-medium">Slack</p>
                              <p className="text-white/60 text-sm">Team communication</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleNestedSettingChange("integration", "slack", "enabled", !tempSettings.integration?.slack?.enabled)}
                            className={`w-12 h-6 rounded-full transition-all duration-200 ${
                              tempSettings.integration?.slack?.enabled ? "bg-green-500" : "bg-white/20"
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 transform ${
                              tempSettings.integration?.slack?.enabled ? "translate-x-7" : "translate-x-1"
                            }`} />
                          </button>
                        </div>
                      </div>

                      {/* Google Calendar Integration */}
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              tempSettings.integration?.googleCalendar?.enabled ? "bg-blue-500/20" : "bg-white/10"
                            }`}>
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-medium">Google Calendar</p>
                              <p className="text-white/60 text-sm">Schedule synchronization</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleNestedSettingChange("integration", "googleCalendar", "enabled", !tempSettings.integration?.googleCalendar?.enabled)}
                            className={`w-12 h-6 rounded-full transition-all duration-200 ${
                              tempSettings.integration?.googleCalendar?.enabled ? "bg-green-500" : "bg-white/20"
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 transform ${
                              tempSettings.integration?.googleCalendar?.enabled ? "translate-x-7" : "translate-x-1"
                            }`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Storage & Backup Settings */}
              {activeTab === "storage" && (
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Storage & Backup Settings</h3>
                    
                    <div className="space-y-4">
                      {[
                        { id: "autoBackup", label: "Auto Backup", description: "Automatically backup your data" },
                        { id: "cloudSync", label: "Cloud Sync", description: "Sync data to cloud storage" },
                        { id: "localStorage", label: "Local Storage", description: "Store data locally on your device" }
                      ].map((setting) => (
                        <div key={setting.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <div>
                            <p className="text-white font-medium">{setting.label}</p>
                            <p className="text-white/60 text-sm">{setting.description}</p>
                          </div>
                          <button
                            onClick={() => handleSettingChange("storage", setting.id, !tempSettings.storage?.[setting.id])}
                            className={`w-12 h-6 rounded-full transition-all duration-200 ${
                              tempSettings.storage?.[setting.id] ? "bg-green-500" : "bg-white/20"
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 transform ${
                              tempSettings.storage?.[setting.id] ? "translate-x-7" : "translate-x-1"
                            }`} />
                          </button>
                        </div>
                      ))}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white/60 text-sm font-medium mb-2">Backup Frequency</label>
                          <select
                            value={tempSettings.storage?.backupFrequency || "daily"}
                            onChange={(e) => handleSettingChange("storage", "backupFrequency", e.target.value)}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-white/60 text-sm font-medium mb-2">Retention Period (days)</label>
                          <input
                            type="number"
                            min="7"
                            max="1095"
                            value={tempSettings.storage?.retentionPeriod || 365}
                            onChange={(e) => handleSettingChange("storage", "retentionPeriod", parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-white/60 text-sm font-medium mb-2">Max Storage (GB)</label>
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={tempSettings.storage?.maxStorage || 50}
                            onChange={(e) => handleSettingChange("storage", "maxStorage", parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>
                      
                      <div className="flex space-x-3 pt-4">
                        <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200">
                          Backup Now
                        </button>
                        <button className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all duration-200">
                          Restore from Backup
                        </button>
                      </div>
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