/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useRef } from "react";
import { Phone, X, ArrowLeft, UserCircle } from "lucide-react";

const Dialer = ({ 
  phoneNumber, 
  setPhoneNumber, 
  selectedCustomer, 
  setSelectedCustomer, 
  isCalling, 
  handleCall 
}) => {
  const inputRef = useRef(null);

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

  const dialPadNumbers = [
    [
      { number: "1" },
      { number: "2" },
      { number: "3" },
    ],
    [
      { number: "4" },
      { number: "5" },
      { number: "6" },
    ],
    [
      { number: "7" },
      { number: "8" },
      { number: "9" },
    ],
    [
      { number: "+" },
      { number: "0" },
      { number: "#" },
    ],
  ];

  return (
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
                  className="w-full text-3xl font-mono font-bold text-white bg-transparent border-none outline-none placeholder-white/40 placeholder:text-lg placeholder:font-normal"
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
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {dialPadNumbers.map((row, rowIndex) => (
                <div key={rowIndex} className="contents">
                  {row.map((item) => (
                    <button
                      key={item.number}
                      onClick={() => handleNumberClick(item.number)}
                      disabled={phoneNumber.length >= 15 && !hasSelection()}
                      className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all duration-200 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed group"
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className="text-2xl font-semibold group-hover:text-purple-300 transition-colors">
                          {item.number}
                        </span>
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
  );
};

export default Dialer;