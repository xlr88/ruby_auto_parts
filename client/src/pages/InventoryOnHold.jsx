import React, { useState, useEffect } from 'react';
import API from '../services/api.js'; // Corrected path (one level up)
import { useAuth } from '../contexts/AuthContext.jsx'; // Added .jsx extension
import '../styles.css'; // Assuming shared styles

const InventoryOnHold = () => {
  const [onHoldItems, setOnHoldItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    price: '',
    tags: '',
    brand: '',
    quantity: 1,
    isTaxable: false,
  });
  const { user, isAdmin, isEmployee } = useAuth();

  const fetchOnHoldItems = async () => {
    setLoading(true);
    try {
      const response = await API.get('/onhold');
      setOnHoldItems(response.data);
    } catch (err) {
      setError('Failed to fetch on-hold items.' + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchOnHoldItems();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const itemToSend = {
        ...form,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
        tags: form.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      };
      await API.post('/onhold', itemToSend);
      setForm({
        name: '',
        price: '',
        tags: '',
        brand: '',
        quantity: 1,
        isTaxable: false,
      });
      fetchOnHoldItems();
    } catch (err) {
      setError('Failed to add item.' + (err.response?.data?.message || err.message));
    }
  };

  const handleApprove = async (id) => {
    try {
      await API.put(`/onhold/${id}/approve`);
      fetchOnHoldItems();
    } catch (err) {
      setError('Failed to approve item.' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (id) => {
    try {
      await API.put(`/onhold/${id}/reject`);
      fetchOnHoldItems();
    } catch (err) {
      setError('Failed to reject item.' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item from On-Hold Inventory?')) {
      try {
        await API.delete(`/onhold/${id}`);
        fetchOnHoldItems();
      } catch (err) {
        setError('Failed to delete item.' + (err.response?.data?.message || err.message));
      }
    }
  };

  if (loading) {
    return <div className="container">Loading On-Hold Inventory...</div>;
  }

  if (error) {
    return <div className="container error-message">Error: {error}</div>;
  }

  return (
    <div className="container">
      <h2>On-Hold Inventory</h2>

      {(isAdmin || isEmployee) && ( // Only employees/admins can add to on-hold
        <div className="card mb-4">
          <h3>Add New On-Hold Item</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name:</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Price:</label>
              <input type="number" name="price" value={form.price} onChange={handleChange} required min="0" step="0.01" />
            </div>
            <div className="form-group">
              <label>Tags (comma-separated):</label>
              <input type="text" name="tags" value={form.tags} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Brand:</label>
              <input type="text" name="brand" value={form.brand} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Quantity:</label>
              <input type="number" name="quantity" value={form.quantity} onChange={handleChange} required min="1" />
            </div>
            <div className="form-group form-check">
              <input type="checkbox" id="isTaxable" name="isTaxable" checked={form.isTaxable} onChange={handleChange} />
              <label htmlFor="isTaxable">Is Taxable</label>
            </div>
            <button type="submit" className="btn btn-primary">Add Item to On-Hold</button>
          </form>
        </div>
      )}

      <h3>Current On-Hold Items</h3>
      {onHoldItems.length === 0 ? (
        <p>No items on hold.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Tags</th>
                <th>Brand</th>
                <th>Taxable</th>
                <th>Status</th>
                <th>Added By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {onHoldItems.map((item) => (
                <tr key={item._id}>
                  <td>{item.uniqueCode}</td>
                  <td>{item.name}</td>
                  <td>₹{item.price.toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td>{item.tags.join(', ')}</td>
                  <td>{item.brand}</td>
                  <td>{item.isTaxable ? 'Yes' : 'No'}</td>
                  <td>{item.status}</td>
                  <td>{item.addedBy?.username || 'N/A'}</td>
                  <td>
                    {isAdmin && item.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(item._id)} className="btn btn-success btn-sm">Approve</button>
                        <button onClick={() => handleReject(item._id)} className="btn btn-warning btn-sm ml-2">Reject</button>
                      </>
                    )}
                    {isAdmin && (item.status === 'approved' || item.status === 'rejected') && (
                      <button onClick={() => handleDelete(item._id)} className="btn btn-danger btn-sm ml-2">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InventoryOnHold;
