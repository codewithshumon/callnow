/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { Search, UserCircle } from "lucide-react";
import AppLayout from "@/app/(page)/layouts/AppLayout";
import Dialer from "./components/Dialer";
import CallList from "./components/CallList";

const Page = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [activeTab, setActiveTab] = useState("dialer"); // 'dialer' or 'list'

  const mockCustomers = [
    {
      id: 1,
      name: "John Doe",
      phone: "+1234567890",
      email: "john@example.com",
      avatar: "/avatars/john.jpg",
    },
    {
      id: 2,
      name: "Jane Smith",
      phone: "+1234567891",
      email: "jane@example.com",
      avatar: "/avatars/jane.jpg",
    },
    {
      id: 3,
      name: "Mike Johnson",
      phone: "+1234567892",
      email: "mike@example.com",
      avatar: "/avatars/mike.jpg",
    },
    {
      id: 4,
      name: "Sarah Wilson",
      phone: "+1234567893",
      email: "sarah@example.com",
      avatar: "/avatars/sarah.jpg",
    },
    {
      id: 5,
      name: "David Brown",
      phone: "+1234567894",
      email: "david@example.com",
      avatar: "/avatars/david.jpg",
    },
  ];

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
    setPhoneNumber(customer.phone);
    setActiveTab("list"); // Switch to call list when customer is selected
  };

  const handleCall = async () => {
    if (!phoneNumber) return;

    setIsCalling(true);
    try {
      const response = await fetch("/api/twilio/make-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: phoneNumber,
          from: process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER,
          customerId: selectedCustomer?.id,
        }),
      });

      if (response.ok) {
        console.log("Call initiated successfully");
      } else {
        console.error("Failed to initiate call");
      }
    } catch (error) {
      console.error("Error making call:", error);
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <AppLayout>
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        <div className="w-full h-full flex">
          {/* Customer List Sidebar */}
          <div className="w-96 h-full bg-white/5 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col">
            <div className="mb-6 flex-shrink-0">
              <h1 className="text-2xl font-bold text-white mb-2">Customers</h1>
              <p className="text-white/60">Select a customer to call</p>
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
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <UserCircle className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {customer.name}
                      </p>
                      <p className="text-sm text-white/60 truncate">
                        {customer.phone}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          {activeTab === "dialer" && (
            <Dialer
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              isCalling={isCalling}
              handleCall={handleCall}
            />
          )}
          
          {activeTab === "list" && selectedCustomer && (
            <CallList
              selectedCustomer={selectedCustomer}
              setActiveTab={setActiveTab}
              setPhoneNumber={setPhoneNumber}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Page;