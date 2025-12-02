"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Upload, 
  Phone, 
  Pause, 
  Play, 
  SkipForward, 
  Users, 
  FileText, 
  CheckCircle,
  XCircle,
  Clock,
  Building,
  MapPin,
  Tag,
  MessageSquare,
  Download,
  Settings,
  Table,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Papa from "papaparse";

const Page = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [currentCustomerIndex, setCurrentCustomerIndex] = useState(0);
  const [currentNumberIndex, setCurrentNumberIndex] = useState(0);
  const [callStatus, setCallStatus] = useState('idle');
  const [isAutoDialing, setIsAutoDialing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    called: 0,
    connected: 0,
    failed: 0,
    pending: 0
  });
  
  const timerRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedCustomers = results.data.map((row, index) => ({
          id: index + 1,
          customerName: row['customer_name'] || row['Customer Name'] || '',
          companyName: row['company_name'] || row['Company Name'] || '',
          phone1: row['phone1'] || row['Phone 1'] || row['phone'] || '',
          phone2: row['phone2'] || row['Phone 2'] || '',
          phone3: row['phone3'] || row['Phone 3'] || '',
          customerType: row['customer_type'] || row['Customer Type'] || '',
          businessType: row['business_type'] || row['Business Type'] || '',
          address: row['address'] || row['Address'] || '',
          reason: row['reason_to_call'] || row['Reason to Call'] || '',
          campaign: row['campaign_type'] || row['Campaign Type'] || '',
          notes: row['notes'] || row['Notes'] || '',
          status: 'pending',
          attempt: 0
        })).filter(customer => customer.phone1 || customer.phone2 || customer.phone3);

        setCustomers(parsedCustomers);
        setStats({
          total: parsedCustomers.length,
          called: 0,
          connected: 0,
          failed: 0,
          pending: parsedCustomers.length
        });
        setIsUploading(false);
        
        if (parsedCustomers.length > 0) {
          setCurrentCustomerIndex(0);
          setCurrentNumberIndex(0);
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setIsUploading(false);
      }
    });
  };

  // Pagination calculations
  const totalPages = Math.ceil(customers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = customers.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getCurrentPhoneNumber = () => {
    if (!customers[currentCustomerIndex]) return '';
    const numbers = [
      customers[currentCustomerIndex].phone1,
      customers[currentCustomerIndex].phone2,
      customers[currentCustomerIndex].phone3
    ];
    return numbers[currentNumberIndex] || numbers[0] || '';
  };

  const simulateCall = () => {
    const currentCustomer = customers[currentCustomerIndex];
    const phoneNumber = getCurrentPhoneNumber();
    
    if (!phoneNumber) {
      setCallStatus('failed');
      setTimeout(() => moveToNext(), 2000);
      return;
    }

    setCallStatus('dialing');
    
    setTimeout(() => {
      const isConnected = Math.random() > 0.3;
      
      if (isConnected) {
        setCallStatus('connected');
        
        const updatedCustomers = [...customers];
        updatedCustomers[currentCustomerIndex] = {
          ...currentCustomer,
          status: 'connected',
          attempt: (currentCustomer.attempt || 0) + 1
        };
        setCustomers(updatedCustomers);
        
        setStats(prev => ({
          ...prev,
          connected: prev.connected + 1,
          pending: prev.pending - 1
        }));
        
        timerRef.current = setTimeout(() => {
          endCall();
        }, 3000 + Math.random() * 7000);
      } else {
        setCallStatus('failed');
        
        const updatedCustomers = [...customers];
        updatedCustomers[currentCustomerIndex] = {
          ...currentCustomer,
          status: 'failed',
          attempt: (currentCustomer.attempt || 0) + 1
        };
        setCustomers(updatedCustomers);
        
        setStats(prev => ({
          ...prev,
          failed: prev.failed + 1,
          pending: prev.pending - 1
        }));
        
        setTimeout(() => moveToNext(), 2000);
      }
    }, 2000);
  };

  const startAutoDialer = () => {
    if (customers.length === 0) return;
    setIsAutoDialing(true);
    simulateCall();
  };

  const pauseAutoDialer = () => {
    setIsAutoDialing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (callStatus === 'dialing' || callStatus === 'connected') {
      setCallStatus('ended');
    }
  };

  const skipCustomer = () => {
    if (currentNumberIndex < 2) {
      setCurrentNumberIndex(prev => prev + 1);
    } else {
      moveToNext();
    }
  };

  const moveToNext = () => {
    setCallStatus('idle');
    
    if (currentCustomerIndex < customers.length - 1) {
      setCurrentCustomerIndex(prev => prev + 1);
      setCurrentNumberIndex(0);
      
      setStats(prev => ({
        ...prev,
        called: prev.called + 1
      }));
      
      if (isAutoDialing) {
        setTimeout(() => simulateCall(), 1000);
      }
    } else {
      setIsAutoDialing(false);
      setCallStatus('ended');
    }
    
    const newProgress = ((currentCustomerIndex + 1) / customers.length) * 100;
    setProgress(newProgress);
  };

  const endCall = () => {
    setCallStatus('ended');
    setTimeout(() => moveToNext(), 1000);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'connected': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'dialing': return 'text-yellow-400';
      case 'pending': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'dialing': return <Clock className="h-4 w-4 text-yellow-400 animate-spin" />;
      default: return null;
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const currentCustomer = customers[currentCustomerIndex] || null;

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      <div className="h-full p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Power Dialer</h1>
          <p className="text-white/60">Automated calling system with intelligent contact management</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-120px)]">
          {/* Left Column - Upload & Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Upload Contacts</span>
                </h2>
                <a 
                  href="/sample-contacts.csv" 
                  download
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span>Template</span>
                </a>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-white/60 mb-2">
                  Upload CSV/Excel file with customer data
                </label>
                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-white/40" />
                    <div className="text-lg font-medium mb-2">
                      {isUploading ? 'Processing...' : 'Drop file here or click to upload'}
                    </div>
                    <div className="text-sm text-white/40">
                      CSV, XLSX up to 10MB
                    </div>
                  </label>
                </div>
              </div>

              {customers.length > 0 && (
                <>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/60">{customers.length} contacts loaded</span>
                      <span className="text-sm font-medium">{Math.round(progress)}% complete</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* File Preview Toggle */}
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full mt-4 flex items-center justify-center space-x-2 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        <span>Hide Preview</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        <span>Show Preview</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* File Preview Modal */}
            {showPreview && customers.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center space-x-2">
                    <Table className="h-5 w-5" />
                    <span>File Preview</span>
                  </h2>
                  <div className="text-sm text-white/60">
                    {customers.length} rows
                  </div>
                </div>

                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left p-2 text-white/60">#</th>
                        <th className="text-left p-2 text-white/60">Name</th>
                        <th className="text-left p-2 text-white/60">Company</th>
                        <th className="text-left p-2 text-white/60">Phone 1</th>
                        <th className="text-left p-2 text-white/60">Type</th>
                        <th className="text-left p-2 text-white/60">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPageData.map((customer) => (
                        <tr 
                          key={customer.id}
                          className={`border-b border-white/10 hover:bg-white/5 ${
                            customer.id === currentCustomer?.id ? 'bg-purple-500/10' : ''
                          }`}
                        >
                          <td className="p-2">{customer.id}</td>
                          <td className="p-2 font-medium">{customer.customerName}</td>
                          <td className="p-2">{customer.companyName}</td>
                          <td className="p-2 font-mono">{customer.phone1}</td>
                          <td className="p-2">
                            <span className="px-2 py-1 bg-white/10 rounded-full text-xs">
                              {customer.customerType}
                            </span>
                          </td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              customer.status === 'connected' ? 'bg-green-500/20 text-green-300' :
                              customer.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                              customer.status === 'dialing' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-white/10 text-white/60'
                            }`}>
                              {customer.status || 'pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/60">
                    Showing {startIndex + 1}-{Math.min(endIndex, customers.length)} of {customers.length}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Items per page selector */}
                <div className="mt-4">
                  <label className="text-sm text-white/60 mr-2">Rows per page:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold mb-4">Dialer Controls</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={isAutoDialing ? pauseAutoDialer : startAutoDialer}
                  disabled={customers.length === 0}
                  className={`flex items-center justify-center space-x-2 py-3 rounded-xl font-medium transition-all ${
                    isAutoDialing
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                      : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  {isAutoDialing ? (
                    <>
                      <Pause className="h-5 w-5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      <span>Start Auto Dial</span>
                    </>
                  )}
                </button>

                <button
                  onClick={skipCustomer}
                  disabled={!isAutoDialing || !currentCustomer}
                  className="flex items-center justify-center space-x-2 py-3 rounded-xl font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <SkipForward className="h-5 w-5" />
                  <span>Skip</span>
                </button>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-white/40" />
                    <span className="text-sm text-white/60">Total</span>
                  </div>
                  <span className="font-bold">{stats.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-white/60">Connected</span>
                  </div>
                  <span className="font-bold text-green-400">{stats.connected}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-white/60">Failed</span>
                  </div>
                  <span className="font-bold text-red-400">{stats.failed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-white/60">Pending</span>
                  </div>
                  <span className="font-bold">{stats.pending}</span>
                </div>
              </div>
            </div>

            {/* Current Number Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold mb-4">Current Number</h2>
              <div className="text-center">
                <div className="text-3xl font-mono font-bold mb-2">
                  {getCurrentPhoneNumber() || 'No number'}
                </div>
                <div className="text-sm text-white/60">
                  Attempt {currentNumberIndex + 1} of 3
                </div>
                <div className={`text-lg font-bold mt-4 ${getStatusColor(callStatus)}`}>
                  {callStatus === 'idle' && 'Ready'}
                  {callStatus === 'dialing' && 'Dialing...'}
                  {callStatus === 'connected' && 'Connected'}
                  {callStatus === 'failed' && 'Failed'}
                  {callStatus === 'ended' && 'Ended'}
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Current Customer Info */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 h-full">
              <h2 className="text-xl font-bold mb-6">Current Contact</h2>
              
              {currentCustomer ? (
                <div className="space-y-6">
                  {/* Customer Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl font-bold">{currentCustomer.customerName}</span>
                        {getStatusIcon(currentCustomer.status)}
                      </div>
                      <div className="flex items-center space-x-2 text-white/60">
                        <Building className="h-4 w-4" />
                        <span>{currentCustomer.companyName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white/60">Contact #{currentCustomerIndex + 1}</div>
                      <div className="text-sm font-medium">Attempt {currentCustomer.attempt + 1}</div>
                    </div>
                  </div>

                  {/* Contact Numbers */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <h3 className="font-bold mb-3 text-white/80">Contact Numbers</h3>
                    <div className="space-y-2">
                      {[currentCustomer.phone1, currentCustomer.phone2, currentCustomer.phone3].map((phone, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-center justify-between p-2 rounded-lg ${
                            idx === currentNumberIndex 
                              ? 'bg-purple-500/20 border border-purple-500/30' 
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-white/40" />
                            <span className={phone ? 'font-medium' : 'text-white/40'}>
                              {phone || 'Not provided'}
                            </span>
                          </div>
                          {idx < currentNumberIndex && (
                            <XCircle className="h-4 w-4 text-red-400" />
                          )}
                          {idx === currentNumberIndex && callStatus !== 'idle' && (
                            <div className="animate-pulse">
                              <div className="h-2 w-2 rounded-full bg-yellow-400" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Details */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-white/40 mt-1" />
                      <div>
                        <div className="text-sm text-white/60">Address</div>
                        <div>{currentCustomer.address || 'Not provided'}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="text-sm text-white/60 mb-1">Customer Type</div>
                        <div className="px-3 py-1 bg-white/10 rounded-full text-sm inline-block">
                          {currentCustomer.customerType || 'N/A'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white/60 mb-1">Business Type</div>
                        <div className="px-3 py-1 bg-white/10 rounded-full text-sm inline-block">
                          {currentCustomer.businessType || 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Tag className="h-4 w-4 text-white/40" />
                        <div className="text-sm text-white/60">Campaign</div>
                      </div>
                      <div className="px-3 py-2 bg-white/10 rounded-lg">
                        {currentCustomer.campaign || 'General Outreach'}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-white/40" />
                        <div className="text-sm text-white/60">Reason to Call</div>
                      </div>
                      <div className="px-3 py-2 bg-white/10 rounded-lg">
                        {currentCustomer.reason || 'Follow-up'}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-white/60 mb-2">Notes</div>
                      <div className="px-3 py-2 bg-white/10 rounded-lg min-h-[80px]">
                        {currentCustomer.notes || 'No notes provided'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-white/20" />
                  <div className="text-white/60">No contact selected</div>
                  <div className="text-sm text-white/40 mt-2">Upload a CSV file to get started</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Call List */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Call Queue</h2>
                <div className="text-sm text-white/60">
                  {customers.length} total
                </div>
              </div>
              
              <div className="space-y-2 max-h-[calc(100%-60px)] overflow-y-auto">
                {customers.map((customer, index) => (
                  <div
                    key={customer.id}
                    className={`p-3 rounded-xl border transition-all cursor-pointer hover:bg-white/5 ${
                      index === currentCustomerIndex
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-white/5 border-white/10'
                    }`}
                    onClick={() => setCurrentCustomerIndex(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{customer.customerName}</div>
                        <div className="text-sm text-white/60">{customer.companyName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono">{customer.phone1}</div>
                        <div className="flex items-center justify-end space-x-1 mt-1">
                          {getStatusIcon(customer.status)}
                          <span className={`text-xs ${getStatusColor(customer.status)}`}>
                            {customer.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {customers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 text-white/20" />
                    <div className="text-white/60">No contacts in queue</div>
                    <div className="text-sm text-white/40 mt-2">Upload a CSV file to populate the queue</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;