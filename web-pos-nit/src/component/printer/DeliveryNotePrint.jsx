import React, { forwardRef, useRef } from "react";
import { getProfile } from "../../store/profile.store";
import logo from "../../assets/petronas_black2.png";

const DeliveryNotePrint = forwardRef((props, ref) => {
  const profile = getProfile();
  const iframeRef = useRef(null);

  // Number to Khmer words conversion function
  const numberToKhmerWords = (number, unit = '') => {
    const units = ["", "មួយ", "ពីរ", "បី", "បួន", "ប្រាំ", "ប្រាំមួយ", "ប្រាំពីរ", "ប្រាំបី", "ប្រាំបួន"];
    const tens = ["", "ដប់", "ម្ភៃ", "សាមសិប", "សែសិប", "ហាសិប", "ហុកសិប", "ចិតសិប", "ប៉ែតសិប", "កៅសិប"];
    const scales = ["", "ពាន់", "ម៉ឺន", "លាន", "ដប់លាន", "រយលាន", "ពាន់លាន"];

    // Handle unit
    const getUnitInKhmer = (unit) => {
      const cleanUnit = unit?.trim().toUpperCase() || '';
      switch (cleanUnit) {
        case 'L': return 'លីត្រ';
        case 'T': return 'តោន';
        case 'KG': return 'គីឡូក្រាម';
        case 'G': return 'ក្រាម';
        case 'M': return 'ម៉ែត្រ';
        case 'CM': return 'សង់ទីម៉ែត្រ';
        case 'MM': return 'មីលីម៉ែត្រ';
        default: return unit;
      }
    };

    if (number === null || number === undefined || isNaN(number)) return '';
    if (number === 0) return 'សូន្យ' + getUnitInKhmer(unit);

    const wholePart = Math.floor(number);
    const decimalPart = Math.round((number - wholePart) * 100);

    const convertLessThanOneMillion = (num) => {
      if (num === 0) return "";
      let str = "";

      if (num >= 100000) {
        const hundredThousands = Math.floor(num / 100000);
        str += units[hundredThousands] + "រយ";
        num %= 100000;
      }

      if (num >= 10000) {
        const tenThousands = Math.floor(num / 10000);
        str += tens[tenThousands];
        num %= 10000;
      }

      if (num >= 1000) {
        const thousands = Math.floor(num / 1000);
        str += units[thousands] + "ពាន់";
        num %= 1000;
      }

      if (num >= 100) {
        const hundreds = Math.floor(num / 100);
        str += units[hundreds] + "រយ";
        num %= 100;
      }

      if (num >= 10) {
        const ten = Math.floor(num / 10);
        str += tens[ten];
        num %= 10;
      }

      if (num > 0) {
        str += units[num];
      }

      return str;
    };

    let wholeWords = "";
    let remaining = wholePart;

    if (remaining === 0) {
      wholeWords = "សូន្យ";
    } else {
      const millions = Math.floor(remaining / 1000000);
      remaining %= 1000000;

      if (millions > 0) {
        wholeWords += convertLessThanOneMillion(millions) + "លាន";
      }

      wholeWords += convertLessThanOneMillion(remaining);
    }

    let decimalWords = "";
    if (decimalPart > 0) {
      decimalWords = " ចុច ";
      if (decimalPart < 10) {
        decimalWords += units[0] + units[decimalPart];
      } else {
        const ten = Math.floor(decimalPart / 10);
        const unit = decimalPart % 10;
        decimalWords += tens[ten] + (unit !== 0 ? units[unit] : "");
      }
    }

    // Final result with unit
    const unitText = getUnitInKhmer(unit);
    return (wholeWords + decimalWords).trim() + (unitText ? unitText : '');
  };

  const getUnitInKhmer = (unit = '') => {
    const cleanUnit = unit?.trim().toUpperCase() || '';
    switch (cleanUnit) {
      case 'L': return 'លីត្រ';
      case 'T': return 'តោន';
      case 'KG': return 'គីឡូក្រាម';
      case 'G': return 'ក្រាម';
      case 'M': return 'ម៉ែត្រ';
      case 'CM': return 'សង់ទីម៉ែត្រ';
      case 'MM': return 'មីលីម៉ែត្រ';
      default: return unit;
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    return phone
      .split("/")
      .map((num) => {
        const digits = num.replace(/\D/g, "");
        if (digits.length === 10) {
          return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
        }
        return num.trim();
      })
      .join(" / ");
  };

const getResponsiveFontSize = (text, baseSize = 11, minSize = 6, maxLength = 50) => {
  if (!text) return baseSize;
  const length = text.length;

  // Progressive reduction for character ranges 11-60
  if (length <= 11) return 11;
  if (length <= 12) return 10;
  if (length <= 13) return 9;
  if (length <= 14) return 8;
  if (length <= 15) return 7;
  if (length <= 16) return 6;
  if (length <= 17) return 5;
  if (length <= 18) return 4;
  if (length <= 19) return 3;
  if (length <= 20) return 2;
  if (length <= 25) return 1.8;
  if (length <= 30) return 1.6;
  if (length <= 35) return 1.4;
  if (length <= 40) return 1.2;
  if (length <= 45) return 1.0;
  if (length <= 50) return 0.9;
  if (length <= 55) return 0.8;
  if (length <= 60) return 0.7;
  return 0.6; // minimum for text > 60 characters
};

  const getTodayKhmer = () => {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
};

const todayDate = getTodayKhmer();


  const printContent = (printData) => {
    const { data, items } = printData || {};
    if (!iframeRef.current) return;

    const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;

    const processedItems = (items || []).map(item => {
      let quantity = item.quantity || 0;
      let unit = item.unit || '';
      if (typeof quantity === 'string') {
        const match = quantity.match(/^(\d+(?:\.\d+)?)([A-Za-z]*)$/);
        if (match) {
          quantity = parseFloat(match[1]);
          if (match[2]) unit = match[2];
        } else {
          quantity = parseFloat(quantity) || 0;
        }
      }
      return {
        ...item,
        quantity,
        khmer_word: numberToKhmerWords(quantity, unit)
      };
    });
    const renderTankNumbers = (text = "") => {
      return text
        .split(/\s+/)
        .map(num => `<span class="tank-cell">${num}</span>`)
        .join('');
    };

    const totalQuantity = processedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalKhmerWord = numberToKhmerWords(totalQuantity, processedItems[0]?.unit || '');

    const itemRows = processedItems.map((item, idx) => `
      <tr class="item-row">
        <td>${idx + 1}</td>
        <td class="product-name"><span class="metal-bold">${item?.category_name || ''}</span></td>
        <td>${item?.unit || ''}</td>
        <td>${parseFloat(item?.quantity || 0).toLocaleString('en-US')}</td>
        <td class="khmer-text">${item?.khmer_word || ''}</td>
        <td class="remarks">${item?.note || ''}</td>
      </tr>
    `).join('');

    // Calculate responsive font sizes
    const profileAddressFontSize = getResponsiveFontSize(profile?.address || '', 11, 8);
    const customerAddressFontSize = getResponsiveFontSize(data?.customer_address || '', 11, 8);

    const html = `
        <!DOCTYPE html>
        <html lang="km">
        <head>
          <meta charset="UTF-8">
          <title>Delivery Note - ${data?.delivery_number || ''}</title>
          <link href="https://fonts.googleapis.com/css2?family=Battambang:wght@100;300;400;700;900&family=Fasthand&family=Freehand&family=Khmer&family=Metal&family=Moul&family=Siemreap&display=swap" rel="stylesheet">
          <link href="https://fonts.googleapis.com/css2?family=Bayon&family=Dangrek&family=Kh+Freehand&display=swap" rel="stylesheet">
          <style>
            @page { size: A4; margin: 0; }
            html, body {
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 0;
              font-family: 'Siemreap', 'Khmer OS System', Arial, sans-serif;
              font-size: 12pt;
              overflow: hidden;
            }
            .metal { 
              font-family: 'Metal', 'Khmer OS', 'Khmer OS System', sans-serif; 
              font-weight: 500; 
            }
            .metal-bold { 
              font-family: 'Metal', 'Khmer OS', 'Khmer OS System', sans-serif; 
              font-weight: 700;
              font-size: 10pt;
            }
            .metal_address, .metal_address_customer {
              font-family: 'Metal', 'Khmer OS', 'Khmer OS System', sans-serif;
              word-wrap: break-word;
              overflow-wrap: break-word;
              white-space: normal;
              line-height: 1.4;
              width: 100%;
            }

            /* Responsive address styles */
            .metal_address {
              font-size: ${profileAddressFontSize}pt;
            }

            .metal_address_customer {
              font-size: ${customerAddressFontSize}pt;
            }

            .siemreap-bold {
              font-family: 'Siemreap', sans-serif;
              font-weight: bold;
              font-size: 12.5pt;
              color: #454545;
            }

            /* New font classes for specific elements */
            .klh-mps-temple {
              font-family: 'KLH MPS Temple', 'Khmer OS', sans-serif;
              font-weight: bold;
            }

            .khmer-s3 {
              font-family: 'Khmer S3', 'Khmer OS', sans-serif;  
              font-weight: bold;
            }

            .khmer-os-dangrek {
              font-family: 'Dangrek', 'Khmer OS Dangrek', 'Khmer OS', sans-serif;
              font-weight: bold;
            }

            .khmer-s4 {
              font-family: 'Khmer S4', 'Khmer OS', sans-serif;
               font-weight: bold;
               margin-bottom: -18mm;
            }

            .bayon-font {
              font-family: 'Bayon', 'Khmer OS', sans-serif;
            }

            .kh-freehand {
              font-family: 'Kh Freehand', 'Khmer OS', sans-serif;
            }

            .delivery-note-print {
              width: 190mm;
              height: 277mm;
              padding: 10mm;
              margin: auto;
              position: relative;
            }
            .header-container {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              margin-bottom: 8mm;
            }

            .logo-section {
              width: 25%;
              text-align: left;
            }

            .logo-image {
              width: 150px;
              height: auto;
              object-fit: contain;
            }

            .header-section {
              width: 75%;
              text-align: center;
            }

            .header-title {
              font-family: 'Moul', 'Khmer OS Muol Light', sans-serif;
              font-size: 14pt;
              font-weight: 900;
              margin: 0 0 2mm 0;
              line-height: 1.3;
              margin-left: -190px;
              margin-top: 25px;
            }

            .header-number {
              color: #555;
              font-size: 18pt;
              font-weight: bold;
              margin: 0;
              margin-left: -190px;
            }
            
            .info-container { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 3mm;
              padding: 1px 0;
            }

            .info-left, .info-right { 
              width: 48%; 
            }

            .info-left p, .info-right p { 
              margin: 1mm 0;
              line-height: 1.2;
              font-size: 12pt;
            }
            
            .customer-info-grid {
              display: grid;
              grid-template-columns: auto auto 1fr;
              width: 100%;
              row-gap: 2px;
            }
            .customer-info-grid p {
              margin: 0;
              padding: 2px 0;
              font-size: 12pt;
              line-height: 1.2;
            }

            .customer-info-grid .label {
              text-align: left;
              margin-left: -80px;
              font-weight: bold;
            }

            .customer-info-grid .separator {
              margin: 0 4px;
            }

            .customer-info-grid .value {
              text-align: left;
              word-break: break-word;
              width: 100%;
              flex: 1;
            }
            
            .wrap-text {
              display: inline-block;
              word-wrap: break-word;
              overflow-wrap: break-word;
              white-space: normal;
              line-height: 1.4;
              text-align: left;
              width: 100%;
              flex: 1;
            }
            
            .address-display {
              display: flex;
              align-items: flex-start;
              width: 100%;
            }
            
            .address-display .siemreap-bold {
              flex-shrink: 0;
              margin-right: 5px;
            }
            
            .address-display .metal_address {
              word-wrap: break-word;
              overflow-wrap: break-word;
              white-space: normal;
              line-height: 1.4;
              text-align: left;
              width: 57%;
            }
            
            table { 
              width: 100%; 
              border-collapse: collapse; 
              font-size: 12pt;
              margin: 0 auto;
              table-layout: fixed;
            }
            
            th { 
              border: 1px solid #8a8888; 
              padding: 1mm;
              text-align: center;
              font-weight: bold;
              background-color: #f8f8f8;
              height: 10mm;
            }
            
            td { 
              border: 1px solid #8a8888;
              padding: 2mm;
              text-align: center;
              vertical-align: middle;
            }

            th:nth-child(1), td:nth-child(1) { width: 5%; }
            th:nth-child(2), td:nth-child(2) { width: 28%; }
            th:nth-child(3), td:nth-child(3) { width: 7%; }
            th:nth-child(4), td:nth-child(4) { width: 10%; }
            th:nth-child(5), td:nth-child(5) { width: 25%; }
            th:nth-child(6), td:nth-child(6) { width: 10%; }

            .product-name, .khmer-text, .remarks {
              text-align: left;
              word-wrap: break-word;
              overflow-wrap: break-word;
              white-space: normal;
              line-height: 1.4;
            }

            .item-row td, .empty-row td {
              height: 6mm;
              font-weight: 600;
              padding: 5mm;
            }
             
            .dotted-quantity { 
              letter-spacing: 1px; 
            }
            
            .note-section { 
              margin-top: 6mm;
              margin-bottom: 11mm;
            }
            
            .tank-number-section {
              margin-top: 8mm;
              font-size: 12pt;
              padding: 0;
              margin-bottom: 21mm;
            }

            .tank-row {
              margin: 0.5mm 0;
              margin-bottom: 5mm;
            }

            .tank-label {
              font-family: 'Siemreap', 'Khmer OS', sans-serif;
              font-weight: bold;
              margin-bottom: 2mm;
              padding-left: 4mm;
              line-height: 1.2;
              font-size: 11.5pt;
            }

            .tank-line {
              display: flex;
              gap: 20px;
              flex-wrap: wrap;
              padding: 0 0 0.5mm 6mm;
              font-family: 'Metal', monospace;
              font-size: 12pt;
              font-weight: 600;
              line-height: 1.3;
              margin-bottom: -0.5mm;
            }

            .tank-cell {
              min-width: 90px;
              text-align: center;
              margin-bottom: 0;
            }

            .tank-value {
              font-family: 'Metal', 'Khmer OS Content', sans-serif;
              font-weight: 600;
              font-size: 12pt;
              width: 100%;
              display: block;
              border-bottom: 1px dotted #000;
              padding-bottom: -1mm;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: -20mm;
            }
            
            .signature-block { 
              width: 25%; 
            }
            
            
            .signature-block p {
              margin-top: 4mm;
              margin-bottom: 2mm;
              line-height: 1.4;
              font-size: 11pt;
                text-align: center;

              }
              .signature-line { 
                border-bottom: 1px solid black; 
                margin-top: 25mm;
                margin-bottom: 2mm;
              }
            
            .moul-regular {
              font-family: "Moul", serif;
              font-weight: 200;
            }
           
            .document-footer {
              width: 100%;
              padding-top: 2mm;
              display: flex;
              justify-content: space-between;
              font-size: 11pt;
              position: absolute;
              bottom: 10mm;
              left: 10mm;
              right: 10mm;
            }
            
            .footer-left {
              display: flex;
              width: 70%;
              margin-top: 100mm;
              margin-bottom: -15mm;

            }
            
            .footer-right {
              width: 26%;
              text-align: right;
              margin-top: 60mm;
              display: flex;
              margin-bottom: -15mm;

            }
            
            .footer-item {
              flex: 1;
              text-align: left;
              padding: 0 2mm;
              margin-bottom: 12mm;
              display: flex;
              flex-direction: column;
              align-items: flex-start;
            }
            
            .footer-label {
              font-family: 'Siemreap', 'Khmer OS System', sans-serif;
              font-weight: 400;
              display: inline-block;
              margin-right: 1mm;
            }
            
            .footer-value {
              font-family: 'Metal', 'Khmer OS', 'Khmer OS System', sans-serif;
              font-weight: 600;
              font-size: 10pt;
            }
            
            .footer-signature {
              text-align: center;
              margin-top: 12mm;   
            }
            
            .footer-signature .signature-line {
              width: 100%;
              margin: 6mm auto 2mm;
              border-bottom: 1px solid black;
              margin-top: 13mm;
            }
            
            .footer-signature p {
              margin: 0 0 1mm 0;
              line-height: 1.2;
            }
           
            small {
              font-size: 9pt;
              color: #555;
            }

            .footer-signature p {
              margin-top: 4mm;
              margin-bottom: 2mm;
              line-height: 1.3;
              font-size: 11pt;
              font-family: 'Siemreap', 'Khmer OS System', sans-serif;
            }
            
            tr.total-row td {
              font-weight: bold;
              background-color: #f0f0f0;
              font-size: 12.5pt;
              height: 6mm;
              padding: 1mm;
            }

            .content-wrapper {
              padding-bottom: 60mm;
            }
            
            .note-section p {
              margin: 2mm 0 1mm 0;
            }
          </style>
        </head>
        <body>
          <div class="delivery-note-print">
            <div class="content-wrapper">
              <div class="header-container">
                <div class="logo-section">
                  <img src="${logo}" alt="Company Logo" class="logo-image" />
                </div>
                <div class="header-section">
                  <h2 class="header-title">ប័ណ្ណដឹកជញ្ជូនប្រេងឥន្ធនៈ</h2>
                  <p class="header-number">DELIVERY NOTE</p>
                </div>
              </div>

              <div class="info-container">
                <div class="info-left">
                  <p><span class="siemreap-bold">ចេញពីពោងស្តុកលេខ៖ </span><span class="metal-bold">${profile?.branch_name || 'ស្រុកស្រែអំបិល'}</span></p>
                  
                  <div class="address-display">
                    <span class="siemreap-bold">អាសយដ្ឋាន៖</span>
                    <span class="metal_address wrap-text">${profile?.address || ''}</span>
                  </div>
                  
                  <p><span class="siemreap-bold">លេខទូរស័ព្ទ៖ </span>${formatPhoneNumber(profile?.tel || '')}</p>
                </div>
                
                <div class="info-right">
                  <div class="customer-info-grid">
                    <p class="siemreap-bold label">អតិថិជន</p>
                    <p class="separator">:</p>
                    <p class="metal-bold value">${data?.customer_name || ''}</p>
                    
                    <p class="siemreap-bold label">អាសយដ្ឋាន</p>
                    <p class="separator">:</p>
                    <p class="metal_address wrap-text">${data?.customer_address || ''}</p>

                    <p class="siemreap-bold label">លេខទូរស័ព្ទ</p>
                    <p class="separator">:</p>
                    <p class="value">${formatPhoneNumber(data?.customer_phone || '')}</p>
                    
                    <p class="siemreap-bold label">លេខបញ្ជាទិញ</p>
                    <p class="separator">:</p>
                    <p class="value">${data?.order_number || ''}</p>
                    
                    <p class="siemreap-bold label">ថ្ងៃបញ្ជាទិញ</p>
                    <p class="separator">:</p>
                    <p class="value">${data?.order_date_formatted || ''}</p>

                    <p class="siemreap-bold label">ថ្ងៃទីទទួលទំនិញ</p>
                    <p class="separator">:</p>
                    <p class="value">${data?.delivery_date_formatted || ''}</p>
                  </div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>
                      <span class="siemreap-bold">ល.រ</span><br />
                      <small>No.</small>
                    </th>
                    <th>
                      <span class="siemreap-bold">ឈ្មោះទំនិញ</span><br />
                      <small>Product Name</small>
                    </th>
                    <th>
                      <span class="siemreap-bold">ឯកតា</span><br />
                      <small>Unit</small>
                    </th>
                    <th>
                      <span class="siemreap-bold">បរិមាណ</span><br />
                      <small>Quantity</small>
                    </th>
                    <th>
                      <span class="siemreap-bold">ជាអក្សរ</span><br />
                      <small>In Words</small>
                    </th>
                    <th>
                      <span class="siemreap-bold">ផ្សេងៗ</span><br />
                      <small>Remarks</small>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                  
                  <tr class="total-row">
                    <td colspan="3"><span class="siemreap-bold">សរុប</span></td>
                    <td><span class="siemreap-bold">${totalQuantity.toLocaleString('en-US')}</span></td>
                    <td colspan="2"><span class="siemreap-bold">${totalKhmerWord}</span></td>
                  </tr>
                </tbody>
              </table>

              <div class="tank-number-section">
                <div class="tank-row">
                  <div class="tank-label bayon-font">លេខឃ្លុំបេផ្នែកខាងលើ:</div>
                  <div class="tank-line">
                    ${renderTankNumbers(data?.top_tank_number)}
                  </div>
                </div>
                <div class="tank-row">
                  <div class="tank-label bayon-font">លេខឃ្លុំបេផ្នែកខាងក្រោម:</div>
                  <div class="tank-line">
                    ${renderTankNumbers(data?.bottom_tank_number)}
                  </div>
                </div>
              </div>

              <div class="signatures">
                <div class="signature-block">
               <p class="klh-mps-temple">ប្រធានស្តុក</p>



                  <div class="signature-line"></div>  
                 <p style="margin-left: -60px;">ឈ្មោះ</p> 
                  <p class="kh-freehand">ថ្ងៃទី${todayDate}</p>
                </div>
                <div class="signature-block">
                 <p class="khmer-s3">គណនេយ្យ</p>
                  <div class="signature-line"></div>
                 <p style="margin-left: -60px;">ឈ្មោះ</p> 
                  <p class="kh-freehand">ថ្ងៃទី${todayDate}</p>
                </div>
                  
                <div class="signature-block">
                 <p class="khmer-os-dangrek">អតិថិជន</p>
                  <div class="signature-line"></div>
                  <p>ឈ្មោះ</p>
                  <p class="kh-freehand">ថ្ងៃទី</p>
                </div>
              </div>
            </div>

            <div class="document-footer">
              <div class="footer-left">
                <div class="footer-item">
                  <span class="kh-freehand">លេខទូរស័ព្ទអ្នកបើកបរ៖</span>
                  <span class="footer-value">${formatPhoneNumber(data?.driver_phone) || ''}</span>
                </div>
                <div class="footer-item">
                  <span class="kh-freehand">ផ្លាកលេខ៖</span>
                  <span class="footer-value">${data?.vehicle_number || ''}</span>
                </div>
              </div>
              <div class="footer-right">
                <div class="footer-signature">
                  <p class="khmer-s4">អ្នកបើកបរ</p>
                  <div class="signature-line"></div>
                  <p class="kh-freehand">ឈ្មោះ <span class="kh-freehand">${data?.driver_name || ''}</span></p>
                  <p class="kh-freehand">ថ្ងៃទី</p>
                </div>
              </div>
            </div>
          </div>

          <script>
            window.onload = function () {
              window.focus();
              setTimeout(() => window.print(), 500);
            };
          </script>
        </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();
  };

  React.useImperativeHandle(ref, () => ({
    print: printContent
  }));

  return <iframe ref={iframeRef} style={{ display: 'none' }} title="print-frame" />;
});

export default DeliveryNotePrint;