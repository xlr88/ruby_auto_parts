import React, { useEffect, useState } from 'react';
import { getSales } from '../services/api';

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getSales(selectedDate);
        setSales(response.data);
      } catch (err) {
        setError('Failed to fetch sales history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  if (loading) return <div className="text-center mt-8">Loading sales history...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Error: {error}</div>;
  
  const formattedDate = new Date(selectedDate).toLocaleDateString();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Sales History</h1>
      <div className="mb-4">
        <label htmlFor="saleDate" className="block text-sm font-medium text-gray-700">Select Date:</label>
        <input
          type="date"
          id="saleDate"
          value={selectedDate}
          onChange={handleDateChange}
          className="mt-1 block w-1/4 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      {sales.length === 0 ? (
        <div className="text-center mt-8 text-gray-600">No sales done on {formattedDate}.</div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Sale ID
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Items Sold
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Billed By
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Sale Date
                </th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale._id}>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    {sale._id}
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    {sale.customerName}
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    {sale.customerContact || 'N/A'}
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <ul className="list-disc pl-5">
                      {sale.itemsSold.map((itemDetail) => (
                        <li key={itemDetail._id}>
                          {itemDetail.item?.name} (x{itemDetail.quantity}) - ${itemDetail.priceAtSale?.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    ${sale.totalAmount?.toFixed(2)}
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    {sale.billedBy ? sale.billedBy.username : 'N/A'}
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    {new Date(sale.saleDate).toLocaleDateString()}
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

export default SalesHistory;
