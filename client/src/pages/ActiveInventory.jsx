import React, { useState, useEffect } from 'react';
import API from '../services/api.js'; // Corrected path (one level up)
import { useAuth } from '../contexts/AuthContext.jsx'; // Corrected path (one level up)
import '../styles.css';

const ActiveInventory = () => {
  const [activeItems, setActiveItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState({
    name: '',
    tag: '',
    brand: '',
  });
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    tags: '',
    brand: '',
    quantity: '',
    isTaxable: false,
  });
  const { user, isAdmin, isEmployee } = useAuth();

  const fetchActiveItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.name) params.append('name', searchQuery.name);
      if (searchQuery.tag) params.append('tag', searchQuery.tag);
      if (searchQuery.brand) params.append('brand', searchQuery.brand);

      const response = await API.get('/active', { params });
      setActiveItems(response.data);
    } catch (err) {
      setError('Failed to fetch active items.' + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchActiveItems();
    }
  }, [user, searchQuery]);

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchQuery({
      ...searchQuery,
      [name]: value,
    });
  };

  const handleEditClick = (item) => {
    setEditingItem(item._id);
    setEditForm({
      name: item.name,
      price: item.price,
      tags: item.tags.join(', '),
      brand: item.brand,
      quantity: item.quantity,
      isTaxable: item.isTaxable,
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm({
      ...editForm,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const itemToSend = {
        ...editForm,
        price: parseFloat(editForm.price),
        quantity: parseInt(editForm.quantity),
        tags: editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      };
      await API.put(`/active/${editingItem}`, itemToSend);
      setEditingItem(null);
      fetchActiveItems();
    } catch (err) {
      setError('Failed to update item.' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item from Active Inventory?')) {
      try {
        await API.delete(`/active/${id}`);
        fetchActiveItems();
      } catch (err) {
        setError('Failed to delete item.' + (err.response?.data?.message || err.message));
      }
    }
  };

  if (loading) {
    return <div className="container">Loading Active Inventory...</div>;
  }

  if (error) {
    return <div className="container error-message">Error: {error}</div>;
  }

  return (
    <div className="container">
      <h2>Active Inventory</h2>

      <div className="card mb-4">
        <h3>Search & Filter</h3>
        <div className="form-group">
          <label>Name:</label>
          <input type="text" name="name" value={searchQuery.name} onChange={handleSearchChange} placeholder="Search by name" />
        </div>
        <div className="form-group">
          <label>Tag:</label>
          <input type="text" name="tag" value={searchQuery.tag} onChange={handleSearchChange} placeholder="Search by tag" />
        </div>
        <div className="form-group">
          <label>Brand:</label>
          <input type="text" name="brand" value={searchQuery.brand} onChange={handleSearchChange} placeholder="Search by brand" />
        </div>
      </div>

      <h3>Current Active Items</h3>
      {activeItems.length === 0 ? (
        <p>No active items found.</p>
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
                <th>Added By</th>
                <th>Approved By</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {activeItems.map((item) => (
                <tr key={item._id}>
                  <td>{item.uniqueCode}</td>
                  <td>
                    {editingItem === item._id ? (
                      <input type="text" name="name" value={editForm.name} onChange={handleEditFormChange} />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td>
                    {editingItem === item._id ? (
                      <input type="number" name="price" value={editForm.price} onChange={handleEditFormChange} step="0.01" />
                    ) : (
                      `₹${item.price.toFixed(2)}`
                    )}
                  </td>
                  <td>
                    {editingItem === item._id ? (
                      <input type="number" name="quantity" value={editForm.quantity} onChange={handleEditFormChange} />
                    ) : (
                      item.quantity
                    )}
                  </td>
                  <td>
                    {editingItem === item._id ? (
                      <input type="text" name="tags" value={editForm.tags} onChange={handleEditFormChange} />
                    ) : (
                      item.tags.join(', ')
                    )}
                  </td>
                  <td>
                    {editingItem === item._id ? (
                      <input type="text" name="brand" value={editForm.brand} onChange={handleEditFormChange} />
                    ) : (
                      item.brand
                    )}
                  </td>
                  <td>
                    {editingItem === item._id ? (
                      <input type="checkbox" name="isTaxable" checked={editForm.isTaxable} onChange={handleEditFormChange} />
                    ) : (
                      item.isTaxable ? 'Yes' : 'No'
                    )}
                  </td>
                  <td>{item.addedBy?.username || 'N/A'}</td>
                  <td>{item.approvedBy?.username || 'N/A'}</td>
                  {isAdmin && (
                    <td>
                      {editingItem === item._id ? (
                        <button onClick={handleUpdateItem} className="btn btn-success btn-sm">Save</button>
                      ) : (
                        <button onClick={() => handleEditClick(item)} className="btn btn-primary btn-sm">Edit</button>
                      )}
                      <button onClick={() => handleDeleteItem(item._id)} className="btn btn-danger btn-sm ml-2">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActiveInventory;
