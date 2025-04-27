import React, { useState, useEffect } from 'react';

const DonationThermometer = () => {
  const [totalDonations, setTotalDonations] = useState(0);
  const [goal, setGoal] = useState(10000);
  const [recentDonors, setRecentDonors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // API endpoint for your Netlify function
  const API_URL = '/.netlify/functions/get-donations';
  
  // Calculate percentage filled
  const percentFilled = Math.min((totalDonations / goal) * 100, 100);
  
  // Fetch donation data on component mount and at regular intervals
  useEffect(() => {
    // Function to fetch data
    const fetchDonationData = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error('Failed to fetch donation data');
        }
        
        const data = await response.json();
        setTotalDonations(data.total);
        
        if (data.recentDonations && data.recentDonations.length > 0) {
          setRecentDonors(data.recentDonations);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching donation data:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };
    
    // Fetch initial data
    fetchDonationData();
    
    // Set up polling interval (every 10 seconds)
    const intervalId = setInterval(fetchDonationData, 10000);
    
    // Clean up
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // Admin panel state for testing
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  
  // Function to handle manual donation (for testing)
  const handleManualDonation = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/.netlify/functions/add-donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: donorName,
          amount: parseFloat(donationAmount),
          adminKey: adminKey
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Show success message
        setAdminMessage({ type: 'success', text: result.message });
        
        // Clear form
        setDonorName('');
        setDonationAmount('');
        
        // Refresh data immediately
        fetch('/.netlify/functions/get-donations')
          .then(res => res.json())
          .then(data => {
            setTotalDonations(data.total);
            if (data.recentDonations && data.recentDonations.length > 0) {
              setRecentDonors(data.recentDonations);
            }
          });
      } else {
        setAdminMessage({ type: 'error', text: result.error || 'Failed to add donation' });
      }
    } catch (error) {
      console.error('Error adding manual donation:', error);
      setAdminMessage({ type: 'error', text: 'Failed to connect to server' });
    }
  };
  
  // Toggle admin panel with special key combination (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setShowAdmin(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-gray-100 p-6">
      {isLoading ? (
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Loading donation data...</div>
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500">
          <div className="text-2xl font-bold mb-2">Error loading data</div>
          <div>{error}</div>
        </div>
      ) : (
        <>
          <h1 className="text-4xl font-bold mb-8 text-center">Fundraising Progress</h1>
          
          {/* Goal and current amount */}
          <div className="w-full max-w-3xl text-center mb-2">
            <div className="flex justify-between">
              <span className="text-2xl font-bold">${totalDonations.toLocaleString()}</span>
              <span className="text-xl">Goal: ${goal.toLocaleString()}</span>
            </div>
          </div>
          
          {/* Thermometer */}
          <div className="w-full max-w-3xl h-24 bg-white border-4 border-gray-300 rounded-full overflow-hidden mb-8">
            <div 
              className="h-full bg-red-500 transition-all duration-1000 ease-out"
              style={{ width: `${percentFilled}%` }}
            ></div>
          </div>
          
          {/* Recent donors */}
          <div className="w-full max-w-3xl">
            <h2 className="text-2xl font-semibold mb-4">Recent Donors</h2>
            <div className="bg-white rounded-lg shadow-lg p-6">
              {recentDonors.length > 0 ? (
                <ul>
                  {recentDonors.slice().reverse().map((donor, index) => (
                    <li key={index} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                      <span className="font-medium">{donor.name}</span>
                      <span className="font-bold">${donor.amount}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center">No donations yet</p>
              )}
            </div>
          </div>
          
          {/* Admin Panel (hidden by default, toggle with Ctrl+Shift+A) */}
          {showAdmin && (
            <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t-2 border-gray-300 shadow-lg">
              <h3 className="text-lg font-bold mb-2">Admin Panel</h3>
              
              <form onSubmit={handleManualDonation} className="flex flex-wrap gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Admin Key</label>
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    required
                  />
                </div>
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
        </>
      )}
    </div>
  );
};

export default DonationThermometer;
