import React from "react";
import logo from "../../assets/petronas_black2.png";
import { getProfile } from "../../store/profile.store";
import { formatDateClient } from "../../util/helper";

const numberToKhmerWords = (number) => {
  const units = ["", "មួយ", "ពីរ", "បី", "បួន", "ប្រាំ", "ប្រាំមួយ", "ប្រាំពីរ", "ប្រាំបី", "ប្រាំបួន"];
  const tens = ["", "ដប់", "ម្ភៃ", "សាមសិប", "សែសិប", "ហាសិប", "ហុកសិប", "ចិតសិប", "ប៉ែតសិប", "កៅសិប"];
  
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

const PrintDetail = React.forwardRef((props, ref) => {
  const profile = getProfile();
  const { objSummary = {}, cart_list = [], selectedLocations = [] } = props;

  const formatNumber = (value, withDollar = false) => {
    const number = parseFloat(value) || 0;
    let formatted = number.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    if (formatted.endsWith('.00')) {
      formatted = formatted.slice(0, -3);
    }
    return withDollar ? `$${formatted}` : formatted;
  };

  const FormatQTY = (value) => {
    const number = parseFloat(value) || 0;
    return number.toLocaleString('en-US');
  };

  const formatUnitPrice = (value) => {
    const number = parseFloat(value) || 0;
    return Math.floor(number);
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    return phone.split("/").join(" / ");
  };

  const totalAmount = cart_list.reduce(
    (sum, item) => sum + (item.cart_qty * item.unit_price) / (item.actual_price || 1),
    0
  );

  const displayAmount = totalAmount;
  const displayWords = numberToKhmerWords(displayAmount);

  return (
    <div ref={ref} className="p-8 px-14 max-w-4xl mx-auto print:p-0 print:max-w-full">
      <style>
        {`
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
          }
        `}
      </style>

      <div className="flex justify-between items-center print:mb-4">
        <div className="items-center">
          <img
            src={logo}
            alt="Company Logo"
            className="w-40 h-40 object-contain filter grayscale print:w-32 print:h-32"
          />
        </div>

        <div className="flex flex-col items-center justify-center text-center flex-1 relative me-16 mt-10 print:me-0">
          <h2 className="text-2xl text-[15px] moul-regular">វិក្កយប័ត្រ</h2>
          <h2 className="text-xl text-[15px]">INVOICE</h2>
        </div>

        <div className="w-16 h-16 print:hidden"></div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 print:grid-cols-2 print:gap-2">
        <div className="w-full mt-2">
          <div className="grid gap-y-1">
            <p className="text-[15px] font-bold text-black print:text-sm">
              ឈ្មោះអតិថិជន: {objSummary?.customer_name || "N/A"}
            </p>
            <p className="text-[15px] font-medium print:text-sm">
              អាស័យដ្ឋាន: {objSummary?.customer_address || "N/A"}
            </p>
            <p className="text-[15px] font-medium print:text-sm">
              លេខទូរស័ព្ទ: {objSummary?.customer_tel || "N/A"}
            </p>
            <p className="text-[15px] font-medium print:text-sm">
              គោលដៅ: {selectedLocations.map(loc => loc.label).join(", ")}
            </p>
          </div>
        </div>

        <div className="w-full flex justify-end relative ms-4 print:ms-0">
          <div className="w-[80%] grid grid-cols-[57%_1%_43%] gap-y-1 p-2 rounded-lg print:w-full">
            <div className="text-start flex flex-col items-start print:text-sm">
              <p>លេខវិក្កយប័ត្រ</p>
              <p>ថ្ងៃបញ្ជាទិញ</p>
              <p>ថ្ងៃប្រគល់ទំនិញ</p>
              <p>លេខបញ្ជាទិញ</p>
              <p>លេខបណ្ណបញ្ចេញទំនិញ</p>
            </div>

            <div className="flex flex-col items-center print:text-sm">
              <p>:</p>
              <p>:</p>
              <p>:</p>
              <p>:</p>
              <p>:</p>
            </div>

            <div className="text-start flex flex-col print:text-sm">
              <p>{objSummary?.order_no}</p>
              <p>{formatDateClient(objSummary?.delivery_date || "N/A")}</p>
              <p>{formatDateClient(objSummary?.order_date)}</p>
              <p>{objSummary.order_no ? `#SA-${objSummary?.order_no}` : ""}</p>
              <p>...................</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mb-4 overflow-x-auto print:overflow-visible">
        <table className="w-full border-collapse border border-gray-500 print:border-black">
          <thead className="border border-gray-500 text-black print:border-black">
            <tr>
              <th className="border border-gray-500 p-[2px] min-w-[0px] text-[15px] font-semibold text-center print:border-black print:text-sm">
                <div className="flex flex-col items-center leading-tight">
                  <span>ល.រ</span>
                  <span>No</span>
                </div>
              </th>

              <th className="border border-gray-500 p-1 w-5/12 text-center text-[15px] font-semibold print:border-black print:text-sm">
                <span>បរិយាយមុខទំនិញ</span>
                <br /><span>Description</span>
              </th>
              <th className="border border-gray-500 p-1 w-2/12 text-center text-[15px] font-semibold print:border-black print:text-sm">
                <span>បរិមាណ</span>
                <br /><span>Quantity(Liters)</span>
              </th>
              <th className="border border-gray-500 p-1 w-2/12 text-center text-[15px] font-semibold print:border-black print:text-sm">
                <span>តម្លៃតោន</span>
                <br /><span>Ton Price</span>
              </th>
              <th className="border border-gray-500 p-1 w-2/12 text-center text-[15px] font-semibold print:border-black print:text-sm">
                <span>តម្លៃសរុប</span>
                <br /><span>Amount</span>
              </th>
            </tr>
          </thead>
          <tbody className="border border-gray-500 print:border-black">
            {cart_list?.map((item, index) => {
              const itemTotal = (item.cart_qty * item.unit_price) / (item.actual_price || 1);
              const formattedItemTotal = formatNumber(itemTotal);

              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-500 text-center text-[15px] font-medium print:border-black print:text-sm">
                    {index + 1}
                  </td>
                  <td className="border border-gray-500 text-center p-2 text-[15px] font-medium print:border-black print:text-sm">
                    {item.category_name}
                  </td>
                  <td className="border border-gray-500 text-center text-[15px] font-medium print:border-black print:text-sm">
                    {FormatQTY(item.cart_qty)} <span className="text-sm">{item.unit}</span>
                  </td>
                  <td className="border border-gray-500 text-center text-[15px] font-medium print:border-black print:text-sm">
                    $ {formatUnitPrice(item.unit_price)}
                  </td>
                  <td className="border border-gray-500 text-center font-bold text-[15px] font-medium print:border-black print:text-sm">
                    $ {formattedItemTotal}
                  </td>
                </tr>
              );
            })}

            <tr className="font-bold">
              <td className="border text-center border-gray-500 p-2 text-[15px] font-medium print:border-black print:text-sm" colSpan={2}>
                {displayWords}
              </td>
              <td className="border border-gray-500 p-1 text-center text-[15px] font-medium print:border-black print:text-sm" colSpan={2}>
                តម្លៃរាយសរុប Grand Total
              </td>
              <td className="border border-gray-500 p-1 text-right text-[15px] font-medium print:border-black print:text-sm">
                $ {formatNumber(displayAmount)}
              </td>
            </tr>
            <tr>
              <td className="border-0 border-gray-500 p-1 text-center text-[15px] font-medium print:text-sm" colSpan={5}>
                ទំនិញត្រូវបានទទួលនៅក្នុងលក្ខខណ្ឌល្អ / <span className="italic">Product Received in Good Order</span>
              </td>
            </tr>
            <tr>
              <td className="text-center text-[15px] font-medium mb-10 pb-0 print:text-sm" colSpan={5}>
                <div className="grid grid-cols-2 text-center text-[15px] font-medium gap-4 print:grid-cols-2">
                  <div className="mt-2 mb-10 print:mb-4">
                    <p className="font-bold mb-2 text-[15px] font-medium print:text-sm">អតិថិជន</p>
                    <p className="text-[15px] font-medium print:text-sm">Customer:</p>
                    <p className="mt-28 text-[15px] font-medium print:mt-16 print:text-sm">....................</p>
                    <p className="mt-2 text-[15px] font-medium print:text-sm">ហត្ថលេខា</p>
                    <p className="mt-2 text-[15px] font-medium print:text-sm">កាលបរិច្ឆេទ Date:</p>
                    <div className="mt-8 print:mt-4"></div>
                    <p className="mt-2 print:text-sm"> ....../....../.....</p>
                  </div>
                  <div className="text-center mt-2 mb-10 text-[15px] font-medium px-32 print:px-16 print:mb-4">
                    <p className="font-bold mb-2 text-[15px] font-medium print:text-sm">គណនេយ្យករ</p>
                    <p className="text-[15px] font-medium print:text-sm">Accountant:</p>
                    <p className="mt-28 text-[15px] font-medium print:mt-16 print:text-sm">....................</p>
                    <p className="mt-2 text-[15px] font-medium print:text-sm">ហត្ថលេខា</p>
                    <p className="mt-2 text-[15px] font-medium print:text-sm">កាលបរិច្ឆេទ Date:</p>
                    <div className="mt-8 print:mt-4"></div>
                    <p className="text-[15px] font-medium mt-2 print:text-sm">
                      {formatDateClient(objSummary.order_date)}
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="text-center font-medium print:text-sm">
        <p>ទំនាក់ទំនងផ្នែកទីផ្សារ: {formatPhoneNumber(profile?.tel)}</p>
      </div>
    </div>
  );
});

export default PrintDetail;