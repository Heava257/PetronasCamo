import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { formatDateClient } from "../../util/helper";

// Change to use forwardRef in the recommended way
const PrintDeliveryNote = forwardRef((props, ref) => {
  const { orderData = {}, orderDetails = [] } = props;
  // Create a local ref for the content
  const containerRef = useRef(null);

  // Explicitly connect the forwarded ref to our local ref
  useImperativeHandle(ref, () => containerRef.current);

  // Format date in DD-MMM-YYYY format
  const formatPDNDate = (date) => {
    if (!date) return "";
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-');
  };

  // Get total quantity across all items
  const getTotalQuantity = () => {
    return orderDetails.reduce((total, item) => {
      return total + parseFloat(item.total_quantity || 0);
    }, 0);
  };

  // Helper function to convert numbers to words
  const numberToWords = (num) => {
    const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const scales = ["", "Thousand", "Million", "Billion"];

    if (num === 0) return "Zero";

    // Handle decimals
    const isDecimal = num % 1 !== 0;
    const decimalPart = isDecimal ? Math.round((num % 1) * 100) : 0;
    
    // Process whole number part
    let words = "";
    let scaleIndex = 0;
    let n = Math.floor(num);

    while (n > 0) {
      const hundreds = n % 1000;
      if (hundreds !== 0) {
        let groupWords = "";
        
        // Handle hundreds
        if (hundreds >= 100) {
          groupWords += units[Math.floor(hundreds / 100)] + " Hundred ";
        }
        
        // Handle tens and units
        const tensUnits = hundreds % 100;
        if (tensUnits > 0) {
          if (tensUnits < 10) {
            groupWords += units[tensUnits];
          } else if (tensUnits < 20) {
            groupWords += teens[tensUnits - 10];
          } else {
            groupWords += tens[Math.floor(tensUnits / 10)];
            if (tensUnits % 10 !== 0) {
              groupWords += "-" + units[tensUnits % 10];
            }
          }
        }
        
        // Add scale (thousand, million, etc.)
        if (scaleIndex > 0) {
          groupWords += " " + scales[scaleIndex] + " ";
        }
        
        words = groupWords + words;
      }
      
      n = Math.floor(n / 1000);
      scaleIndex++;
    }

    // Add decimals if any
    if (isDecimal && decimalPart > 0) {
      words += " Point ";
      if (decimalPart < 10) {
        words += units[decimalPart];
      } else if (decimalPart < 20) {
        words += teens[decimalPart - 10];
      } else {
        words += tens[Math.floor(decimalPart / 10)];
        if (decimalPart % 10 !== 0) {
          words += "-" + units[decimalPart % 10];
        }
      }
    }

    return words.trim();
  };

  return (
    <div ref={containerRef} style={{ 
      width: '210mm', 
      minHeight: '297mm', 
      margin: '0 auto',
      padding: '10mm',
      boxSizing: 'border-box',
      fontFamily: "'Arial', sans-serif"
    }}>
      {/* Header with title */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          textDecoration: 'underline',
          marginBottom: '5px'
        }}>
          PRODUCT DELIVERY NOTE
        </h1>
      </div>

      {/* Depot and PDN info */}
      <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid black', padding: '5px', width: '50%' }}>
              <strong>DEPOT : SAMRONG THOM</strong>
            </td>
            <td style={{ border: '1px solid black', padding: '5px', width: '50%' }}>
              <strong>P.D.N NO : {orderData.order_no || "000000"}</strong>
              <div style={{ marginTop: '5px' }}>DATE : {formatPDNDate(orderData.order_date || orderData.create_at)}</div>
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid black', padding: '5px' }}>
              <strong>CUSTOMER REQUISITION REF</strong>
              <div>Phone Number : {orderData.customer_tel || "N/A"}</div>
            </td>
            <td style={{ border: '1px solid black', padding: '5px' }}>
              <strong>RELEASE ORDER NO : {`2-25-SRT${orderData.order_no?.padStart(6, '0')}` || "N/A"}</strong>
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid black', padding: '5px' }}>
              <strong>CUSTOMER'S NAME AND ADDRESS</strong>
              <div style={{ marginTop: '5px', fontWeight: 'bold' }}>{orderData.customer_name || "N/A"}</div>
            </td>
            <td style={{ border: '1px solid black', padding: '5px' }}>
              <strong>DELIVERY ADDRESS</strong>
              <div style={{ marginTop: '5px', fontWeight: 'bold' }}>{orderData.customer_address || "N/A"}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Product table */}
      <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: '5px', textAlign: 'left' }}>PRODUCT CODE</th>
            <th style={{ border: '1px solid black', padding: '5px', textAlign: 'left' }}>PRODUCT DESCRIPTION</th>
            <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>PACK</th>
            <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>UNIT</th>
            <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>QUANTITY</th>
          </tr>
        </thead>
        <tbody>
          {orderDetails.map((item, index) => (
            <tr key={index}>
              <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>
                {(index + 1).toString().padStart(2, '0')}
              </td>
              <td style={{ border: '1px solid black', padding: '5px' }}>
                <em>{item.product_name}</em>
              </td>
              <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>
                <em>Bulk</em>
              </td>
              <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>
                <em>{item.unit || "Litre"}</em>
              </td>
              <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>
                <em>{item.total_quantity}L</em>
                <div style={{ fontSize: 'smaller' }}>
                  ({numberToWords(parseFloat(item.total_quantity))} {item.unit || "Litres"} Only)
                </div>
              </td>
            </tr>
          ))}
          {orderDetails.length === 0 && (
            <tr>
              <td style={{ border: '1px solid black', padding: '5px', height: '50px' }} colSpan="5"></td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Total amount */}
      <div style={{ border: '1px solid black', borderTop: 'none', padding: '5px', textAlign: 'right' }}>
        <strong>TOTAL AMOUNT (USD)</strong>
      </div>

      {/* Products received and credit/cash */}
      <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid black', padding: '5px', width: '50%', textAlign: 'center' }}>
              <strong>PRODUCTS / ITEMS RECEIVED IN GOOD ORDER</strong>
            </td>
            <td style={{ border: '1px solid black', padding: '5px', width: '50%' }}>
              <div style={{ textAlign: 'center' }}>
                <strong>CREDIT / CASH</strong>
              </div>
              <div style={{ height: '30px' }}></div>
              <div>
                <strong>REMARK'S</strong>
                <div style={{ minHeight: '30px' }}>{orderData.remark || ""}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Signature and stamp */}
      <div style={{ border: '1px solid black', borderTop: 'none', padding: '5px', textAlign: 'center' }}>
        <strong>SIGNATURE / STAMP / DATE</strong>
        <div style={{ height: '50px' }}></div>
      </div>

      {/* Transportation description */}
      <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid black', padding: '5px', width: '50%' }}>
              <strong>TRANSPORTATION DESCRIPTION</strong>
              <div>TYPE : PETRONAS / CONTRACTOR / CONSUMER</div>
              <div style={{ marginTop: '10px' }}>VEHICLE NO. ______</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                <span>TIME IN</span>
                <span>TIMEOUT</span>
                <span>TIME BACK</span>
              </div>
            </td>
            <td style={{ border: '1px solid black', padding: '5px', width: '50%' }}>
              <strong>SEAL NO :</strong>
              <div style={{ height: '80px' }}></div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Prepared and delivered by */}
      <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid black', padding: '5px', width: '50%' }}>
              <div>PREPARED BY :</div>
              <div style={{ height: '30px' }}></div>
              <div>APPROVED BY :</div>
              <div style={{ height: '30px' }}></div>
            </td>
            <td style={{ border: '1px solid black', padding: '5px', width: '50%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ borderRight: '1px solid black', padding: '5px' }}>
                      <div>DELIVERED BY :</div>
                      <div style={{ height: '30px' }}></div>
                      <div>FILLED BY :</div>
                      <div style={{ height: '30px' }}></div>
                    </td>
                    <td style={{ padding: '5px' }}>
                      <div>SECURITY CHECKED</div>
                      <div style={{ height: '80px' }}></div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Transport copy footer */}
      <div style={{ 
        border: '1px solid black', 
        borderTop: 'none', 
        padding: '5px', 
        textAlign: 'center',
        color: '#666'
      }}>
        TRANSPORT COPY
      </div>
    </div>
  );
});

// Add a display name for debugging purposes
PrintDeliveryNote.displayName = 'PrintDeliveryNote';

export default PrintDeliveryNote;