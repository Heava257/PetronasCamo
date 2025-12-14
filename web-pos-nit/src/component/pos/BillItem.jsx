// import React from "react";
// import styles from "./BillItem.module.css";
// import { Col, Row, Space, InputNumber, notification } from "antd";

// function BillItem({
//   name,
//   category_name,
//   unit_price,
//   actual_price,
//   barcode,
//   cart_qty,
//   qty,
//   handleQuantityChange,
//   handlePriceChange,
//   index,
// }) {
//   const safe_actual_price = actual_price > 0 ? actual_price : 1;

//   const calculated_total = ((cart_qty * unit_price) / safe_actual_price).toFixed(2);
//   const formattedTotal = Number(calculated_total).toLocaleString('en-US', {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });

//   const formatter = (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
//   const parser = (value) => value.replace(/\$\s?|(,*)/g, '');

//   const validateQuantity = (value) => {
//     if (value > qty) {
//       notification.error({
//         message: "បរិមាណមិនគ្រប់គ្រាន់",
//         description: `សូមបញ្ចូលបរិមាណតិចជាង ឬស្មើ ${qty}`,
//         placement: "bottomRight",
//         style: {
//           backgroundColor: "hsl(359,100%,98%)",
//           outline: "1px solid #ff4d4f",
//         },
//       });
//       return false;
//     }
//     return true;
//   };

//   const onQuantityChange = (value) => {
//     if (value && validateQuantity(value)) {
//       handleQuantityChange(value, index);
//     } else if (!value) {
//       handleQuantityChange(value, index);
//     } else {
//       handleQuantityChange(qty < cart_qty ? qty : cart_qty, index);
//     }
//   };

//   return (
//     <div className={styles.container}>
//       <Row gutter={[8, 8]}>
//         <Col span={24}>
//           <div className="khmer-category">{category_name}</div>

//           <Space wrap>
//             <div className="khmer-text">បរិមាណ:</div>
//             <InputNumber
//               value={cart_qty}
//               onChange={onQuantityChange}
//               min={1}
//               max={qty}
//               formatter={formatter}
//               parser={parser}
//             />

//             <div className="khmer-text">តម្លៃឯកតា:</div>
//             <InputNumber
//               value={unit_price}
//               onChange={(value) => handlePriceChange(value, index)}
//               min={0}
//               formatter={formatter}
//               parser={parser}
//             />

//             <div className="khmer-text">មេចែក: {actual_price}</div>
//           </Space>

//           <div className="khmer-total">
//             តម្លៃសរុប: ${formattedTotal}
//           </div>
//         </Col>
//       </Row>
//     </div>
//   );
// }

// export default BillItem;


import React from "react";
import styles from "./BillItem.module.css";
import { Col, Row, Space, InputNumber, notification } from "antd";

function BillItem({
  name,
  category_name,
  unit_price,
  actual_price,
  barcode,
  cart_qty,
  qty,
  handleQuantityChange,
  handlePriceChange,
  index,
}) {
  const safe_actual_price = actual_price > 0 ? actual_price : 1;
  const formattedUnitPrice = Number(unit_price).toFixed(2);
  
  // ✅ Fix: Use cart_qty directly, don't fallback to qty
  const displayCartQty = cart_qty || 0;
  const calculated_total = ((displayCartQty * unit_price) / safe_actual_price).toFixed(2);
  const formattedTotal = Number(calculated_total).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formatter = (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const parser = (value) => value.replace(/\$\s?|(,*)/g, '');

  const validateQuantity = (value) => {
    if (value > qty) {
      notification.error({
        message: "បរិមាណមិនគ្រប់គ្រាន់",
        description: `សូមបញ្ចូលបរិមាណតិចជាង ឬស្មើ ${qty}`,
        placement: "bottomRight",
        style: {
          backgroundColor: "hsl(359,100%,98%)",
          outline: "1px solid #ff4d4f",
        },
      });
      return false;
    }
    return true;
  };

  const onQuantityChange = (value) => {
    if (value && validateQuantity(value)) {
      handleQuantityChange(value, index);
    } else if (value === 0 || value === null || value === undefined) {
      // ✅ Allow setting quantity to 0
      handleQuantityChange(0, index);
    } else {
      handleQuantityChange(qty < cart_qty ? qty : cart_qty, index);
    }
  };

  return (
    <div className={styles.container}>
      <Row gutter={[8, 8]}>
        <Col span={24}>
          <div className="khmer-category">{category_name}</div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
             (មានស្តុក: {qty}L)
          </div>

          <Space wrap>
            <div className="khmer-text">បរិមាណ:</div>
            <InputNumber
            disabled
              value={displayCartQty}
              onChange={onQuantityChange}
              min={0}
              max={qty}
              formatter={formatter}
              parser={parser}
              placeholder="0"
            />

            <div className="khmer-text">តម្លៃឯកតា:</div>
            <InputNumber
              value={unit_price}
              onChange={(value) => handlePriceChange(value, index)}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
            />

            <div className="khmer-text">មេចែក: {actual_price}</div>
          </Space>

          <div className="khmer-total">
            តម្លៃសរុប: ${formattedTotal}
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default BillItem;