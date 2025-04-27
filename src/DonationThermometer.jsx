import React, { useState, useEffect } from 'react';

const DonationThermometer = () => {
  const [totalDonations, setTotalDonations] = useState(0);
  const [goal, setGoal] = useState(10000);
  const [recentDonors, setRecentDonors] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  
  // Calculate percentage filled
  const percentFilled = Math.min((totalDonations / goal) * 100, 100);
  
  // Load saved data from localStorage
  useEffect(() => {
    const savedTotal = localStorage.getItem('totalDonations');
    const savedDonors = localStorage.getItem('recentDonors');
    
    if (savedTotal) {
      setTotalDonations(parseFloat(savedTotal));
    }
    
    if (savedDonors) {
      setRecentDonors(JSON.parse(savedDonors));
    }
    
    // Check URL for admin panel
    if (window.location.search.includes('admin=true')) {
      setShowAdmin(true);
    }
  }, []);
  
  // Toggle admin panel with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setShowAdmin(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Handle adding a donation
  const handleAddDonation = (e) => {
    e.preventDefault();
    
    if (!donationAmount || isNaN(parseFloat(donationAmount)) || parseFloat(donationAmount) <= 0) {
      setAdminMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }
    
    const amount = parseFloat(donationAmount);
    const name = donorName.trim() || 'Anonymous';
    const newDonation = {
      name,
      amount,
      timestamp: new Date().toISOString()
    };
    
    // Update total
    const newTotal = totalDonations + amount;
    setTotalDonations(newTotal);
    localStorage.setItem('totalDonations', newTotal.toString());
    
    // Update recent donors
    const updatedDonors = [...recentDonors, newDonation].slice(-5);
    setRecentDonors(updatedDonors);
    localStorage.setItem('recentDonors', JSON.stringify(updatedDonors));
    
    // Clear form and show success message
    setDonorName('');
    setDonationAmount('');
    setAdminMessage({ type: 'success', text: `Added $${amount} donation from ${name}` });
  };
  
  // Reset all data
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all donations to zero?')) {
      setTotalDonations(0);
      setRecentDonors([]);
      localStorage.setItem('totalDonations', '0');
      localStorage.setItem('recentDonors', JSON.stringify([]));
      setAdminMessage({ type: 'success', text: 'All donation data has been reset' });
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-blue-50 p-6">
      <h1 className="text-5xl font-bold mb-10 text-center text-blue-800">Fundraising Progress</h1>
      
      {/* Goal and current amount */}
      <div className="w-full max-w-4xl text-center mb-4">
        <div className="flex justify-between items-center">
          <span className="text-4xl font-bold text-green-600">${totalDonations.toLocaleString()}</span>
          <span className="text-2xl font-semibold text-gray-700">Goal: ${goal.toLocaleString()}</span>
        </div>
      </div>
      
      {/* Thermometer */}
      <div className="w-full max-w-4xl mb-12">
        <div className="relative">
          {/* Thermometer background */}
          <div className="h-32 bg-white border-4 border-gray-300 rounded-full overflow-hidden shadow-lg">
            {/* Filled part */}
            <div 
              className="h-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 transition-all duration-1000 ease-out"
              style={{ width: `${percentFilled}%` }}
            ></div>
          </div>
          
          {/* Markers */}
          <div className="absolute top-full mt-2 w-full flex justify-between text-sm font-medium text-gray-600">
            <span>$0</span>
            <span className="ml-auto">${goal.toLocaleString()}</span>
          </div>
          
          {/* Percentage */}
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 text-2xl font-bold text-white drop-shadow-md"
            style={{ left: `${Math.max(percentFilled - 5, 2)}%`, display: percentFilled < 5 ? 'none' : 'block' }}
          >
            {Math.round(percentFilled)}%
          </div>
        </div>
      </div>
      
      {/* Recent donors */}
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-semibold mb-4 text-blue-800">Recent Donors</h2>
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200">
          {recentDonors.length > 0 ? (
            <ul>
              {recentDonors.slice().reverse().map((donor, index) => (
                <li key={index} className="flex justify-between py-3 border-b border-gray-200 last:border-0 items-center">
                  <span className="font-medium text-xl text-gray-800">{donor.name}</span>
                  <span className="font-bold text-2xl text-green-600">${donor.amount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center text-lg py-4">No donations yet</p>
          )}
        </div>
      </div>
      
      {/* Admin Panel (hidden by default, toggle with Ctrl+Shift+A or ?admin=true) */}
      {showAdmin && (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t-2 border-gray-300 shadow-lg">
          <h3 className="text-lg font-bold mb-2">Admin Panel</h3>
          
          <form onSubmit={handleAddDonation} className="flex flex-wrap gap-2 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Donor Name</label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                placeholder="Anonymous"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
              <input
                type="number"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                step="0.01"
                min="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Add Donation
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
            >
              Reset All
            </button>
            <button
              type="button"
              onClick={() => setShowAdmin(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Close
            </button>
          </form>
          
          {adminMessage && (
            <div className={`mt-2 p-2 rounded ${adminMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {adminMessage.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DonationThermometer;
