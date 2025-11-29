/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { Search, UserCircle, Send, Phone } from "lucide-react";
import AppLayout from "@/app/(page)/layouts/AppLayout";

const Page = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState("sms");

  const mockCustomers = [
    {
      id: 1,
      name: "John Doe",
      phone: "+1234567890",
      email: "john@example.com",
      avatar: "/avatars/john.jpg",
      lastMessage: "Thanks for your help!",
      lastMessageTime: "2:31 PM",
      unread: 2
    },
    {
      id: 2,
      name: "Jane Smith",
      phone: "+1234567891",
      email: "jane@example.com",
      avatar: "/avatars/jane.jpg",
      lastMessage: "I'll be there at 3 PM",
      lastMessageTime: "1:15 PM",
      unread: 0
    },
    {
      id: 3,
      name: "Mike Johnson",
      phone: "+1234567892",
      email: "mike@example.com",
      avatar: "/avatars/mike.jpg",
      lastMessage: "Can we reschedule?",
      lastMessageTime: "11:20 AM",
      unread: 1
    },
    {
      id: 4,
      name: "Sarah Wilson",
      phone: "+1234567893",
      email: "sarah@example.com",
      avatar: "/avatars/sarah.jpg",
      lastMessage: "The package has been delivered",
      lastMessageTime: "Yesterday",
      unread: 0
    },
    {
      id: 5,
      name: "David Brown",
      phone: "+1234567894",
      email: "david@example.com",
      avatar: "/avatars/david.jpg",
      lastMessage: "Looking forward to our meeting",
      lastMessageTime: "Yesterday",
      unread: 3
    },
    {
      id: 6,
      name: "Emily Davis",
      phone: "+1234567895",
      email: "emily@example.com",
      avatar: "/avatars/emily.jpg",
      lastMessage: "Please call me back",
      lastMessageTime: "12/15/2024",
      unread: 0
    },
    {
      id: 7,
      name: "Robert Wilson",
      phone: "+1234567896",
      email: "robert@example.com",
      avatar: "/avatars/robert.jpg",
      lastMessage: "Payment received, thank you",
      lastMessageTime: "12/14/2024",
      unread: 0
    },
    {
      id: 8,
      name: "Lisa Anderson",
      phone: "+1234567897",
      email: "lisa@example.com",
      avatar: "/avatars/lisa.jpg",
      lastMessage: "When will my order ship?",
      lastMessageTime: "12/13/2024",
      unread: 1
    }
  ];

  const [conversations, setConversations] = useState({
    1: [
      { 
        id: 1, 
        type: 'outgoing', 
        text: 'Hello John! How can I help you today?', 
        time: '2:30 PM', 
        date: 'Today',
        status: 'delivered'
      },
      { 
        id: 2, 
        type: 'incoming', 
        text: 'Hi there! I have a question about my recent order.', 
        time: '2:31 PM', 
        date: 'Today',
        status: 'read'
      },
      { 
        id: 3, 
        type: 'outgoing', 
        text: 'Sure, I\'d be happy to help. What\'s your order number?', 
        time: '2:32 PM', 
        date: 'Today',
        status: 'delivered'
      },
      { 
        id: 4, 
        type: 'incoming', 
        text: 'It\'s ORD-12345. Can you tell me when it will ship?', 
        time: '2:33 PM', 
        date: 'Today',
        status: 'read'
      }
    ],
    2: [
      { 
        id: 1, 
        type: 'outgoing', 
        text: 'Your appointment is confirmed for tomorrow at 3 PM.', 
        time: '1:15 PM', 
        date: 'Today',
        status: 'delivered'
      },
      { 
        id: 2, 
        type: 'incoming', 
        text: 'Great! I\'ll be there. Thanks for the reminder.', 
        time: '1:16 PM', 
        date: 'Today',
        status: 'read'
      }
    ],
    3: [
      { 
        id: 1, 
        type: 'incoming', 
        text: 'Hi, can we reschedule our meeting? Something came up.', 
        time: '11:20 AM', 
        date: 'Today',
        status: 'read'
      },
      { 
        id: 2, 
        type: 'outgoing', 
        text: 'No problem. How about tomorrow at 2 PM?', 
        time: '11:21 AM', 
        date: 'Today',
        status: 'delivered'
      }
    ],
    4: [
      { 
        id: 1, 
        type: 'outgoing', 
        text: 'Your package has been delivered to your front porch.', 
        time: '3:45 PM', 
        date: 'Yesterday',
        status: 'delivered'
      },
      { 
        id: 2, 
        type: 'incoming', 
        text: 'Perfect! Just found it. Thank you for the update.', 
        time: '4:20 PM', 
        date: 'Yesterday',
        status: 'read'
      }
    ],
    5: [
      { 
        id: 1, 
        type: 'outgoing', 
        text: 'Looking forward to our meeting next week!', 
        time: '2:15 PM', 
        date: 'Yesterday',
        status: 'delivered'
      },
      { 
        id: 2, 
        type: 'incoming', 
        text: 'Me too! Should I prepare anything specific?', 
        time: '2:30 PM', 
        date: 'Yesterday',
        status: 'read'
      },
      { 
        id: 3, 
        type: 'outgoing', 
        text: 'Just bring the project documents we discussed.', 
        time: '2:31 PM', 
        date: 'Yesterday',
        status: 'read'
      }
    ],
    6: [
      { 
        id: 1, 
        type: 'incoming', 
        text: 'Please call me back when you get this message.', 
        time: '4:15 PM', 
        date: '12/15/2024',
        status: 'read'
      }
    ],
    7: [
      { 
        id: 1, 
        type: 'outgoing', 
        text: 'Payment of $250 has been received. Thank you!', 
        time: '10:30 AM', 
        date: '12/14/2024',
        status: 'delivered'
      }
    ],
    8: [
      { 
        id: 1, 
        type: 'incoming', 
        text: 'When will my order ship? I placed it 3 days ago.', 
        time: '9:15 AM', 
        date: '12/13/2024',
        status: 'read'
      },
      { 
        id: 2, 
        type: 'outgoing', 
        text: 'It will ship today. You\'ll receive tracking info shortly.', 
        time: '9:30 AM', 
        date: '12/13/2024',
        status: 'delivered'
      }
    ]
  });

  useEffect(() => {
    setCustomers(mockCustomers);
    setFilteredCustomers(mockCustomers);
  }, []);

  useEffect(() => {
    const filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    // Mark messages as read when opening conversation
    if (customer.unread > 0) {
      const updatedCustomers = customers.map(c => 
        c.id === customer.id ? { ...c, unread: 0 } : c
      );
      setCustomers(updatedCustomers);
      setFilteredCustomers(updatedCustomers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedCustomer) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/twilio/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: selectedCustomer.phone,
          body: messageText,
          customerId: selectedCustomer.id,
        }),
      });

      if (response.ok) {
        // Add to local conversation history
        const newMessage = {
          id: Date.now(),
          type: 'outgoing',
          text: messageText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: 'Today',
          status: 'sent'
        };
        
        setConversations(prev => ({
          ...prev,
          [selectedCustomer.id]: [
            ...(prev[selectedCustomer.id] || []),
            newMessage
          ]
        }));

        // Update customer last message
        const updatedCustomers = customers.map(customer => 
          customer.id === selectedCustomer.id 
            ? { 
                ...customer, 
                lastMessage: messageText,
                lastMessageTime: 'Just now',
                unread: 0
              }
            : customer
        );
        
        setCustomers(updatedCustomers);
        setFilteredCustomers(updatedCustomers.filter(c => 
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone.includes(searchTerm) ||
          c.email.toLowerCase().includes(searchTerm.toLowerCase())
        ));
        
        setMessageText("");
        console.log("SMS sent successfully");
      } else {
        console.error("Failed to send SMS");
        alert("Failed to send SMS. Please try again.");
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      alert("Error sending SMS. Please check your connection.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMakeCall = () => {
    if (selectedCustomer) {
      // Navigate to dialer page with the selected customer
      window.location.href = `/dialer?phone=${encodeURIComponent(selectedCustomer.phone)}&customerId=${selectedCustomer.id}`;
    }
  };

  const currentConversation = selectedCustomer ? conversations[selectedCustomer.id] || [] : [];

  return (
    <AppLayout>
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        <div className="w-full h-full flex">
          {/* Customer List Sidebar */}
          <div className="w-96 h-full bg-white/5 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col">
            <div className="mb-6 flex-shrink-0">
              <h1 className="text-2xl font-bold text-white mb-2">Messages</h1>
              <p className="text-white/60">Select a customer to message</p>
            </div>

            <div className="relative mb-6 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-5 w-5" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto no-button-scrollbar pr-2 space-y-2">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleCustomerSelect(customer)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:bg-white/5 ${
                    selectedCustomer?.id === customer.id
                      ? "border-purple-500 bg-purple-500/20"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <UserCircle className="h-6 w-6 text-white" />
                      </div>
                      {customer.unread > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">{customer.unread}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white truncate">
                          {customer.name}
                        </p>
                        <span className="text-xs text-white/40">{customer.lastMessageTime}</span>
                      </div>
                      <p className="text-sm text-white/60 truncate">
                        {customer.lastMessage}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation Area */}
          {selectedCustomer ? (
            <div className="flex-1 h-full flex flex-col">
              {/* Customer Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <UserCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedCustomer.name}</h2>
                    <p className="text-white/60">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <button
                  onClick={handleMakeCall}
                  className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-all duration-200 hover:scale-105"
                >
                  <Phone className="h-6 w-6" />
                </button>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto no-button-scrollbar p-6">
                <div className="space-y-4">
                  {currentConversation.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'incoming' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-md p-4 rounded-2xl ${
                          message.type === 'incoming'
                            ? 'bg-blue-500/20 border border-blue-500/30'
                            : 'bg-purple-500/20 border border-purple-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-semibold ${
                            message.type === 'incoming' ? 'text-blue-300' : 'text-purple-300'
                          }`}>
                            {message.type === 'incoming' ? 'Incoming' : 'Outgoing'}
                          </span>
                          <span className="text-white/60 text-xs">{message.time}</span>
                        </div>
                        <div className="text-white break-words">{message.text}</div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-white/40 text-xs">{message.date}</div>
                          {message.type === 'outgoing' && (
                            <div className="text-white/40 text-xs">
                              {message.status === 'sent' && '✓'}
                              {message.status === 'delivered' && '✓✓'}
                              {message.status === 'read' && '✓✓✓'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-white/10 bg-white/5">
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      disabled={isSending}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 pr-12"
                    />
                    {messageText && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 text-sm">
                        {messageText.length}/1600
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || isSending}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-white/10 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 flex items-center space-x-2 min-w-32 justify-center"
                  >
                    {isSending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                    <span>{isSending ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>
                <p className="text-white/40 text-xs mt-2 text-center">
                  Press Enter to send • Messages are sent via Twilio
                </p>
              </div>
            </div>
          ) : (
            // Empty state when no customer selected
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Send className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Welcome to Messages</h3>
                <p className="text-white/60 text-lg">Select a customer from the list to start a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Page;