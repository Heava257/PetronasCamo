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
  qty, // This is the available stock quantity
  handleQuantityChange,
  handlePriceChange,
  // ✅ Remove handleActualPriceChange prop since actual_price is auto-fetched
  index,
}) {
  const safe_actual_price = actual_price > 0 ? actual_price : 1; // Default to 1 instead of unit_price

  // Calculate the total for this item using the formula (qty * unit_price) / actual_price
  const calculated_total = ((cart_qty * unit_price) / safe_actual_price).toFixed(2);
  const formattedTotal = Number(calculated_total).toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

  // Format handler for InputNumber
  const formatter = (value) => {
    return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Parser to convert formatted string back to number
  const parser = (value) => {
    return value.replace(/\$\s?|(,*)/g, '');
  };

  // Stock validation handler
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
    } else if (!value) {
      // Allow clearing the field
      handleQuantityChange(value, index);
    } else {
      // If validation fails, reset to the previous valid value or max stock
      handleQuantityChange(qty < cart_qty ? qty : cart_qty, index);
    }
  };

  return (
    <div className={styles.container}>
      <Row>
        <Col span={18}>
         
          <div className="khmer-category">{category_name}</div>

          <Space>
            <div className="khmer-text">បរិមាណ:</div> {/* Quantity */}
            <InputNumber
              value={cart_qty}
              onChange={onQuantityChange}
              min={1}
              max={qty} // Set maximum to available stock
              formatter={formatter}
              parser={parser}
            />

            <div className="khmer-text">តម្លៃឯកតា</div> {/* Unit Price */}
            <InputNumber
              value={unit_price}
              onChange={(value) => handlePriceChange(value, index)}
              min={0}
              formatter={formatter}
              parser={parser}
            />

            {/* ✅ Display actual_price as read-only text instead of input */}
            <div className="khmer-text">មេចែក: {actual_price}</div>
          </Space>

          <div className="khmer-total">
            តម្លៃសរុប: ${formattedTotal} {/* Total */}
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default BillItem;