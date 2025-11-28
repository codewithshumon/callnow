"use client";

import { Phone, UserCircle } from "lucide-react";

const CallList = ({ 
  selectedCustomer, 
  setActiveTab,
  setPhoneNumber
}) => {
  const callHistory = [
    { id: 1, type: 'incoming', number: '+1234567890', duration: '2:30', time: '2:30 PM', date: 'Today' },
    { id: 2, type: 'outgoing', number: '+1234567890', duration: '1:45', time: '1:15 PM', date: 'Today' },
    { id: 3, type: 'incoming', number: '+1234567890', duration: '0:45', time: '11:20 AM', date: 'Today' },
    { id: 4, type: 'outgoing', number: '+1234567890', duration: '5:20', time: 'Yesterday', date: 'Yesterday' },
    { id: 5, type: 'incoming', number: '+1234567890', duration: '3:15', time: 'Yesterday', date: 'Yesterday' },
  ];

  const handleMakeCall = () => {
    setPhoneNumber(selectedCustomer.phone);
    setActiveTab("dialer");
  };

  return (
    <div className="flex-1 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
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

      {/* Call List */}
      <div className="flex-1 overflow-y-auto no-button-scrollbar p-6">
        <div className="space-y-4">
          {callHistory.map((call) => (
            <div
              key={call.id}
              className={`flex ${call.type === 'incoming' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-xs p-4 rounded-2xl ${
                  call.type === 'incoming'
                    ? 'bg-blue-500/20 border border-blue-500/30'
                    : 'bg-purple-500/20 border border-purple-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${
                    call.type === 'incoming' ? 'text-blue-300' : 'text-purple-300'
                  }`}>
                    {call.type === 'incoming' ? 'Incoming' : 'Outgoing'}
                  </span>
                  <span className="text-white/60 text-xs">{call.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{call.number}</span>
                  <span className="text-white/60 text-sm">{call.duration}</span>
                </div>
                <div className="text-white/40 text-xs mt-1">{call.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CallList;