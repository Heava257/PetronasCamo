
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
  Checkbox,
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
import { FaMoneyBillWave, FaGasPump, FaChartLine, FaPiggyBank, FaPercentage, FaFileInvoice } from "react-icons/fa";

// In-memory checkbox store for Order completion
const orderCheckboxStore = {
  states: new Map(),

  setState(orderId, isCompleted) {
    this.states.set(orderId, isCompleted);
  },

  getState(orderId) {
    return this.states.get(orderId);
  },

  hasState(orderId) {
    return this.states.has(orderId);
  },

  clearStates() {
    this.states.clear();
  }
};

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
    timeRange: "1_day",
    order_date: null,      // ✅ NEW: Single order date filter
    delivery_date: null,   // ✅ NEW: Single delivery date filter
  });
  const [financeSummary, setFinanceSummary] = useState({
    total_revenue: 0,
    total_cost: 0,
    total_profit: 0,
    total_invoices: 0,
    profit_margin: 0,
    oil_expense_total: 0,
    completed_orders: 0
  });

  const formatCurrencyString = (value) => {
    const num = parseFloat(value || "0");
    return isNaN(num) ? "0.00" : num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "0.00";
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  useEffect(() => {
    const user = getProfile();
    const now = dayjs();
    setFilter({
      from_date: now.startOf("day"),
      to_date: now.endOf("day"),
      user_id: user.id,
      timeRange: "1_day",
      order_date: null,
      delivery_date: null,
    });
  }, []);

  useEffect(() => {
    getList();
  }, [filter.user_id, filter.from_date, filter.to_date, filter.order_date, filter.delivery_date]);

  const getList = async () => {
    setLoading(true);
    try {
      const user = getProfile();
      const param = {
        txtSearch: state.txtSearch,
        from_date: formatDateServer(filter.from_date),
        to_date: formatDateServer(filter.to_date),
        user_id: filter.user_id || user.id,
        order_date: filter.order_date ? formatDateServer(filter.order_date) : null,        // ✅ NEW
        delivery_date: filter.delivery_date ? formatDateServer(filter.delivery_date) : null, // ✅ NEW
      };

      const res = await request(`order`, "get", param);
      const oilRes = await request(`oil_expense_total/${param.user_id}`, "get", {
        from_date: param.from_date,
        to_date: param.to_date
      });

      const oilExpenseTotal = parseFloat(oilRes?.oil_expense_total || 0);

      if (res && res.list) {
        const orderList = res.list || [];

        const ordersWithDetails = await Promise.all(
          orderList.map(async (order) => {
            try {
              const detailRes = await request(`order_detail/${order.id}`, "get");
              return {
                ...order,
                orderDetails: detailRes?.list || []
              };
            } catch (error) {
              console.error(`Failed to fetch details for order ${order.id}:`, error);
              return {
                ...order,
                orderDetails: []
              };
            }
          })
        );

        const mergedOrders = ordersWithDetails.map(order => {
          const hasLocalState = orderCheckboxStore.hasState(order.id);
          const localState = orderCheckboxStore.getState(order.id);

          return {
            ...order,
            is_completed: hasLocalState ? localState : Boolean(order.is_completed)
          };
        });

        setSummary({
          ...(res.summary || {}),
          oil_expense_total: oilExpenseTotal
        });

        setList(mergedOrders);

        orderCheckboxStore.clearStates();

        const totalRevenue = mergedOrders.reduce(
          (sum, order) => sum + parseFloat(order.total_amount || 0),
          0
        );
        const completedCount = mergedOrders.filter(order => order.is_completed).length;
        const otherCosts = totalRevenue * 0.5;
        const totalCost = otherCosts + oilExpenseTotal;
        const profit = totalRevenue - totalCost;
        const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

        setFinanceSummary({
          total_revenue: totalRevenue,
          total_cost: totalCost,
          total_profit: profit,
          total_invoices: mergedOrders.length,
          profit_margin: margin,
          oil_expense_total: oilExpenseTotal,
          completed_orders: completedCount
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Failed to fetch order data");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderCheckboxChange = async (orderId, checked) => {
    try {
      const response = await request('order/completion', 'post', {
        order_id: orderId,
        is_completed: checked
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to update');
      }

      setList(prevList =>
        prevList.map(order =>
          order.order_id === orderId
            ? { ...order, is_completed: checked }
            : order
        )
      );

      const completedOrderIds = new Set(
        list
          .map(o => o.order_id === orderId ? { ...o, is_completed: checked } : o)
          .filter(o => o.is_completed)
          .map(o => o.order_id)
      );

      setFinanceSummary(prev => ({
        ...prev,
        completed_orders: completedOrderIds.size
      }));

      message.success(checked ? 'បានសម្គាល់ថាបញ្ចប់' : 'បានសម្គាល់ថាមិនទាន់បញ្ចប់');

    } catch (error) {
      console.error('Order checkbox update error:', error);
      getList();
      message.error(error.message || 'មិនអាចធ្វើបច្ចុប្បន្នភាពបានទេ');
    }
  };

  const handleRefreshFromServer = () => {
    orderCheckboxStore.clearStates();
    getList();
    message.info('Refreshed order states from server');
  };

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

  const getRowClassName = (record, index) => {
    const baseClass = index % 2 === 0 ? 'even-row' : 'odd-row';
    const isChecked = Boolean(record.is_completed);
    return isChecked ? `${baseClass} checked-row` : baseClass;
  };

  const columns = [
    {
      key: "No",
      title: <div className="khmer-text1">ល.រ</div>,
      render: (text, record, index) => index + 1,
      width: 60
    },
    {
      key: "product_name",
      title: (
        <div className="table-header">
          <div className="khmer-text">ប្រភេទ</div>
          <div className="english-text">Category</div>
        </div>
      ),
      render: (_, record) => (
        <div style={{ padding: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{record.category_name}</div>
        </div>
      )
    },
     {
      title: (
        <div className="column-header-product">
          <div className="khmer-text-product">ក្រុមហ៊ុន</div>
          <div className="english-text-product">Company</div>
        </div>
      ),
      dataIndex: "product_company_name",
      key: "company",
      render: (company) => (
        <span className="custom-cell-text english-company-product">
          {company || "N/A"}
        </span>
      ),
      width: 150,
    },
    {
      key: "customer",
      title: (
        <div className={Style.tableHeaderGroup}>
          <div className="khmer-text">អតិថិជន</div>
          <div className={Style.englishText}>Customer</div>
        </div>
      ),
      dataIndex: "customer_name",
      render: (value, data) => (
        <div className={Style.customerCell}>
          <div className={Style.customerName}>{data.customer_name}</div>
          <div className={Style.customerTel}>{data.customer_tel}</div>
          <div className={Style.customerAddress}>{data.customer_address}</div>
        </div>
      )
    },
    {
      key: "product_description",
      title: (
        <div className="table-header">
          <div className="khmer-text">លេខប័ណ្ណ</div>
          <div className="english-text">Card Number</div>
        </div>
      ),
      dataIndex: "product_description",
      render: (value) => value ? <Tag color="cyan">{value}</Tag> : <span style={{ color: '#999' }}>-</span>
    },
    {
      key: "qty",
      title: (
        <div className="table-header">
          <div className="khmer-text">បរិមាណ</div>
          <div className="english-text">Qty</div>
        </div>
      ),
      dataIndex: "total_quantity",
      width: 100,
      render: (value, record) => {
        const formattedQty = value ? parseFloat(value).toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }) : '0';
        return (
          <Tag color="green">
            {formattedQty} {record.unit || ''}
          </Tag>
        );
      }
    },
    {
      key: "unit_price",
      title: (
        <div className="table-header">
          <div className="khmer-text">តម្លៃឯកតា</div>
          <div className="english-text">Unit Price</div>
        </div>
      ),
      dataIndex: "price",
      width: 120,
      render: (value) => <Tag color="pink">${formatCurrencyString(value)}</Tag>
    },
    {
      key: "item_total",
      title: (
        <div className="table-header">
          <div className="khmer-text">តម្លៃសរុប</div>
          <div className="english-text">Item Total</div>
        </div>
      ),
      dataIndex: "grand_total",
      width: 120,
      render: (value) => <Tag color="blue">${formatCurrencyString(value)}</Tag>
    },
    {
      key: "Order_Date",
      title: (
        <div className="table-header">
          <div className="khmer-text">ថ្ងែទីបញ្ជាទិញ</div>
          <div className="english-text">Order Date</div>
        </div>
      ),
      dataIndex: "order_date",
      render: (value) => formatDateClient(value, "DD/MM/YYYY"),
    },
    {
      key: "delivery_date",
      title: (
        <div className="table-header">
          <div className="khmer-text">ថ្ងៃទីប្រគល់ទំនិញ</div>
          <div className="english-text">Delivery Date</div>
        </div>
      ),
      dataIndex: "delivery_date",
      render: (value) => formatDateClient(value, "DD/MM/YYYY"),
    },
    ...(isPermission("customer.update") ? [{
      key: "completed",
      title: (
        <div className="table-header">
          <div className="khmer-text">បានបញ្ចប់</div>
          <div className="english-text">Completed</div>
        </div>
      ),
      render: (_, record, index) => {
        const firstRowOfOrder = list.findIndex(item => item.order_id === record.order_id) === index;

        if (!firstRowOfOrder) {
          return null;
        }

        return (
          <Checkbox
            checked={Boolean(record.is_completed)}
            onChange={(e) => handleOrderCheckboxChange(record.order_id, e.target.checked)}
          />
        );
      },
      width: 100,
    }] : []),
  ];

  return (
    <MainPage loading={loading}>
      <div className="pageHeader">
        <Space>
          <div className={Style.summaryContainer}>
            <div className={Style.summaryCard}>
              <div className={Style.summaryIcon}><FaMoneyBillWave /></div>
              <div className={Style.summaryTitle}>ចំណូលសរុប</div>
              <div className={`${Style.summaryValue} ${Style.summaryPositive}`}>
                ${formatCurrencyString(financeSummary.total_revenue)}
              </div>
            </div>

            <div className={Style.summaryCard}>
              <div className={Style.summaryIcon}><FaGasPump /></div>
              <div className={Style.summaryTitle}>ចំណាយប្រេង</div>
              <div className={`${Style.summaryValue} ${Style.summaryNegative}`}>
                ${formatCurrencyString(financeSummary.oil_expense_total)}
              </div>
            </div>

            <div className={Style.summaryCard}>
              <div className={Style.summaryIcon}><FaChartLine /></div>
              <div className={Style.summaryTitle}>ចំណាយសរុប</div>
              <div className={`${Style.summaryValue} ${Style.summaryNegative}`}>
                ${formatCurrencyString(financeSummary.total_cost)}
              </div>
            </div>

            <div className={Style.summaryCard}>
              <div className={Style.summaryIcon}><FaPiggyBank /></div>
              <div className={Style.summaryTitle}>ចំណេញសរុប</div>
              <div className={`${Style.summaryValue} ${Style.summaryPositive}`}>
                ${formatCurrencyString(financeSummary.total_profit)}
              </div>
            </div>

            <div className={Style.summaryCard}>
              <div className={Style.summaryIcon}><FaPercentage /></div>
              <div className={Style.summaryTitle}>អត្រាចំណេញ</div>
              <div className={`${Style.summaryValue} ${Style.summaryNeutral}`}>
                {financeSummary.profit_margin.toFixed(2)}%
              </div>
            </div>

            <div className={Style.summaryCard}>
              <div className={Style.summaryIcon}><FaFileInvoice /></div>
              <div className={Style.summaryTitle}>ចំនួនវិក័យប័ត្រ</div>
              <div className={`${Style.summaryValue} ${Style.summaryNeutral}`}>
                {financeSummary.total_invoices}
              </div>
            </div>

            {isPermission("customer.update") && (
              <div className={Style.summaryCard}>
                <div className={Style.summaryIcon}>✓</div>
                <div className={Style.summaryTitle}>បានបញ្ចប់</div>
                <div className={`${Style.summaryValue} ${Style.summaryNeutral}`}>
                  {financeSummary.completed_orders} / {financeSummary.total_invoices}
                </div>
              </div>
            )}
          </div>
        </Space>

        <Tooltip title="ជ្រើសរើសរយៈពេលដើម្បីស្វែងរកព័ត៌មាន">
          <Select
            style={{ width: 180 }}
            value={filter.timeRange}
            onChange={(value) => {
              const now = dayjs();
              const from = value === "1_week"
                ? now.startOf("day").subtract(6, "day")
                : now.startOf("day");

              const to = now.endOf("day");

              setFilter((prev) => ({
                ...prev,
                timeRange: value,
                from_date: from,
                to_date: to,
              }));
            }}
            placeholder="ជ្រើសរើសរយៈពេល"
          >
            <Select.Option value="1_day">📅 ថ្ងៃនេះ</Select.Option>
            <Select.Option value="1_week">🗓 ៧ថ្ងៃចុងក្រោយ</Select.Option>
          </Select>
        </Tooltip>
      </div>

      <div>
        <Space wrap>
          <Input.Search
            onChange={(e) => setState((p) => ({ ...p, txtSearch: e.target.value }))}
            allowClear
            onSearch={handleSearch}
            placeholder="Search"
          />
          {isPermission("customer.create") && (
            <DatePicker.RangePicker
              allowClear={false}
              value={[filter.from_date, filter.to_date]}
              format={"DD/MM/YYYY"}
              onChange={(value) => {
                if (value && value.length === 2) {
                  setFilter((prev) => ({
                    ...prev,
                    timeRange: "",
                    from_date: value[0].startOf("day"),
                    to_date: value[1].endOf("day")
                  }));
                }
              }}
            />
          )}

          {/* ✅ NEW: Order Date Filter */}
          {isPermission("customer.create") && (
            <Tooltip title="ជ្រើសរើសថ្ងៃបញ្ជាទិញ">
              <DatePicker
                placeholder="📅 ថ្ងៃបញ្ជាទិញ"
                format={"DD/MM/YYYY"}
                value={filter.order_date}
                onChange={(date) => {
                  setFilter((prev) => ({
                    ...prev,
                    order_date: date,
                    timeRange: "",
                  }));
                }}
                allowClear
                style={{ width: 180 }}
              />
            </Tooltip>
          )}

          {/* ✅ NEW: Delivery Date Filter */}
          {isPermission("customer.create") && (
            <Tooltip title="ជ្រើសរើសថ្ងៃប្រគល់ទំនិញ">
              <DatePicker
                placeholder="🚚 ថ្ងៃប្រគល់ទំនិញ"
                format={"DD/MM/YYYY"}
                value={filter.delivery_date}
                onChange={(date) => {
                  setFilter((prev) => ({
                    ...prev,
                    delivery_date: date,
                    timeRange: "",
                  }));
                }}
                allowClear
                style={{ width: 180 }}
              />
            </Tooltip>
          )}

          {isPermission("customer.create") && (
            <Select
              style={{ width: 300 }}
              allowClear
              placeholder="Select User"
              value={filter.user_id}
              options={
                (config?.user || []).map((user, index) => ({
                  label: `${index + 1}. ${user.label}`,
                  value: user.value,
                }))
              }
              onChange={(value) => {
                setFilter((prev) => ({
                  ...prev,
                  user_id: value,
                }));
              }}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase()) ||
                option?.label?.toLowerCase().includes(input)
              }
              suffixIcon={<LuUserRoundSearch />}
            />
          )}

          <Button type="primary" onClick={handleSearch} icon={<BsSearch />}>
            Filter
          </Button>

          {isPermission("customer.getone") && (
            <Button
              onClick={handleRefreshFromServer}
              danger
              size="small"
            >
              Refresh From Server
            </Button>
          )}
        </Space>
      </div>

      <div className={Style.tableContent}>
        <Table
          dataSource={list}
          columns={columns}
          pagination={false}
          rowKey="id"
          rowClassName={getRowClassName}
          style={{ marginTop: "20px" }}
        />
      </div>
    </MainPage>
  );
}

export default OrderPage;