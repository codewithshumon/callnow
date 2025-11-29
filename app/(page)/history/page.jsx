/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { Search, Phone, MessageCircle, UserCircle, Filter, Calendar, Clock, Download } from "lucide-react";
import AppLayout from "@/app/(page)/layouts/AppLayout";

const Page = () => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);

  // Mock data combining call and message history
  const mockHistory = [
    // Today's activities
    {
      id: 1,
      type: "call",
      direction: "outgoing",
      customer: {
        id: 1,
        name: "John Doe",
        phone: "+1234567890",
        email: "john@example.com",
        avatar: "/avatars/john.jpg"
      },
      duration: "2:30",
      timestamp: new Date().setHours(14, 30, 0),
      status: "completed",
      date: "Today",
      time: "2:30 PM"
    },
    {
      id: 2,
      type: "message",
      direction: "outgoing",
      customer: {
        id: 1,
        name: "John Doe",
        phone: "+1234567890",
        email: "john@example.com",
        avatar: "/avatars/john.jpg"
      },
      content: "Hello John! How can I help you today?",
      timestamp: new Date().setHours(14, 30, 0),
      status: "delivered",
      date: "Today",
      time: "2:30 PM"
    },
    {
      id: 3,
      type: "message",
      direction: "incoming",
      customer: {
        id: 1,
        name: "John Doe",
        phone: "+1234567890",
        email: "john@example.com",
        avatar: "/avatars/john.jpg"
      },
      content: "Hi there! I have a question about my recent order.",
      timestamp: new Date().setHours(14, 31, 0),
      status: "read",
      date: "Today",
      time: "2:31 PM"
    },
    {
      id: 4,
      type: "call",
      direction: "incoming",
      customer: {
        id: 2,
        name: "Jane Smith",
        phone: "+1234567891",
        email: "jane@example.com",
        avatar: "/avatars/jane.jpg"
      },
      duration: "1:45",
      timestamp: new Date().setHours(13, 15, 0),
      status: "completed",
      date: "Today",
      time: "1:15 PM"
    },
    {
      id: 5,
      type: "message",
      direction: "outgoing",
      customer: {
        id: 2,
        name: "Jane Smith",
        phone: "+1234567891",
        email: "jane@example.com",
        avatar: "/avatars/jane.jpg"
      },
      content: "Your appointment is confirmed for tomorrow at 3 PM.",
      timestamp: new Date().setHours(13, 15, 0),
      status: "read",
      date: "Today",
      time: "1:15 PM"
    },
    {
      id: 6,
      type: "call",
      direction: "incoming",
      customer: {
        id: 3,
        name: "Mike Johnson",
        phone: "+1234567892",
        email: "mike@example.com",
        avatar: "/avatars/mike.jpg"
      },
      duration: "0:45",
      timestamp: new Date().setHours(11, 20, 0),
      status: "missed",
      date: "Today",
      time: "11:20 AM"
    },
    {
      id: 7,
      type: "message",
      direction: "incoming",
      customer: {
        id: 3,
        name: "Mike Johnson",
        phone: "+1234567892",
        email: "mike@example.com",
        avatar: "/avatars/mike.jpg"
      },
      content: "Hi, can we reschedule our meeting? Something came up.",
      timestamp: new Date().setHours(11, 20, 0),
      status: "read",
      date: "Today",
      time: "11:20 AM"
    },

    // Yesterday's activities
    {
      id: 8,
      type: "call",
      direction: "outgoing",
      customer: {
        id: 4,
        name: "Sarah Wilson",
        phone: "+1234567893",
        email: "sarah@example.com",
        avatar: "/avatars/sarah.jpg"
      },
      duration: "5:20",
      timestamp: new Date(Date.now() - 86400000).setHours(15, 45, 0),
      status: "completed",
      date: "Yesterday",
      time: "3:45 PM"
    },
    {
      id: 9,
      type: "message",
      direction: "outgoing",
      customer: {
        id: 4,
        name: "Sarah Wilson",
        phone: "+1234567893",
        email: "sarah@example.com",
        avatar: "/avatars/sarah.jpg"
      },
      content: "Your package has been delivered to your front porch.",
      timestamp: new Date(Date.now() - 86400000).setHours(15, 45, 0),
      status: "delivered",
      date: "Yesterday",
      time: "3:45 PM"
    },
    {
      id: 10,
      type: "call",
      direction: "incoming",
      customer: {
        id: 5,
        name: "David Brown",
        phone: "+1234567894",
        email: "david@example.com",
        avatar: "/avatars/david.jpg"
      },
      duration: "3:15",
      timestamp: new Date(Date.now() - 86400000).setHours(14, 15, 0),
      status: "completed",
      date: "Yesterday",
      time: "2:15 PM"
    },
    {
      id: 11,
      type: "message",
      direction: "outgoing",
      customer: {
        id: 5,
        name: "David Brown",
        phone: "+1234567894",
        email: "david@example.com",
        avatar: "/avatars/david.jpg"
      },
      content: "Looking forward to our meeting next week!",
      timestamp: new Date(Date.now() - 86400000).setHours(14, 15, 0),
      status: "read",
      date: "Yesterday",
      time: "2:15 PM"
    },

    // Older activities
    {
      id: 12,
      type: "message",
      direction: "incoming",
      customer: {
        id: 6,
        name: "Emily Davis",
        phone: "+1234567895",
        email: "emily@example.com",
        avatar: "/avatars/emily.jpg"
      },
      content: "Please call me back when you get this message.",
      timestamp: new Date("2024-12-15").setHours(16, 15, 0),
      status: "read",
      date: "12/15/2024",
      time: "4:15 PM"
    },
    {
      id: 13,
      type: "message",
      direction: "outgoing",
      customer: {
        id: 7,
        name: "Robert Wilson",
        phone: "+1234567896",
        email: "robert@example.com",
        avatar: "/avatars/robert.jpg"
      },
      content: "Payment of $250 has been received. Thank you!",
      timestamp: new Date("2024-12-14").setHours(10, 30, 0),
      status: "delivered",
      date: "12/14/2024",
      time: "10:30 AM"
    },
    {
      id: 14,
      type: "call",
      direction: "outgoing",
      customer: {
        id: 8,
        name: "Lisa Anderson",
        phone: "+1234567897",
        email: "lisa@example.com",
        avatar: "/avatars/lisa.jpg"
      },
      duration: "4:10",
      timestamp: new Date("2024-12-13").setHours(9, 30, 0),
      status: "completed",
      date: "12/13/2024",
      time: "9:30 AM"
    },
    {
      id: 15,
      type: "message",
      direction: "outgoing",
      customer: {
        id: 8,
        name: "Lisa Anderson",
        phone: "+1234567897",
        email: "lisa@example.com",
        avatar: "/avatars/lisa.jpg"
      },
      content: "It will ship today. You'll receive tracking info shortly.",
      timestamp: new Date("2024-12-13").setHours(9, 30, 0),
      status: "read",
      date: "12/13/2024",
      time: "9:30 AM"
    },
    {
      id: 16,
      type: "call",
      direction: "incoming",
      customer: {
        id: 1,
        name: "John Doe",
        phone: "+1234567890",
        email: "john@example.com",
        avatar: "/avatars/john.jpg"
      },
      duration: "0:00",
      timestamp: new Date("2024-12-12").setHours(11, 0, 0),
      status: "missed",
      date: "12/12/2024",
      time: "11:00 AM"
    },
    {
      id: 17,
      type: "message",
      direction: "incoming",
      customer: {
        id: 2,
        name: "Jane Smith",
        phone: "+1234567891",
        email: "jane@example.com",
        avatar: "/avatars/jane.jpg"
      },
      content: "Thank you for the quick response!",
      timestamp: new Date("2024-12-11").setHours(16, 45, 0),
      status: "read",
      date: "12/11/2024",
      time: "4:45 PM"
    },
    {
      id: 18,
      type: "call",
      direction: "outgoing",
      customer: {
        id: 3,
        name: "Mike Johnson",
        phone: "+1234567892",
        email: "mike@example.com",
        avatar: "/avatars/mike.jpg"
      },
      duration: "7:25",
      timestamp: new Date("2024-12-10").setHours(10, 15, 0),
      status: "completed",
      date: "12/10/2024",
      time: "10:15 AM"
    }
  ];

  useEffect(() => {
    // Sort by timestamp (newest first)
    const sortedHistory = [...mockHistory].sort((a, b) => b.timestamp - a.timestamp);
    setHistory(sortedHistory);
    setFilteredHistory(sortedHistory);
  }, []);

  useEffect(() => {
    let filtered = history;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.phone.includes(searchTerm) ||
        item.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.type === "message" && item.content.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply type filter
    if (activeFilter !== "all") {
      filtered = filtered.filter(item => item.type === activeFilter);
    }

    // Apply date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const startDate = new Date();

      switch (dateRange) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(item => new Date(item.timestamp) >= startDate);
          break;
        case "yesterday":
          startDate.setDate(now.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(now);
          endDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate >= startDate && itemDate < endDate;
          });
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(item => new Date(item.timestamp) >= startDate);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(item => new Date(item.timestamp) >= startDate);
          break;
        default:
          break;
      }
    }

    setFilteredHistory(filtered);
  }, [searchTerm, activeFilter, dateRange, history]);

  const getStatusColor = (type, direction, status) => {
    if (type === "call") {
      if (status === "missed") return "text-red-400";
      if (direction === "incoming") return "text-blue-400";
      return "text-green-400";
    } else {
      if (status === "read") return "text-green-400";
      if (status === "delivered") return "text-blue-400";
      return "text-gray-400";
    }
  };

  const getStatusText = (type, direction, status) => {
    if (type === "call") {
      if (status === "missed") return "Missed call";
      return direction === "incoming" ? "Incoming call" : "Outgoing call";
    } else {
      return direction === "incoming" ? "Incoming message" : "Outgoing message";
    }
  };

  const getIcon = (type, direction) => {
    if (type === "call") {
      return direction === "incoming" ? 
        <Phone className="h-4 w-4" /> : 
        <Phone className="h-4 w-4" />;
    } else {
      return direction === "incoming" ? 
        <MessageCircle className="h-4 w-4" /> : 
        <MessageCircle className="h-4 w-4" />;
    }
  };

  const handleExportHistory = () => {
    const csvContent = [
      ["Date", "Time", "Type", "Direction", "Customer", "Phone", "Duration/Content", "Status"],
      ...filteredHistory.map(item => [
        item.date,
        item.time,
        item.type.charAt(0).toUpperCase() + item.type.slice(1),
        item.direction.charAt(0).toUpperCase() + item.direction.slice(1),
        item.customer.name,
        item.customer.phone,
        item.type === "call" ? item.duration : `"${item.content}"`,
        item.status.charAt(0).toUpperCase() + item.status.slice(1)
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `communication-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const groupHistoryByDate = (items) => {
    const groups = {};
    items.forEach(item => {
      if (!groups[item.date]) {
        groups[item.date] = [];
      }
      groups[item.date].push(item);
    });
    return groups;
  };

  const groupedHistory = groupHistoryByDate(filteredHistory);

  return (
    <AppLayout>
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        <div className="w-full h-full flex flex-col p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Communication History</h1>
              <p className="text-white/60">View all calls and messages with your customers</p>
            </div>
            <button
              onClick={handleExportHistory}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Filters and Search */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by name, phone, email, or message content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Type Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-4 py-3 rounded-xl border transition-all duration-200 ${
                    activeFilter === "all"
                      ? "bg-purple-500 border-purple-500 text-white"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveFilter("call")}
                  className={`px-4 py-3 rounded-xl border transition-all duration-200 flex items-center space-x-2 ${
                    activeFilter === "call"
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <Phone className="h-4 w-4" />
                  <span>Calls</span>
                </button>
                <button
                  onClick={() => setActiveFilter("message")}
                  className={`px-4 py-3 rounded-xl border transition-all duration-200 flex items-center space-x-2 ${
                    activeFilter === "message"
                      ? "bg-green-500 border-green-500 text-white"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Messages</span>
                </button>
              </div>

              {/* Date Filter */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/60">
              Showing {filteredHistory.length} of {history.length} records
            </p>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto no-button-scrollbar">
            {Object.keys(groupedHistory).length > 0 ? (
              Object.entries(groupedHistory).map(([date, items]) => (
                <div key={date} className="mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Calendar className="h-5 w-5 text-white/40" />
                    <h3 className="text-lg font-semibold text-white">{date}</h3>
                    <span className="text-white/40 text-sm">({items.length} activities)</span>
                  </div>
                  
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`bg-white/5 backdrop-blur-lg rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:bg-white/10 p-4 ${
                          selectedItem?.id === item.id
                            ? "border-purple-500 bg-purple-500/20"
                            : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            {/* Customer Avatar */}
                            <div className="flex-shrink-0">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                item.type === "call" 
                                  ? "bg-blue-500/20 border border-blue-500/30" 
                                  : "bg-green-500/20 border border-green-500/30"
                              }`}>
                                <div className={`p-2 rounded-full ${
                                  item.type === "call" 
                                    ? "bg-blue-500/30" 
                                    : "bg-green-500/30"
                                }`}>
                                  {getIcon(item.type, item.direction)}
                                </div>
                              </div>
                            </div>

                            {/* Customer Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-lg font-semibold text-white truncate">
                                  {item.customer.name}
                                </p>
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-white/40" />
                                  <span className="text-white/60 text-sm">{item.time}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <span className={`text-sm font-medium ${getStatusColor(item.type, item.direction, item.status)}`}>
                                  {getStatusText(item.type, item.direction, item.status)}
                                </span>
                                <span className="text-white/40">•</span>
                                <span className="text-white/60 text-sm">{item.customer.phone}</span>
                              </div>

                              {/* Content */}
                              <div className="mt-2">
                                {item.type === "call" ? (
                                  <div className="flex items-center space-x-4">
                                    <span className="text-white/80 font-medium">Duration: {item.duration}</span>
                                    {item.status === "missed" && (
                                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium">
                                        Missed
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-white/80 truncate">{item.content}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Filter className="h-12 w-12 text-white/40" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                <p className="text-white/60 text-center">
                  No communication history matches your current filters. <br />
                  Try adjusting your search criteria or date range.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Page;