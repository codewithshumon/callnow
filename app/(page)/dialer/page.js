/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, Search, X, ArrowLeft, UserCircle } from "lucide-react";
import AppLayout from "@/app/(page)/layouts/AppLayout";

const Page = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const inputRef = useRef(null);

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

  const handleNumberClick = (number) => {
    if (phoneNumber.length >= 15 && !hasSelection()) return;
    
    const input = inputRef.current;
    if (input && hasSelection()) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      
      const newNumber = phoneNumber.slice(0, start) + number + phoneNumber.slice(end);
      setPhoneNumber(newNumber);
      
      setTimeout(() => {
        input.setSelectionRange(start + 1, start + 1);
      }, 0);
    } else {
      setPhoneNumber((prev) => prev + number);
    }
  };

  const handleBackspace = () => {
    const input = inputRef.current;
    if (input && hasSelection()) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newNumber = phoneNumber.slice(0, start) + phoneNumber.slice(end);
      setPhoneNumber(newNumber);
      
      setTimeout(() => {
        input.setSelectionRange(start, start);
      }, 0);
    } else {
      setPhoneNumber((prev) => prev.slice(0, -1));
    }
  };

  const hasSelection = () => {
    const input = inputRef.current;
    return input && input.selectionStart !== input.selectionEnd;
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setPhoneNumber(customer.phone);
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

  const dialPadNumbers = [
    [
      { number: "1", letters: "" },
      { number: "2", letters: "ABC" },
      { number: "3", letters: "DEF" },
    ],
    [
      { number: "4", letters: "GHI" },
      { number: "5", letters: "JKL" },
      { number: "6", letters: "MNO" },
    ],
    [
      { number: "7", letters: "PQRS" },
      { number: "8", letters: "TUV" },
      { number: "9", letters: "WXYZ" },
    ],
    [
      { number: "+", letters: "" },
      { number: "0", letters: "" },
      { number: "#", letters: "" },
    ],
  ];

  return (
    <AppLayout>
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        <div className="w-full h-full flex">
          <div className="w-96 h-full bg-white/5 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Customers</h1>
              <p className="text-white/60">Select a customer to call</p>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-5 w-5" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="flex-1 h-full overflow-y-auto space-y-2">
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

          <div className="flex-1 h-full p-8 flex items-center justify-center">
            <div className="max-w-md w-full">
              {isCalling ? (
                <div className="text-center mb-8">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <UserCircle className="h-12 w-12 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {selectedCustomer?.name || "Unknown"}
                  </h2>
                  <p className="text-xl text-white/60">
                    {phoneNumber}
                  </p>
                  <div className="mt-6">
                    <div className="inline-flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse"></div>
                      <div
                        className="w-2 h-2 rounded-full bg-white/60 animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-white/60 animate-pulse"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                    <p className="text-white/40 text-sm mt-2">Calling...</p>
                  </div>
                </div>
              ) : (
                <>
                  {selectedCustomer && (
                    <div className="mb-8 p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <UserCircle className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {selectedCustomer.name}
                            </p>
                            <p className="text-white/60 text-sm">
                              {selectedCustomer.phone}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCustomer(null);
                            setPhoneNumber("");
                          }}
                          className="text-white/60 hover:text-white transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mb-8 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between">
                      <input
                        ref={inputRef}
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => {
                          if (e.target.value.length <= 15) {
                            setPhoneNumber(e.target.value);
                          }
                        }}
                        placeholder="Phone number"
                        className="w-full text-3xl font-mono font-bold text-white bg-transparent border-none outline-none placeholder-white/40"
                        style={{ caretColor: 'white' }}
                      />
                      {phoneNumber && (
                        <button
                          onClick={handleBackspace}
                          className="p-2 text-white/60 hover:text-white transition-colors hover:bg-white/10 rounded-lg ml-2"
                        >
                          <ArrowLeft className="h-6 w-6" />
                        </button>
                      )}
                    </div>
                    {phoneNumber.length > 0 && (
                      <div className="text-right mt-2">
                        <span className="text-sm text-white/40">
                          {phoneNumber.length}/15
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {dialPadNumbers.map((row, rowIndex) => (
                      <div key={rowIndex} className="contents">
                        {row.map((item) => (
                          <button
                            key={item.number}
                            onClick={() => handleNumberClick(item.number)}
                            disabled={phoneNumber.length >= 15 && !hasSelection()}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all duration-200 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed group"
                          >
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className="text-2xl font-semibold group-hover:text-purple-300 transition-colors">
                                {item.number}
                              </span>
                              {item.letters && (
                                <span className="text-xs text-white/40 group-hover:text-white/60 mt-1">
                                  {item.letters}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleCall}
                    disabled={!phoneNumber || isCalling}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 ${
                      phoneNumber && !isCalling
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 active:scale-95 shadow-2xl hover:shadow-3xl"
                        : "bg-white/10 cursor-not-allowed border border-white/10"
                    } text-white flex items-center justify-center space-x-3`}
                  >
                    <Phone className="h-6 w-6" />
                    <span>Make Call</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Page;