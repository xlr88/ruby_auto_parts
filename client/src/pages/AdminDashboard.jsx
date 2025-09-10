import React, { useState, useEffect } from 'react';
import API from '../services/api.js'; // Corrected path (one level up)
import { useAuth } from '../contexts/AuthContext.jsx';
import '../styles.css';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const { user, isAdmin } = useAuth();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterYear) params.append('year', filterYear);
      if (filterMonth) params.append('month', filterMonth);

      const response = await API.get('/sales/analytics', { params });
      setAnalytics(response.data);
    } catch (err) {
      setError('Failed to fetch sales analytics.' + (err.response?.data?.message || err.message));
    }
  };

  const fetchLowStockAlerts = async () => {
    try {
      const response = await API.get('/sales/lowstock');
      setLowStockItems(response.data);
    } catch (err) {
      setError('Failed to fetch low stock alerts.' + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
      fetchLowStockAlerts();
    }
  }, [isAdmin, filterYear, filterMonth]);

  if (!isAdmin) {
    return <div className="container error-message">You are not authorized to view this page.</div>;
  }

  if (loading) {
    return <div className="container">Loading Admin Dashboard...</div>;
  }

  if (error) {
    return <div className="container error-message">Error: {error}</div>;
  }

  const currentMonthName = new Date(filterYear, filterMonth - 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>

      <div className="card mb-4">
        <h3>Sales Analytics</h3>
        <div className="form-inline mb-3">
          <label className="mr-2">Year:</label>
          <input
            type="number"
            className="form-control inline-input mr-3"
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            min="2000"
            max={new Date().getFullYear()}
          />
          <label className="mr-2">Month:</label>
          <select
            className="form-control inline-input"
            value={filterMonth}
            onChange={(e) => setFilterMonth(parseInt(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((monthNum) => (
              <option key={monthNum} value={monthNum}>
                {new Date(0, monthNum - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>

        {analytics && analytics.length > 0 && (
          <div>
            <p><strong>Total Sales ({currentMonthName} {filterYear}):</strong> ₹{analytics[0]?.totalSales?.toFixed(2)} ({analytics[0]?.totalItemsSold} items)</p>
            <p><strong>Total Bills ({currentMonthName} {filterYear}):</strong> {analytics[0]?.totalBills}</p>

            {/* Remove month-by-month sales as this data is no longer returned in the current analytics structure */}
            {/* 
            <h4>Month-by-Month Sales</h4>
            {analytics.monthByMonthSales.length > 0 ? (
              <ul>
                {analytics.monthByMonthSales.map((mbs) => (
                  <li key={`${mbs._id.year}-${mbs._id.month}`}>
                    {new Date(0, mbs._id.month - 1).toLocaleString('default', { month: 'short' })} {mbs._id.year}: ₹{mbs.totalSales.toFixed(2)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No month-by-month sales data.</p>
            )}
            */}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Low Stock Alerts ({lowStockItems.length} items)</h3>
        {lowStockItems.length === 0 ? (
          <p>No low stock items.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Brand</th>
                  <th>Quantity</th>
                  <th>Unique Code</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.brand}</td>
                    <td>{item.quantity}</td>
                    <td>{item.uniqueCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
