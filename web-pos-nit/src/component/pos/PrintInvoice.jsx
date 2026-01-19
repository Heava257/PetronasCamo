
// import React from "react";
// import logo from "../../assets/petronas_black2.png";
// import "./fonts.css";
// import { getProfile } from "../../store/profile.store";
// import { formatDateClient } from "../../util/helper";
// import './printFont.css';

// // Function to convert number to Khmer words (unchanged)
// const numberToKhmerWords = (number) => {
//   const units = ["", "មួយ", "ពីរ", "បី", "បួន", "ប្រាំ", "ប្រាំមួយ", "ប្រាំពីរ", "ប្រាំបី", "ប្រាំបួន"];
//   const tens = ["", "ដប់", "ម្ភៃ", "សាមសិប", "សែសិប", "ហាសិប", "ហុកសិប", "ចិតសិប", "ប៉ែតសិប", "កៅសិប"];
//   const scales = ["", "ពាន់", "ម៉ឺន", "លាន", "ដប់លាន", "រយលាន", "ពាន់លាន"];

//   const dollarPart = Math.floor(number);
//   const centPart = Math.round((number - dollarPart) * 100);

//   const convertLessThanOneMillion = (num) => {
//     if (num === 0) return "";
//     let str = "";

//     if (num >= 100000) {
//       const hundredThousands = Math.floor(num / 100000);
//       str += units[hundredThousands] + "រយ";
//       num %= 100000;
//     }

//     if (num >= 10000) {
//       const tenThousands = Math.floor(num / 10000);
//       str += tens[tenThousands];
//       num %= 10000;
//     }

//     if (num >= 1000) {
//       const thousands = Math.floor(num / 1000);
//       str += units[thousands] + "ពាន់";
//       num %= 1000;
//     }

//     if (num >= 100) {
//       const hundreds = Math.floor(num / 100);
//       str += units[hundreds] + "រយ";
//       num %= 100;
//     }

//     if (num >= 10) {
//       const ten = Math.floor(num / 10);
//       str += tens[ten];
//       num %= 10;
//     }

//     if (num > 0) {
//       str += units[num];
//     }

//     return str;
//   };

//   let dollarWords = "";
//   let remaining = dollarPart;

//   if (remaining === 0) {
//     dollarWords = "សូន្យ";
//   } else {
//     const millions = Math.floor(remaining / 1000000);
//     remaining %= 1000000;

//     if (millions > 0) {
//       dollarWords += convertLessThanOneMillion(millions) + "លាន";
//     }

//     dollarWords += convertLessThanOneMillion(remaining);
//   }

//   let centWords = "";
//   if (centPart > 0) {
//     if (centPart < 10) {
//       centWords = units[centPart] + "សេន";
//     } else {
//       const ten = Math.floor(centPart / 10);
//       const unit = centPart % 10;
//       centWords = tens[ten] + (unit !== 0 ? units[unit] : "") + "សេន";
//     }
//   }

//   if (dollarPart > 0 && centPart > 0) {
//     return dollarWords.trim() + "ដុល្លារនិង" + centWords;
//   } else if (dollarPart > 0) {
//     return dollarWords.trim() + "ដុល្លារគត់";
//   } else if (centPart > 0) {
//     return centWords;
//   } else {
//     return "សូន្យដុល្លារគត់";
//   }
// };

// const PrintInvoice = React.forwardRef((props, ref) => {
//   const profile = getProfile();
//   const {
//     objSummary = {},
//     cart_list = [],
//     selectedLocations = []
//   } = props;

//   const {
//     sub_total = 0,
//     total_qty = 0,
//     save_discount = 0,
//     tax = 0,
//     total = 0,
//     total_paid = 0,
//     customer_name = "N/A",
//     customer_address = "N/A",
//     customer_tel = "N/A",
//     user_name = "N/A",
//     order_no = "N/A",
//     order_date = new Date(),
//     payment_method = "N/A",
//     remark = "N/A",
//     delivery_date,
//     receive_date

//   } = objSummary;

//   const formatNumber = (value, withDollar = false) => {
//     const number = parseFloat(value) || 0;

//     // Format the number to have at most 2 decimal places
//     let formatted = number.toLocaleString('en-US', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     });

//     // Remove the decimal part if it's .00
//     if (formatted.endsWith('.00')) {
//       formatted = formatted.slice(0, -3);
//     }

//     return withDollar ? `$${formatted}` : formatted;
//   };

//   const formatGrandTotal = (value, withDollar = false) => {
//     return formatNumber(value, withDollar); // Use same formatting as item totals
//   };

//   const FormatQTY = (value) => {
//     const number = parseFloat(value) || 0;
//     return number.toLocaleString('en-US');
//   };

//   const formatUnitPrice = (value) => {
//     const number = parseFloat(value) || 0;
//     return Math.floor(number);
//   };

//   const totalAmount = cart_list.reduce(
//     (sum, item) => sum + (item.cart_qty * item.unit_price) / (item.actual_price || 1),
//     0
//   );

//   const displayAmount = totalAmount; // No rounding
//   const displayWords = numberToKhmerWords(displayAmount);

//   const formatPhoneNumber = (phone) => {
//     if (!phone) return "";
//     return phone
//       .split("/")
//       .map((num) => {
//         const digits = num.replace(/\D/g, ""); // Remove any non-digits
//         if (digits.length === 10) {
//           return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
//         }
//         return num.trim(); // Return as-is if not 10 digits
//       })
//       .join(" / ");
//   };

//   // Get the location labels for display
//   const locationLabels = selectedLocations.length > 0
//     ? selectedLocations.map(loc => loc.label).join(", ")
//     : objSummary.user_name || "N/A";

//   // Always display exactly 4 rows in the table
//   const FIXED_DISPLAY_ITEMS = 4; // Always show exactly 4 rows
//   const displayItems = [...cart_list];

//   // If we have fewer than FIXED_DISPLAY_ITEMS, add empty rows to maintain layout
//   if (displayItems.length < FIXED_DISPLAY_ITEMS) {
//     const emptyRowsToAdd = FIXED_DISPLAY_ITEMS - displayItems.length;
//     for (let i = 0; i < emptyRowsToAdd; i++) {
//       displayItems.push({
//         category_name: "",
//         cart_qty: "",
//         unit_price: "",
//         actual_price: 1
//       });
//     }
//   }

//   // If we have more than FIXED_DISPLAY_ITEMS, trim to show only the first 4
//   if (displayItems.length > FIXED_DISPLAY_ITEMS) {
//     displayItems.length = FIXED_DISPLAY_ITEMS;
//   }

//    const firstDescription = cart_list.length > 0 
//     ? (cart_list.find(item => item.description)?.description || '')
//     : '';



//   return (
//     <div ref={ref} className="p-8 px-14 max-w-4xl mx-auto battambang-font">
//       {/* Header section */}
//       <div className="flex justify-between items-center">
//         <div className="items-center">
//           <img
//             src={logo}
//             alt="Company Logo"
//             className="w-40 h-40 object-contain filter grayscale"
//           />
//         </div>

//         <div className="flex flex-col items-center justify-center text-center flex-1 relative me-16 mt-10">
//           <h2 className="text-2xl text-[15px] moul-regular ">វិក្កយប័ត្រ</h2>
//           <h2 className="text-xl text-[15px]">INVOICE</h2>
//         </div>

//         <div className="w-16 h-16"></div>
//       </div>

//       {/* Customer and Invoice Info Section */}
//       <div className="grid grid-cols-2 gap-4 mb-4">
//         <div className="w-full mt-2">
//           <div className="grid gap-y-1">
//             <p className="text-[15px] font-bold text-black">
//               ឈ្មោះអតិថិជន: {objSummary?.customer_name || "N/A"}
//             </p>
//             <p className="text-[15px] font-medium">
//               អាស័យដ្ឋាន: <span className="freehand-regular text-[11px]">{objSummary?.customer_address || "N/A"}</span>
//             </p>
//             <p className="text-[15px] font-medium">លេខទូរស័ព្ទ: {formatPhoneNumber(objSummary?.customer_tel) || "N/A"}</p>
//             <p className="text-[15px] font-medium">
//               គោលដៅ: {selectedLocations.map(loc => loc.label).join(", ")}
//             </p>
//           </div>
//         </div>

//         <div className="w-full flex justify-end relative ms-4 ">
//           <div className="w-[80%] grid grid-cols-[57%_1%_43%]  gap-y-1 p-2 rounded-lg">
//             <div className="text-start flex flex-col items-start">
//                {firstDescription && (
//                 <p className="text-[15px] font-medium">លេខប័ណ្ណ</p>
//               )}
//               <p className="text-[15px] font-medium">ថ្ងៃបញ្ជាទិញ</p>
//               <p className="text-[15px] font-medium">ថ្ងៃប្រគល់ទំនិញ</p>

//               <p className="text-[15px] font-medium">លេខបញ្ជាទិញ</p>
//               <p className="text-[14px] font-medium">លេខបណ្ណបញ្ចេញទំនិញ</p>
//             </div>

//             <div className="flex flex-col items-center">
//               <p className="text-[15px] font-medium">:</p>
//               <p className="text-[15px] font-medium">:</p>
//               <p className="text-[15px] font-medium">:</p>
//               <p className="text-[15px] font-medium">:</p>
//               <p className="text-[15px] font-medium">:</p>
//             </div>

//             <div className="text-start flex flex-col ">
//                {firstDescription && (
//                 <p className="text-[15px] font-medium">{firstDescription}</p>

//               )}
//               <p className="text-[15px] font-medium">{formatDateClient(objSummary?.order_date || "N/A")}</p>
//               <p className="text-[15px] font-medium">{formatDateClient(objSummary?.delivery_date)}</p>

//               <p className="text-[15px] font-medium">{objSummary.order_no ? `#SA-${objSummary?.order_no}` : ""}</p>
//               <p className="text-[15px] font-medium">...................</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main content with fixed exact height for 4 rows */}
//       <div className="w-full mb-3 overflow-x-auto">
//         {/* Main Table with fixed height */}
//         <table className="w-full border-collapse border border-gray-500">
//           <thead className="border border-gray-500 text-black">
//             <tr>
//               <th className="border border-gray-500 p-[2px] min-w-[0px] text-[15px] font-semibold text-center">
//                 <div className="flex flex-col items-center leading-tight">
//                   <span className="text-[15px] font-semibold">ល.រ</span>
//                   <span className="text-[12px] text-[#999999]">No</span>
//                 </div>
//               </th>
//               <th className="border border-gray-500 p-1 w-5/12 text-center text-[15px] font-semibold">
//                 <span>បរិយាយមុខទំនិញ</span>
//                 <br />
//                 <span className="text-[12px] text-[#999999]">Description</span>
//               </th>
//               <th className="border border-gray-500 p-1 w-2/12 text-center text-[15px] font-semibold leading-[20px]">
//                 <span>បរិមាណ</span><br />
//                 <span className="text-[12px] text-[#999999] leading-[20px]">Quantity(Liters)</span>
//               </th>

//               <th className="border border-gray-500 p-1 w-2/12 text-center text-[15px] font-semibold">
//                 <span>តម្លៃតោន</span>
//                 <br />
//                 <span className="text-[12px] text-[#999999]">Ton Price</span>
//               </th>
//               <th className="border border-gray-500 p-1 w-2/12 text-center text-[15px] font-semibold">
//                 <span>តម្លៃសរុប</span>
//                 <br />
//                 <span className="text-[12px] text-[#999999]">Amount</span>
//               </th>
//             </tr>
//           </thead>

//           <tbody className="border border-gray-500">
//             {/* Display actual items and empty rows to maintain layout */}
//             {displayItems.map((item, index) => {
//               const isRealItem = index < cart_list.length;
//               const itemTotal = isRealItem ?
//                 (item.cart_qty * item.unit_price) / (item.actual_price || 1) : 0;
//               const formattedItemTotal = isRealItem ? formatNumber(itemTotal) : "";

//               return (
//                 <tr key={index} className="hover:bg-gray-50" style={{ height: "36px" }}>
//                   <td className={`${isRealItem ? 'border' : 'border-l border-r'} border-gray-500 text-center text-[15px] font-medium`}>
//                     {isRealItem ? index + 1 : "\u00A0"}
//                   </td>
//                   <td className={`${isRealItem ? 'border' : 'border-l border-r'} border-gray-500 text-center p-5 text-[15px] font-medium`}>
//                     {isRealItem ? item.category_name : "\u00A0"}
//                   </td>
//                   <td className={`${isRealItem ? 'border' : 'border-l border-r'} border-gray-500 text-center text-[15px] font-medium`}>
//                     {isRealItem && item.cart_qty ? `${FormatQTY(item.cart_qty)}L` : "\u00A0"}
//                   </td>
//                   <td className={`${isRealItem ? 'border' : 'border-l border-r'} border-gray-500 text-center text-[15px] font-medium`}>
//                     {isRealItem && item.unit_price ? `$ ${FormatQTY(item.unit_price)}` : "\u00A0"}
//                   </td>
//                   <td className={`${isRealItem ? 'border' : 'border-l border-r'} border-gray-500 text-center font-bold text-[15px] font-medium`}>
//                     {isRealItem && formattedItemTotal ? `$ ${formattedItemTotal}` : "\u00A0"}
//                   </td>
//                 </tr>
//               );
//             })}


//             {/* Grand Total Row */}
//             <tr className="font-bold">
//               <td className="border text-center border-gray-500 p-1 text-[11px] freehand-regular" colSpan={2}>
//                 {displayWords}
//               </td>
//               <td className="border border-gray-500 p-1 text-center text-[15px] font-medium" colSpan={2}>
//                 សរុប
//               </td>
//               <td className="border border-gray-500 p-1 text-center text-[15px] font-medium">
//                 <div className="w-100 h-100">
//                   <span>$ {formatGrandTotal(displayAmount)}</span>
//                 </div>
//               </td>
//             </tr>
//             <tr>
//               <td
//                 className="border-0 border-gray-500 p-1 text-center text-[15px] font-medium"
//                 colSpan={5}
//               >
//                 ទំនិញត្រូវបានទទួលនៅក្នុងលក្ខខណ្ឌល្អ /{" "}
//                 <span className="italic">Product Received in Good Order</span>
//               </td>
//             </tr>
//             <tr>
//               <td className="text-center text-[15px] font-medium pb-0" colSpan={5}>
//                 <div className="grid grid-cols-2 text-center text-[15px] font-medium gap-4 mt-2">
//                   {/* Customer side */}
//                   <div className="mt-1 mb-6">
//                     <p className="font-bold mb-1">អតិថិជន</p>
//                     <p>Customer:</p>
//                     <p className="mt-20">....................</p>
//                     <p className="mt-1">ហត្ថលេខា</p>

//                     {/* Date section - left side */}
//                     <div className="mt-1">
//                       <p>កាលបរិច្ឆេទ Date:</p>
//                       <p className="mt-2">....../....../.....</p>
//                     </div>
//                   </div>

//                   {/* Accountant side */}
//                   <div className="mt-1 mb-6">
//                     <p className="font-bold mb-1">គណនេយ្យករ</p>
//                     <p>Accountant:</p>
//                     <p className="mt-20">....................</p>
//                     <p className="mt-1">ហត្ថលេខា</p>

//                     {/* Date section - right side */}
//                     <div className="mt-1">
//                       <p>កាលបរិច្ឆេទ Date:</p>
//                       <p className="mt-2">{formatDateClient(objSummary?.delivery_date)}</p>
//                     </div>
//                   </div>
//                 </div>
//               </td>
//             </tr>
//           </tbody>
//         </table>
//       </div>

//       {/* Footer - moved up to fit on the page */}
//       <div className="text-center font-medium">
//        <p>ទំនាក់ទំនងផ្នែកទីផ្សារ: 099 822 282 / 093 822 282</p>
//       </div>
//     </div>
//   );
// });

// export default PrintInvoice;



import React from "react";
import logo from "../../assets/PETRONAS_CAMBODIA_LOGO-2.png";
// import logo from "../../assets/NewLogo.png";



// petronas_black2
import "./fonts.css";
import { getProfile } from "../../store/profile.store";
import { formatDateClient } from "../../util/helper";
import './Printfont.css';

// Function to convert number to Khmer words (unchanged)
const numberToKhmerWords = (number) => {
  const units = ["", "មួយ", "ពីរ", "បី", "បួន", "ប្រាំ", "ប្រាំមួយ", "ប្រាំពីរ", "ប្រាំបី", "ប្រាំបួន"];
  const tens = ["", "ដប់", "ម្ភៃ", "សាមសិប", "សែសិប", "ហាសិប", "ហុកសិប", "ចិតសិប", "ប៉ែតសិប", "កៅសិប"];
  const scales = ["", "ពាន់", "ម៉ឺន", "លាន", "ដប់លាន", "រយលាន", "ពាន់លាន"];

  const dollarPart = Math.floor(number);
  const centPart = Math.round((number - dollarPart) * 100);

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

  let dollarWords = "";
  let remaining = dollarPart;

  if (remaining === 0) {
    dollarWords = "សូន្យ";
  } else {
    const millions = Math.floor(remaining / 1000000);
    remaining %= 1000000;

    if (millions > 0) {
      dollarWords += convertLessThanOneMillion(millions) + "លាន";
    }

    dollarWords += convertLessThanOneMillion(remaining);
  }

  let centWords = "";
  if (centPart > 0) {
    if (centPart < 10) {
      centWords = units[centPart] + "សេន";
    } else {
      const ten = Math.floor(centPart / 10);
      const unit = centPart % 10;
      centWords = tens[ten] + (unit !== 0 ? units[unit] : "") + "សេន";
    }
  }

  if (dollarPart > 0 && centPart > 0) {
    return dollarWords.trim() + "ដុល្លារនិង" + centWords;
  } else if (dollarPart > 0) {
    return dollarWords.trim() + "ដុល្លារគត់";
  } else if (centPart > 0) {
    return centWords;
  } else {
    return "សូន្យដុល្លារគត់";
  }
};

const PrintInvoice = React.forwardRef((props, ref) => {
  const profile = getProfile();
  const {
    objSummary = {},
    cart_list = [],
    selectedLocations = []
  } = props;

  const {
    sub_total = 0,
    total_qty = 0,
    save_discount = 0,
    tax = 0,
    total = 0,
    total_paid = 0,
    customer_name = "N/A",
    customer_address = "N/A",
    customer_tel = "N/A",
    user_name = "N/A",
    order_no = "N/A",
    order_date = new Date(),
    payment_method = "N/A",
    remark = "N/A",
    delivery_date,
    receive_date,
    destination
  } = objSummary;

  const formatNumber = (value, withDollar = false) => {
    const number = parseFloat(value) || 0;

    // Format the number to have at most 2 decimal places
    let formatted = number.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // Remove the decimal part if it's .00
    if (formatted.endsWith('.00')) {
      formatted = formatted.slice(0, -3);
    }

    return withDollar ? `$${formatted}` : formatted;
  };

  const formatGrandTotal = (value, withDollar = false) => {
    return formatNumber(value, withDollar); // Use same formatting as item totals
  };



  const FormatQTY = (value) => {
    const number = parseFloat(value) || 0;
    return number.toLocaleString('en-US');
  };

  const formatUnitPrice = (price) => {
    if (!price) return '0';
    const num = parseFloat(price);
    if (isNaN(num)) return '0';

    // Format to 4 decimal places, then remove trailing zeros
    return num.toFixed(4).replace(/\.?0+$/, '');
  };
  const totalAmount = cart_list.reduce(
    (sum, item) => sum + (item.cart_qty * (item.unit_price || item.selling_price)) / (item.actual_price || 1),
    0
  );

  const displayAmount = totalAmount; // No rounding
  const displayWords = numberToKhmerWords(displayAmount);

  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    return phone
      .split("/")
      .map((num) => {
        const digits = num.replace(/\D/g, ""); // Remove any non-digits
        if (digits.length === 10) {
          return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
        }
        return num.trim(); // Return as-is if not 10 digits
      })
      .join(" / ");
  };

  // Get the location labels for display
  const locationLabels = selectedLocations.length > 0
    ? selectedLocations.map(loc => loc.label).join(", ")
    : objSummary.user_name || "N/A";

  // ✅ GROUP ITEMS BY DESTINATION
  const groupItemsByDestination = (items) => {
    const groups = {};
    items.forEach(item => {
      const dest = item.destination || 'default';
      if (!groups[dest]) {
        groups[dest] = [];
      }
      groups[dest].push(item);
    });
    return groups;
  };

  const destinationGroups = groupItemsByDestination(cart_list);
  const destinationKeys = Object.keys(destinationGroups);
  console.log("🖨️ PrintInvoice DEBUG:", {
    cart_list_count: cart_list.length,
    cart_items: cart_list.map(i => ({ name: i.name, dest: i.destination })),
    destinationKeys,
    destinationGroups
  });
  const hasMultipleDestinations = destinationKeys.length > 1 || (destinationKeys.length === 1 && destinationKeys[0] !== 'default');

  // Always display exactly 4 rows in the table
  const FIXED_DISPLAY_ITEMS = 4; // Always show exactly 4 rows

  // Helper function to prepare display items for a group
  const prepareDisplayItems = (groupItems) => {
    const displayItems = [...groupItems];
    if (displayItems.length < FIXED_DISPLAY_ITEMS) {
      const emptyRowsToAdd = FIXED_DISPLAY_ITEMS - displayItems.length;
      for (let i = 0; i < emptyRowsToAdd; i++) {
        displayItems.push({
          category_name: "",
          cart_qty: "",
          unit_price: "",
          actual_price: 1,
          _isEmpty: true
        });
      }
    }
    if (displayItems.length > FIXED_DISPLAY_ITEMS) {
      displayItems.length = FIXED_DISPLAY_ITEMS;
    }
    return displayItems;
  };

  // Helper function to calculate group total
  const calculateGroupTotal = (groupItems) => {
    return groupItems.reduce(
      (sum, item) => sum + (item.cart_qty * (item.unit_price || item.selling_price)) / (item.actual_price || 1),
      0
    );
  };

  // ✅ RENDER INVOICE PAGE FOR A DESTINATION GROUP
  const renderInvoicePage = (destKey, groupItems, pageIndex, totalPages) => {
    const displayItems = prepareDisplayItems(groupItems);
    const groupTotal = calculateGroupTotal(groupItems);
    const groupWords = numberToKhmerWords(groupTotal);
    const destinationLabel = destKey === 'default'
      ? (objSummary?.destination || selectedLocations.map(loc => loc.label).join(", ") || "N/A")
      : destKey;

    return (
      <div
        key={`page-${pageIndex}`}
        className="p-8 px-14 max-w-4xl mx-auto battambang-font"
        style={pageIndex < totalPages - 1 ? { pageBreakAfter: 'always' } : {}}
      >
        {/* Header section */}
        <div className="flex justify-between items-center">
          <div className="items-center">
            <img
              src={logo}
              alt="Company Logo"
              className="w-40 h-40 object-contain"
            />
          </div>

          <div className="flex flex-col items-center justify-center text-center flex-1 relative me-16 mt-10">
            <h2 className="text-2xl text-[15px] moul-regular ">វិក្កយប័ត្រ</h2>
            <h2 className="text-xl text-[15px]">INVOICE</h2>
            {totalPages > 1 && (
              <p className="text-[12px] text-gray-500 mt-1">
                ទំព័រ {pageIndex + 1} / {totalPages}
              </p>
            )}
          </div>

          <div className="w-16 h-16"></div>
        </div>

        {/* Customer and Invoice Info Section */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="w-full mt-2">
            <div className="grid gap-y-1">
              <p className="text-[15px] font-bold text-black">
                ឈ្មោះអតិថិជន: {objSummary?.customer_name || "N/A"}
              </p>
              <p className="text-[15px] font-medium">
                អាស័យដ្ឋាន: <span className="freehand-regular text-[11px]">{objSummary?.customer_address || "N/A"}</span>
              </p>
              <p className="text-[15px] font-medium">លេខទូរស័ព្ទ: {formatPhoneNumber(objSummary?.customer_tel) || "N/A"}</p>
              <p className="text-[15px] font-medium">
                គោលដៅ: <span className="text-[15px] font-bold">{destinationLabel}</span>
              </p>
            </div>
          </div>

          <div className="w-full flex justify-end relative ms-4 ">
            <div className="w-[80%] grid grid-cols-[57%_1%_43%]  gap-y-1 p-2 rounded-lg">
              <div className="text-start flex flex-col items-start">
                <p className="text-base-kh">លេខវិក្កយប័ត្រ</p>
                <p className="text-[15px] font-medium">ថ្ងៃបញ្ជាទិញ</p>
                <p className="text-[15px] font-medium">ថ្ងៃប្រគល់ទំនិញ</p>
                <p className="text-[15px] font-medium">លេខបញ្ជាទិញ</p>
                <p className="text-[14px] font-medium">លេខបណ្ណបញ្ចេញទំនិញ</p>
              </div>

              <div className="flex flex-col items-center">
                <p className="text-[15px] font-medium">:</p>
                <p className="text-[15px] font-medium">:</p>
                <p className="text-[15px] font-medium">:</p>
                <p className="text-[15px] font-medium">:</p>
                <p className="text-[15px] font-medium">:</p>
              </div>

              <div className="text-start flex flex-col ">
                <p className="text-[15px] font-medium">{objSummary?.pre_order_no || objSummary?.order_no || "N/A"}</p>
                <p className="text-[15px] font-medium">{formatDateClient(objSummary?.order_date || "N/A")}</p>
                <p className="text-[15px] font-medium">{formatDateClient(objSummary?.delivery_date)}</p>
                <p className="text-[15px] font-medium">{objSummary.order_no ? `#SA-${objSummary?.order_no}` : ""}</p>
                <p className="text-[15px] font-medium">...................</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content with fixed exact height for 4 rows */}
        <div className="w-full mb-3 overflow-x-auto">
          <table className="w-full border-collapse border border-gray-500">
            <thead className="border border-gray-500 text-black">
              <tr>
                <th className="border border-gray-500 p-[2px] min-w-[0px] text-[15px] font-semibold text-center">
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-[15px] font-semibold">ល.រ</span>
                    <span className="text-[12px] text-[#999999]">No</span>
                  </div>
                </th>
                <th className="border border-gray-500 p-1 w-5/12 text-center text-[15px] font-semibold">
                  <span>បរិយាយមុខទំនិញ</span>
                  <br />
                  <span className="text-[12px] text-[#999999]">Description</span>
                </th>
                <th className="border border-gray-500 p-1 w-2/12 text-center text-[15px] font-semibold leading-[20px]">
                  <span>បរិមាណ</span><br />
                  <span className="text-[12px] text-[#999999] leading-[20px]">Quantity(Liters)</span>
                </th>
                <th className="border border-gray-500 p-1 w-2/12 text-center text-[15px] font-semibold">
                  <span>តម្លៃតោន</span>
                  <br />
                  <span className="text-[12px] text-[#999999]">Ton Price</span>
                </th>
                <th className="border border-gray-500 p-1 w-2/12 text-center text-[15px] font-semibold">
                  <span>តម្លៃសរុប</span>
                  <br />
                  <span className="text-[12px] text-[#999999]">Amount</span>
                </th>
              </tr>
            </thead>

            <tbody className="border border-gray-500">
              {displayItems.map((item, index) => {
                const isRealItem = !item._isEmpty && index < groupItems.length;
                const itemTotal = isRealItem ?
                  (item.cart_qty * (item.unit_price || item.selling_price)) / (item.actual_price || 1) : 0;
                const formattedItemTotal = isRealItem ? formatNumber(itemTotal) : "";

                return (
                  <tr key={index} className="hover:bg-gray-50" style={{ height: "36px" }}>
                    <td className={`${isRealItem ? 'border' : 'border-l border-r'} border-gray-500 text-center text-[15px] font-medium`}>
                      {isRealItem ? index + 1 : "\u00A0"}
                    </td>
                    <td className={`${isRealItem ? 'border' : 'border-l border-r'} border-gray-500 text-center p-5 text-[15px] font-medium`}>
                      {isRealItem ? item.name : "\u00A0"}
                    </td>
                    <td className={`${isRealItem ? 'border' : 'border-l border-r'} border-gray-500 text-center text-[15px] font-medium`}>
                      {isRealItem && item.cart_qty ? `${FormatQTY(item.cart_qty)}L` : "\u00A0"}
                    </td>
                    <td className={`${isRealItem ? 'border' : 'border-l border-r'} border-gray-500 text-center text-[15px] font-medium`}>
                      {isRealItem && (item.unit_price || item.selling_price) ? `$ ${formatUnitPrice(item.unit_price || item.selling_price)}` : "\u00A0"}
                    </td>
                    <td className={`${isRealItem ? 'border' : 'border-l border-r'} border-gray-500 text-center font-bold text-[15px] font-medium`}>
                      {isRealItem && formattedItemTotal ? `$ ${formattedItemTotal}` : "\u00A0"}
                    </td>
                  </tr>
                );
              })}

              {/* Grand Total Row */}
              <tr className="font-bold">
                <td className="border text-center border-gray-500 p-1 text-[11px] freehand-regular" colSpan={2}>
                  {groupWords}
                </td>
                <td className="border border-gray-500 p-1 text-center text-[15px] font-medium" colSpan={2}>
                  សរុប
                </td>
                <td className="border border-gray-500 p-1 text-center text-[15px] font-medium">
                  <div className="w-100 h-100">
                    <span>$ {formatGrandTotal(groupTotal)}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td
                  className="border-0 border-gray-500 p-1 text-center text-[15px] font-medium"
                  colSpan={5}
                >
                  ទំនិញត្រូវបានទទួលនៅក្នុងលក្ខខណ្ឌល្អ /{" "}
                  <span className="italic">Product Received in Good Order</span>
                </td>
              </tr>
              <tr>
                <td className="text-center text-[15px] font-medium pb-0" colSpan={5}>
                  <div className="grid grid-cols-2 text-center text-[15px] font-medium gap-4 mt-2">
                    {/* Customer side */}
                    <div className="mt-1 mb-6">
                      <p className="font-bold mb-1">អតិថិជន</p>
                      <p>Customer:</p>
                      <p className="mt-20">....................</p>
                      <p className="mt-1">ហត្ថលេខា</p>

                      {/* Date section - left side */}
                      <div className="mt-1">
                        <p>កាលបរិច្ឆេទ Date:</p>
                        <p className="mt-2">....../....../.....</p>
                      </div>
                    </div>

                    {/* Accountant side */}
                    <div className="mt-1 mb-6">
                      <p className="font-bold mb-1">គណនេយ្យករ</p>
                      <p>Accountant:</p>
                      <p className="mt-20">....................</p>
                      <p className="mt-1">ហត្ថលេខា</p>

                      {/* Date section - right side */}
                      <div className="mt-1">
                        <p>កាលបរិច្ឆេទ Date:</p>
                        <p className="mt-2">{formatDateClient(objSummary?.delivery_date)}</p>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="text-center font-medium">
          <p>ទំនាក់ទំនងផ្នែកទីផ្សារ: 099 822 282 / 093 822 282</p>
        </div>
      </div>
    );
  };

  // ✅ MAIN RENDER: Multiple pages if multiple destinations, single page otherwise
  return (
    <div ref={ref}>
      {destinationKeys.map((destKey, pageIndex) =>
        renderInvoicePage(destKey, destinationGroups[destKey], pageIndex, destinationKeys.length)
      )}
    </div>
  );
});

export default PrintInvoice;