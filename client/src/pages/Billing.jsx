import React, { useState, useEffect, useRef } from 'react';
import { recordSale } from '../services/api'; // Import recordSale
import API from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import ZxingScanner from '../components/ZxingScanner.jsx';
import '../styles.css';

const Billing = () => {
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState(''); // Changed from customerMobile
  const [billItems, setBillItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { user } = useAuth();
  const billRef = useRef();
  const [saleRecorded, setSaleRecorded] = useState(false);
  const [lastRecordedSaleId, setLastRecordedSaleId] = useState(null);
  const [lastSaleDetails, setLastSaleDetails] = useState(null); // New state to store last sale details

  const fetchItemByUniqueCode = async (code) => {
    try {
      const response = await API.get(`/active/${code}`);
      const item = response.data;
      // Check if item already exists in billItems, if so, increment quantity
      const existingItemIndex = billItems.findIndex(bi => bi.item._id === item._id);

      if (existingItemIndex > -1) {
        const updatedBillItems = [...billItems];
        const existingBillItem = updatedBillItems[existingItemIndex];

        if (existingBillItem.quantity + 1 > item.quantity) {
          setError(`Cannot add more than available stock for ${item.name}. Available: ${item.quantity}`);
          return;
        }

        updatedBillItems[existingItemIndex].quantity += 1;
        setBillItems(updatedBillItems);
      } else {
        setBillItems([...billItems, { item: item, quantity: 1 }]);
      }
      setQrCodeInput('');
      setError('');
    } catch (err) {
      setError('Failed to fetch item: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleQrCodeSubmit = (e) => {
    e.preventDefault();
    if (qrCodeInput) {
      fetchItemByUniqueCode(qrCodeInput);
    }
  };

  const handleScanResult = (result) => {
    if (result) {
      try {
        const parsed = JSON.parse(result);
        if (parsed.uniqueCode) {
          fetchItemByUniqueCode(parsed.uniqueCode);
        } else {
          fetchItemByUniqueCode(result); // Fallback if QR data is not JSON or uniqueCode is missing
        }
      } catch (e) {
        fetchItemByUniqueCode(result); // If not JSON, treat as raw QR code
      }
    }
  };

  const handleQuantityChange = (index, newQuantity) => {
    const updatedBillItems = [...billItems];
    const itemInStock = updatedBillItems[index].item;

    if (newQuantity < 1) {
      setError('Quantity cannot be less than 1.');
      return;
    }
    if (newQuantity > itemInStock.quantity) {
      setError(`Cannot add more than available stock for ${itemInStock.name}. Available: ${itemInStock.quantity}`);
      return;
    }

    updatedBillItems[index].quantity = newQuantity;
    setBillItems(updatedBillItems);
  };

  const handleRemoveItem = (index) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    let subTotal = 0;
    let gstAmount = 0;

    billItems.forEach(billItem => {
      const itemPrice = billItem.item.price;
      const itemQuantity = billItem.quantity;
      const itemTotal = itemPrice * itemQuantity;
      subTotal += itemTotal;

      if (billItem.item.isTaxable) {
        gstAmount += itemTotal * 0.18; // Assuming 18% GST
      }
    });

    const discountAmount = subTotal * (discount / 100);
    const totalAfterDiscount = subTotal - discountAmount;
    const finalTotal = totalAfterDiscount + gstAmount;

    return { subTotal, gstAmount, discountAmount, totalAfterDiscount, finalTotal };
  };

  const { subTotal, gstAmount, discountAmount, totalAfterDiscount, finalTotal } = calculateTotals();

  const handleRecordSale = async () => {
    if (billItems.length === 0) {
      setError('Please add items to the sale.');
      return;
    }
    if (!customerName || !customerContact) {
      setError('Please enter customer name and contact number.');
      return;
    }

    try {
      const itemsForSale = billItems.map(bi => ({
        item: bi.item._id,
        quantity: bi.quantity,
        priceAtSale: bi.item.price, // Store the current price of the item
      }));

      const saleData = {
        customerName,
        customerContact,
        itemsSold: itemsForSale,
        discount: discount, // Add discount percentage
        discountAmount: discountAmount, // Add calculated discount amount
        totalAmount: finalTotal, // Use the calculated final total
      };

      const response = await recordSale(saleData);
      setSuccessMessage(`Sale recorded successfully! Sale ID: ${response.data._id}`);
      setBillItems([]);
      setCustomerName('');
      setCustomerContact('');
      setDiscount(0);
      setError('');
      setSaleRecorded(true);
      setLastRecordedSaleId(response.data._id);
      setLastSaleDetails(response.data); // Store the full sale details
    } catch (err) {
      setError('Failed to record sale: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const printBill = () => {
    const input = billRef.current;
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.autoPrint();
      window.open(pdf.output('bloburl'), '_blank');
    });
  };

  const exportPdf = () => {
    const input = billRef.current;
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('bill.pdf');
    });
  };

  return (
    <div className="container">
      <h2>Billing System</h2>
      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}

      <div className="card mb-4">
        <h3>Scan / Enter Item QR Code</h3>
        <form onSubmit={handleQrCodeSubmit} className="form-inline">
          <input
            type="text"
            className="form-control mr-2"
            placeholder="Scan or enter QR Code"
            value={qrCodeInput}
            onChange={(e) => setQrCodeInput(e.target.value)}
            disabled={saleRecorded} // Disable input after sale recorded
          />
          <button type="submit" className="btn btn-primary" disabled={saleRecorded}>Add Item</button>
        </form>
        <div className="mt-3">
          <ZxingScanner onScan={handleScanResult} />
        </div>
      </div>

      <div className="card mb-4">
        <h3>Customer Details</h3>
        <div className="form-group">
          <label>Customer Name:</label>
          <input
            type="text"
            className="form-control"
            value={saleRecorded && lastSaleDetails ? lastSaleDetails.customerName : customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            disabled={saleRecorded} // Disable input after sale recorded
          />
        </div>
        <div className="form-group">
          <label>Mobile Number:</label>
          <input
            type="text"
            className="form-control"
            value={saleRecorded && lastSaleDetails ? lastSaleDetails.customerContact : customerContact}
            onChange={(e) => setCustomerContact(e.target.value)}
            required
            disabled={saleRecorded} // Disable input after sale recorded
          />
        </div>
      </div>

      <div className="card mb-4"> {/* Bill content for printing */} 
        <div className="bill-print-area" ref={billRef}> 
          <h3>RUBY AUTO PARTS</h3> 
          <p>RAM NAGAR</p> 
          <p>Contact: 9123456789</p> 
          <hr />

          <h4>Bill Items</h4>
          {(saleRecorded && lastSaleDetails?.itemsSold.length > 0) || (billItems.length === 0 && !saleRecorded) ? (
            (saleRecorded && lastSaleDetails?.itemsSold.length > 0) ? (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Part Name</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastSaleDetails.itemsSold.map((itemDetail) => (
                      <tr key={itemDetail._id}>
                        <td>{itemDetail.item?.name}</td>
                        <td>₹{itemDetail.priceAtSale?.toFixed(2)}</td>
                        <td>{itemDetail.quantity}</td>
                        <td>₹{(itemDetail.priceAtSale * itemDetail.quantity)?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No items added to bill.</p>
            )
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Part Name</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    {!saleRecorded && <th>Actions</th>} {/* Conditionally render Actions header */}
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((billItem, index) => (
                    <tr key={billItem.item._id}>
                      <td>{billItem.item.name}</td>
                      <td>₹{billItem.item.price.toFixed(2)}</td>
                      <td>
                        <input
                          type="number"
                          value={billItem.quantity}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                          min="1"
                          className="quantity-input"
                          disabled={saleRecorded} // Disable quantity input after sale recorded
                        />
                      </td>
                      <td>₹{(billItem.item.price * billItem.quantity).toFixed(2)}</td>
                      {!saleRecorded && (
                        <td>
                          <button onClick={() => handleRemoveItem(index)} className="btn btn-danger btn-sm">Remove</button>
                        </td>
                      )} {/* Conditionally render Remove button */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bill-summary">
            <p>Subtotal: ₹{saleRecorded && lastSaleDetails ? lastSaleDetails.subTotal.toFixed(2) : subTotal.toFixed(2)}</p>
            <div className="form-group">
              <label>Discount (%):</label>
              <input
                type="number"
                className="form-control inline-input"
                value={saleRecorded && lastSaleDetails ? lastSaleDetails.discount : discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value))}
                min="0"
                disabled={saleRecorded} // Disable discount input after sale recorded
              />
            </div>
            <p>Discount Amount: ₹{saleRecorded && lastSaleDetails ? lastSaleDetails.discountAmount.toFixed(2) : discountAmount.toFixed(2)}</p>
            <p>GST Amount (18%): ₹{saleRecorded && lastSaleDetails ? lastSaleDetails.gstAmount.toFixed(2) : gstAmount.toFixed(2)}</p>
            <h4>Final Total: ₹{saleRecorded && lastSaleDetails ? lastSaleDetails.totalAmount.toFixed(2) : finalTotal.toFixed(2)}</h4>
          </div>
        </div>
      </div>

      <div className="bill-actions">
        {!saleRecorded ? (
          <button onClick={handleRecordSale} className="btn btn-success">Record Sale</button>
        ) : (
          <>
            <button onClick={printBill} className="btn btn-info">Print Bill</button>
            <button onClick={exportPdf} className="btn btn-secondary ml-2">Export as PDF</button>
            <button onClick={() => { setSaleRecorded(false); setLastRecordedSaleId(null); setSuccessMessage(''); setLastSaleDetails(null); }} className="btn btn-primary ml-2">New Sale</button>
          </>
        )}
      </div>
    </div>
  );
};

export default Billing;
