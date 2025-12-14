-- First ensure the referenced tables exist with matching column types
-- (Assuming your order table is named `order` - note backticks for reserved word)
CREATE TABLE IF NOT EXISTS `order` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `customer_id` INT NOT NULL,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `paid_amount` DECIMAL(10,2) DEFAULT 0,
  `payment_method` VARCHAR(50),
  `payment_status` ENUM('Paid','Partial','Unpaid'),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- Then create the payments table
CREATE TABLE `payments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `order_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL,
  `payment_date` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_customer_id` (`customer_id`),
  CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payment_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;




CREATE TABLE `payments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `order_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL,
  `payment_date` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

);


ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;



CREATE TABLE `customer_debt` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `total_amount` decimal(12,2) NOT NULL COMMENT 'Total amount of the order',
  `paid_amount` decimal(12,2) DEFAULT 0.00 COMMENT 'Amount already paid',
  `due_amount` decimal(12,2) GENERATED ALWAYS AS (`total_amount` - `paid_amount`) STORED,
  `due_date` date DEFAULT NULL COMMENT 'Expected payment date',
  `last_payment_date` datetime DEFAULT NULL COMMENT 'Date of last payment',
  `payment_status` enum('Paid','Partial','Unpaid') GENERATED ALWAYS AS (
    CASE 
      WHEN (`total_amount` - `paid_amount`) = 0 THEN 'Paid'
      WHEN `paid_amount` > 0 THEN 'Partial'
      ELSE 'Unpaid'
    END
  ) STORED,
  `notes` text DEFAULT NULL COMMENT 'Any special notes about this debt',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int(11) NOT NULL COMMENT 'User who created the record',
  PRIMARY KEY (`id`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_status` (`payment_status`),
  KEY `idx_due_date` (`due_date`),
  CONSTRAINT `fk_debt_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`),
  CONSTRAINT `fk_debt_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`),
  CONSTRAINT `fk_debt_user` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;



remove date expense

import React, { useEffect, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import { formatDateClient, formatDateServer, isPermission, request } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import Style from "../../page/orderPage/OrderPage.module.css";
import { configStore } from "../../store/configStore";
import { GrFormView } from "react-icons/gr";
import dayjs from "dayjs";
import { BsSearch } from "react-icons/bs";
import { LuUserRoundSearch } from "react-icons/lu";
import { getProfile } from "../../store/profile.store";

function OrderPage() {
  const { config } = configStore();
  const [formRef] = Form.useForm();
  const [list, setList] = useState([]);
  const [orderDetail, setOrderDetail] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [summary, setSummary] = useState({ 
    total_amount: 0, 
    total_order: 0,
    oil_expense_total: 0
  });
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState({
    visibleModal: false,
    id: null,
    name: "",
    description: "",
    status: "",
    parentId: null,
    txtSearch: "",
  });
  const [filter, setFilter] = useState({
    from_date: dayjs(),
    to_date: dayjs(),
    user_id: "",
  });

  // ទិន្នន័យហិរញ្ញវត្ថុសរុប
  const [financeSummary, setFinanceSummary] = useState({
    total_revenue: 0,
    total_cost: 0,
    total_profit: 0,
    total_invoices: 0,
    profit_margin: 0,
    oil_expense_total: 0
  });

  const formatCurrencyString = (value) => {
    if (value === undefined || value === null) return "0.00";
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "0.00";
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  // កែសម្រួល getList function ដើម្បីប្រើប្រាស់ទិន្នន័យពិតនៃចំណាយប្រេង
  const getList = async () => {
    setLoading(true);
    try {
      const param = {
        txtSearch: state.txtSearch,
        from_date: formatDateServer(filter.from_date),
        to_date: formatDateServer(filter.to_date),
        user_id: filter.user_id || getProfile().id,
      };
  
      const res = await request(`order/${param.user_id}`, "get", param);
  
      if (res && res.list) {
        const orderList = res.list || [];
        
        // Set summary data including oil expense total from API
        setSummary(res.summary || { 
          total_amount: 0, 
          total_order: 0,
          oil_expense_total: 0 
        });
        
        setList(orderList);

        // ទាញយកតម្លៃចំណូលពីបញ្ជាទិញ
        const totalRevenue = orderList.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
        
        // ទាញចំណាយប្រេងពិតប្រាកដពី response
        const oilExpenseTotal = parseFloat(res.summary?.oil_expense_total || 0);
        
        // ការគណនាចំណាយសរុប និងប្រាក់ចំណេញ
        const totalCost = oilExpenseTotal;  // ប្រើប្រាស់តម្លៃពិតប្រាកដនៃចំណាយប្រេង
        const totalProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        
        // ធ្វើបច្ចុប្បន្នភាពទិន្នន័យហិរញ្ញវត្ថុសរុប
        setFinanceSummary({
          total_revenue: totalRevenue,
          total_cost: totalCost,
          total_profit: totalProfit,
          total_invoices: orderList.length,
          profit_margin: profitMargin,
          oil_expense_total: oilExpenseTotal
        });
      }
    } catch (error) {
      console.error("Error fetching list: ", error);
      message.error("Failed to fetch order data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getList();
  }, [filter.user_id, filter.from_date, filter.to_date]);

  const handleSearch = () => {
    getList();
  };

  const getOrderDetail = async (data) => {
    setLoading(true);
    try {
      const res = await request("order_detail/" + data.id, "get");
      if (res) {
        setOrderDetail(res.list || []);
        setSelectedOrder(data);
        setState({
          ...state,
          visibleModal: true,
        });
      }
    } catch (error) {
      console.error("Error fetching order details: ", error);
      message.error("Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  };

  const onCloseModal = () => {
    formRef.resetFields();
    setState({
      ...state,
      visibleModal: false,
      id: null,
    });
    setSelectedOrder(null);
  };

  const columns = [
    {
      key: "order_no",
      title: (
        <div className="table-header">
          <div className="khmer-text">លេខបញ្ជាទិញ</div>
          <div className="english-text">Order No</div>
        </div>
      ),
      dataIndex: "order_no",
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      key: "customer",
      title: (
        <div className="table-header">
          <div className="khmer-text">អតិថិជន</div>
          <div className="english-text">Customer</div>
        </div>
      ),
      dataIndex: "customer_name",
      render: (value, data) => (
        <>
          <div style={{ fontWeight: "bold" }}>{data.customer_name}</div>
          <div>{data.customer_tel}</div>
          <div>{data.customer_address}</div>
        </>
      ),
    },
    {
      key: "Total",
      title: (
        <div className="table-header">
          <div className="khmer-text">សរុប</div>
          <div className="english-text">Total</div>
        </div>
      ),
      dataIndex: "total_amount",
      render: (value) => `$${formatCurrencyString(value)}`,
    },
    {
      key: "Paid",
      title: (
        <div className="table-header">
          <div className="khmer-text">បានបង់</div>
          <div className="english-text">Paid</div>
        </div>
      ),
      dataIndex: "paid_amount",
      render: (value) => (
        <div style={{ color: "green", fontWeight: "bold" }}>
          ${formatCurrencyString(value)}
        </div>
      ),
    },
    {
      key: "Due",
      title: (
        <div className="table-header">
          <div className="khmer-text">នៅសល់</div>
          <div className="english-text">Due</div>
        </div>
      ),
      dataIndex: "Due",
      render: (value, data) => {
        const total = parseFloat(String(data.total_amount || "0").replace(/,/g, ''));
        const paid = parseFloat(String(data.paid_amount || "0").replace(/,/g, ''));
        const due = total - paid;
        return <Tag color="red">${formatCurrency(due)}</Tag>;
      },
    },
    {
      key: "PaymentMethod",
      title: (
        <div className="table-header">
          <div className="khmer-text">វិធីបង់ប្រាក់</div>
          <div className="english-text">Payment Method</div>
        </div>
      ),
      dataIndex: "payment_method",
      render: (value) => <Tag color="green">{value}</Tag>,
    },
    {
      key: "Remark",
      title: (
        <div className="table-header">
          <div className="khmer-text">កំណត់សម្គាល់</div>
          <div className="english-text">Remark</div>
        </div>
      ),
      dataIndex: "remark",
    },
    {
      key: "User",
      title: (
        <div className="table-header">
          <div className="khmer-text">អ្នកប្រើប្រាស់</div>
          <div className="english-text">User</div>
        </div>
      ),
      dataIndex: "create_by",
      render: (value) => <Tag color="pink">{value}</Tag>,
    },
    {
      key: "Order_Date",
      title: (
        <div className="table-header">
          <div className="khmer-text">កាលបរិច្ឆេទបញ្ជាទិញ</div>
          <div className="english-text">Order Date</div>
        </div>
      ),
      dataIndex: "create_at",
      render: (value) => formatDateClient(value, "DD/MM/YYYY H:m A"),
    },
    {
      key: "Action",
      title: (
        <div className="table-header">
          <div className="khmer-text">សកម្មភាព</div>
          <div className="english-text">Action</div>
        </div>
      ),
      align: "center",
      render: (item, data) => (
        <Space>
          <Tooltip title="View">
            <Button
              type="primary"
              icon={<GrFormView />}
              onClick={() => getOrderDetail(data)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const detailColumns = [
    {
      key: "product_name",
      title: "Product",
      dataIndex: "product_name",
      render: (text, data) => (
        <div style={{ padding: "10px", backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)" }}>
          <div style={{ fontWeight: "bold", fontSize: "16px", color: "#333" }}>
            {data.product_name}
          </div>
          <div style={{ color: "#777", fontSize: 12 }}>
            {data.category_name}
          </div>
          <div style={{ color: "#777", fontSize: 12, marginTop: 4 }}>
            Unit: {data.unit}
          </div>
        </div>
      )
    },
    {
      key: "total_quantity",
      title: "Qty",
      dataIndex: "total_quantity",
      width: 80,
      render: (text) => (
        <div style={{ textAlign: "center", fontWeight: "bold" }}>
          <Tag color="green">{text}</Tag>
        </div>
      ),
    },
    {
      key: "unit_price",
      title: "Unit Price",
      dataIndex: "unit_price",
      width: 120,
      render: (text) => (
        <div style={{ textAlign: "right", fontWeight: "bold" }}>
          <Tag color="pink">${formatCurrencyString(text)}</Tag>
        </div>
      ),
    },
    {
      key: "grand_total",
      title: "Total",
      dataIndex: "grand_total",
      width: 120,
      render: (text) => (
        <div style={{ textAlign: "right", fontWeight: "bold", color: "#333" }}>
          <Tag color="blue">${formatCurrencyString(text)}</Tag>
        </div>
      ),
    }
  ];

  return (
    <MainPage loading={loading}>
      <div className="pageHeader">
        <Space>
          {/* ទិន្នន័យហិរញ្ញវត្ថុសង្ខេប */}
          <div className={Style.summaryContainer}>
            <div className={Style.summaryCard}>
              <div className={Style.summaryTitle}>ចំណូលសរុប</div>
              <div className={`${Style.summaryValue} ${Style.summaryPositive}`}>
                ${formatCurrencyString(financeSummary.total_revenue)}
              </div>
            </div>
            
            {/* បង្ហាញចំណាយប្រេងសរុបដែលមាន ID = 11 */}
            <div className={Style.summaryCard} style={{ backgroundColor: "#fff8e6", border: "1px solid #ffd591" }}>
              <div className={Style.summaryTitle}>
                <span style={{ display: "block" }}>ចំណាយប្រេង</span>
              </div>
              <div className={`${Style.summaryValue} ${Style.summaryNegative}`}>
                ${formatCurrencyString(financeSummary.oil_expense_total)}
              </div>
            </div>
            
            <div className={Style.summaryCard}>
              <div className={Style.summaryTitle}>ចំណាយសរុប</div>
              <div className={`${Style.summaryValue} ${Style.summaryNegative}`}>
                ${formatCurrencyString(financeSummary.total_cost)}
              </div>
            </div>
            
            <div className={Style.summaryCard}>
              <div className={Style.summaryTitle}>ចំណេញសរុប</div>
              <div className={`${Style.summaryValue} ${Style.summaryPositive}`}>
                ${formatCurrencyString(financeSummary.total_profit)}
              </div>
            </div>
            
            <div className={Style.summaryCard}>
              <div className={Style.summaryTitle}>អត្រាចំណេញ</div>
              <div className={`${Style.summaryValue} ${Style.summaryNeutral}`}>
                {financeSummary.profit_margin.toFixed(2)}%
              </div>
            </div>
            
            <div className={Style.summaryCard}>
              <div className={Style.summaryTitle}>ចំនួនវិក័យប័ត្រ</div>
              <div className={`${Style.summaryValue} ${Style.summaryNeutral}`}>
                {financeSummary.total_invoices}
              </div>
            </div>
          </div>

          <Input.Search
            onChange={(e) => setState((p) => ({ ...p, txtSearch: e.target.value }))}
            allowClear
            onSearch={handleSearch}
            placeholder="Search"
          />
          {isPermission("customer.create") && (
            <DatePicker.RangePicker
              allowClear={false}
              defaultValue={[
                dayjs(filter.from_date, "DD/MM/YYYY"),
                dayjs(filter.to_date, "DD/MM/YYYY")
              ]}
              format={"DD/MM/YYYY"}
              onChange={(value) => {
                if (value && value.length === 2) {
                  setFilter((prev) => ({
                    ...prev,
                    from_date: value[0],
                    to_date: value[1]
                  }));
                }
              }}
            />
          )}
          {isPermission("customer.create") && (
            <Select
              style={{ width: 300 }}
              allowClear
              placeholder="Select User"
              value={filter.user_id}
              options={config?.user || []}
              onChange={(value) => {
                setFilter((prev) => ({
                  ...prev,
                  user_id: value,
                }));
              }}
              suffixIcon={<LuUserRoundSearch />}
            />
          )}
          <Button type="primary" onClick={handleSearch} icon={<BsSearch />}>
            Filter
          </Button>
        </Space>
      </div>

      <div className={Style.tableContent}>
        <Table
          dataSource={list}
          columns={columns}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
          rowKey="id"
          style={{ marginTop: "20px" }}
          rowClassName="table-row-hover"
          summary={(pageData) => {
            let totalAmount = 0;
            pageData.forEach(({ total_amount }) => {
              const value = parseFloat(String(total_amount).replace(/,/g, ''));
              totalAmount += isNaN(value) ? 0 : value;
            });

            return (
              <>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    Total Amount:
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} style={{ textAlign: 'left', fontWeight: 'bold' }}>
                    <Tag color="blue">${formatCurrencyString(totalAmount)}</Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} colSpan={6} />
                </Table.Summary.Row>
              </>
            );
          }}
        />
      </div>

      <Modal
        open={state.visibleModal}
        title="Invoice Details"
        footer={[
          <Button key="close" onClick={onCloseModal}>
            Close
          </Button>
        ]}
        onCancel={onCloseModal}
        width={800}
        centered={true}
        destroyOnClose={true}
      >
        <Table
          dataSource={orderDetail}
          columns={detailColumns}
          pagination={{
            pageSize: 5,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
          rowKey="id"
          style={{ marginTop: "20px" }}
          rowClassName="table-row-hover"
          summary={(pageData) => {
            let totalAmount = 0;
            pageData.forEach(({ grand_total }) => {
              const value = parseFloat(String(grand_total).replace(/,/g, ''));
              totalAmount += isNaN(value) ? 0 : value;
            });

            return (
              <>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    Grand Total:
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} style={{ textAlign: 'right' }}>
                    <Tag color="blue" style={{ fontSize: '16px', padding: '4px 8px' }}>
                      ${formatCurrencyString(totalAmount)}
                    </Tag>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </>
            );
          }}
          bordered
          scroll={{ x: 'max-content' }}
          loading={!orderDetail || orderDetail.length === 0}
        />

        {selectedOrder && (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <p>
                  <strong>Order No:</strong> {selectedOrder.order_no}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {formatDateClient(selectedOrder.create_at, "DD/MM/YYYY H:mm A")}
                </p>
              </div>
              <div>
                <p>
                  <strong>Payment Method:</strong>{" "}
                  <Tag color="green">{selectedOrder.payment_method}</Tag>
                </p>
                <p>
                  <strong>Paid Amount:</strong>{" "}
                  <span style={{ color: "green", fontWeight: "bold" }}>
                    ${formatCurrencyString(selectedOrder.paid_amount)}
                  </span>
                </p>
                <p>
                  <strong>Due Amount:</strong>{" "}
                  <span style={{ color: "red", fontWeight: "bold" }}>
                    $
                    {formatCurrencyString(
                      parseFloat(
                        String(selectedOrder.total_amount || "0").replace(/,/g, "")
                      ) -
                      parseFloat(
                        String(selectedOrder.paid_amount || "0").replace(/,/g, "")
                      )
                    )}
                  </span>
                </p>
              </div>
            </div>
            <div style={{ marginTop: "10px" }}>
              <p>
                <strong>Customer:</strong> {selectedOrder.customer_name}
              </p>
              <p>
                <strong>Tel:</strong> {selectedOrder.customer_tel}
              </p>
              <p>
                <strong>Address:</strong> {selectedOrder.customer_address}
              </p>
              {selectedOrder.remark && (
                <p>
                  <strong>Remark:</strong> {selectedOrder.remark}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </MainPage>
  );
}

export default OrderPage;







ALTER TABLE expense ADD COLUMN create_at DATETIME DEFAULT CURRENT_TIMESTAMP;
