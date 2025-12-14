import React, { useEffect, useState, useMemo } from "react";
import { Table, Input, Space, message, Button, Typography, Card, Badge, DatePicker, Statistic, Row, Col, Checkbox } from "antd";
import MainPage from "../../component/layout/MainPage";
import { formatDateClient, formatPrice, isPermission, request } from "../../util/helper";
import { getProfile } from "../../store/profile.store";
import "./product_detail.css";
import dayjs from "dayjs";

const checkboxStateStore = {
  states: new Map(),
  setState(detailId, isCompleted) {
    this.states.set(detailId, isCompleted);
  },
  getState(detailId) {
    return this.states.get(detailId);
  },
  hasState(detailId) {
    return this.states.has(detailId);
  },
  clearStates() {
    this.states.clear();
  }
};

function ProductDetailPage() {
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summaryData, setSummaryData] = useState({
    totalValue: 0,
    totalPaid: 0,
    totalQuantity: 0,
    remainingBalance: 0
  });
  const [dateRange, setDateRange] = useState([
    dayjs(),
    dayjs(),
  ]);
  const [orderDate, setOrderDate] = useState(null);
  const [receiveDate, setReceiveDate] = useState(null);
  const [paginationConfig, setPaginationConfig] = useState({
    current: 1,
    pageSize: 10,
  });

  useEffect(() => {
    fetchProductDetails();
  }, [showAll, dateRange, orderDate, receiveDate]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const { id } = getProfile();
      if (!id) {
        return;
      }

      let queryParams = [];

      if (showAll) {
        queryParams.push("is_list_all=true");
      }

     if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      // ✅ ប្រើ startOf('day') សម្រាប់ from_date
      const fromDate = dayjs(dateRange[0]).startOf('day').format("YYYY-MM-DD");
      // ✅ ប្រើ endOf('day') សម្រាប់ to_date ដើម្បីរួមបញ្ចូលថ្ងៃទាំងមូល
      const toDate = dayjs(dateRange[1]).endOf('day').format("YYYY-MM-DD");
      queryParams.push(`from_date=${fromDate}`);
      queryParams.push(`to_date=${toDate}`);
    }

    if (orderDate) {
      const orderDateStr = dayjs(orderDate).startOf('day').format("YYYY-MM-DD");
      queryParams.push(`order_date=${orderDateStr}`);
    }

      if (receiveDate) {
      const receiveDateStr = dayjs(receiveDate).startOf('day').format("YYYY-MM-DD");
      queryParams.push(`receive_date=${receiveDateStr}`);
    }
   const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
    const res = await request(`product_detail/my-group${queryString}`, 'get');

      if (res?.success) {
        const mergedData = (res.data || []).map(item => {
          const hasLocalState = checkboxStateStore.hasState(item.detail_id);
          const localState = checkboxStateStore.getState(item.detail_id);

          return {
            ...item,
            is_completed: hasLocalState ? localState : Boolean(item.is_completed)
          };
        });

        setData(mergedData);
        setTotalRecords(res.total || 0);

        // ✅ ទទួល summary data ពី backend
        if (res.summary) {
          setSummaryData({
            totalValue: parseFloat(res.summary.totalValue || 0),
            totalPaid: parseFloat(res.summary.totalPaid || 0),
            totalQuantity: parseInt(res.summary.totalQuantity || 0),
            remainingBalance: parseFloat(res.summary.remainingBalance || 0)
          });
        }

        checkboxStateStore.clearStates();
      }
    } catch (error) {
      message.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    setPaginationConfig(pagination);

    if (!showAll) {
      fetchProductDetailsForPage(pagination.current);
    }
  };

  const fetchProductDetailsForPage = async (page) => {
    setLoading(true);
    try {
      const { id } = getProfile();
      if (!id) {
        return;
      }

      let queryParams = [`page=${page}`];

      if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
        const fromDate = dayjs(dateRange[0]).format("YYYY-MM-DD");
        const toDate = dayjs(dateRange[1]).format("YYYY-MM-DD");
        queryParams.push(`from_date=${fromDate}`);
        queryParams.push(`to_date=${toDate}`);
      }

      if (orderDate) {
        const orderDateStr = dayjs(orderDate).startOf('day').format("YYYY-MM-DD");
        queryParams.push(`order_date=${orderDateStr}`);
      }

      if (receiveDate) {
        const receiveDateStr = dayjs(receiveDate).startOf('day').format("YYYY-MM-DD");
        queryParams.push(`receive_date=${receiveDateStr}`);
      }

      const queryString = queryParams.join("&");
      const res = await request(`product_detail/my-group?${queryString}`, 'get');

      if (res?.success) {
        const mergedData = (res.data || []).map(item => {
          const hasLocalState = checkboxStateStore.hasState(item.detail_id);
          const localState = checkboxStateStore.getState(item.detail_id);

          return {
            ...item,
            is_completed: hasLocalState ? localState : Boolean(item.is_completed)
          };
        });

        setData(mergedData);
        setTotalRecords(res.total || 0);

        // ✅ ទទួល summary data ពី backend
        if (res.summary) {
          setSummaryData({
            totalValue: parseFloat(res.summary.totalValue || 0),
            totalPaid: parseFloat(res.summary.totalPaid || 0),
            totalQuantity: parseInt(res.summary.totalQuantity || 0),
            remainingBalance: parseFloat(res.summary.remainingBalance || 0)
          });
        }

        checkboxStateStore.clearStates();
      }
    } catch (error) {
      message.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const handleCheckboxChange = async (recordId, checked) => {
    try {
      checkboxStateStore.setState(recordId, checked);

      setData(prevData =>
        prevData.map(item =>
          item.detail_id === recordId
            ? { ...item, is_completed: checked }
            : item
        )
      );

      const response = await request('product_detail/update-completion', 'POST', {
        detail_id: recordId,
        is_completed: checked
      });

      if (!response?.success) {
        checkboxStateStore.setState(recordId, !checked);
        setData(prevData =>
          prevData.map(item =>
            item.detail_id === recordId
              ? { ...item, is_completed: !checked }
              : item
          )
        );
        message.error('Failed to update completion status');
      } else {
        message.success(checked ? 'Marked as completed' : 'Marked as incomplete');
      }
    } catch (error) {
      console.error('Checkbox update error:', error);
      checkboxStateStore.setState(recordId, !checked);
      setData(prevData =>
        prevData.map(item =>
          item.detail_id === recordId
            ? { ...item, is_completed: !checked }
            : item
        )
      );
      message.error('Failed to update completion status');
    }
  };

  const filteredData = data
    .map((item) => {
      const actualPrice = parseFloat(item.actual_price || 0);
      let correctedTotalPrice = 0;

      if (actualPrice !== 0 && !isNaN(actualPrice)) {
        correctedTotalPrice =
          (parseFloat(item.qty || 0) * parseFloat(item.detail_unit_price || 0)) / actualPrice;
      }

      return {
        ...item,
        corrected_total_price: isFinite(correctedTotalPrice) ? correctedTotalPrice : 0,
      };
    })
    .sort((a, b) => {
      const cardA = parseInt(a.detail_description) || 0;
      const cardB = parseInt(b.detail_description) || 0;
      return cardA - cardB;
    });
  const categoryTotals = useMemo(() => {
    const totals = {};

    filteredData.forEach(item => {
      const category = item.category_name || 'N/A';
      const qty = parseInt(item.qty || 0);

      // Ensure we're calculating the corrected price correctly
      const unitPrice = parseFloat(item.detail_unit_price || 0);
      const actualPrice = parseFloat(item.actual_price || 0);

      // Skip items with invalid actual_price to avoid division by zero
      if (actualPrice === 0 || isNaN(actualPrice)) {
        console.warn(`Invalid actual_price for item:`, item);
        return; // Skip this item
      }

      const totalPrice = (qty * unitPrice) / actualPrice;

      // Additional check for Infinity or NaN
      if (!isFinite(totalPrice)) {
        console.warn(`Invalid totalPrice calculated for item:`, item);
        return; // Skip this item
      }

      if (!totals[category]) {
        totals[category] = {
          totalQuantity: 0,
          totalValue: 0,
          count: 0
        };
      }

      totals[category].totalQuantity += qty;
      totals[category].totalValue += totalPrice;
      totals[category].count += 1;
    });

    return totals;
  }, [filteredData]);

  const completedCount = useMemo(() => {
    return filteredData.filter(item => item.is_completed).length;
  }, [filteredData]);

  const toggleShowAll = () => {
    const newShowAll = !showAll;
    setShowAll(newShowAll);
  };

  const handleClearFilters = () => {
    setDateRange(null);
    setSearchText("");
    setOrderDate(null);
    setReceiveDate(null);
    fetchProductDetails();
  };

  const handleClearAllCheckboxes = () => {
    checkboxStateStore.clearStates();
    fetchProductDetails();
    message.info('Refreshed checkbox states from server');
  };

  const getRowClassName = (record, index) => {
    const baseClass = index % 2 === 0 ? 'even-row' : 'odd-row';
    const isChecked = record.is_completed;
    return isChecked ? `${baseClass} checked-row` : baseClass;
  };

  const columns = [
     
    {
      key: "No",
      title: <div className="khmer-text1">ល.រ</div>,
      render: (text, record, index) => index + 1,
      width: 60,
    },
    {
      key: "name",
      title: (
        <div className="column-header-product">
          <div className="khmer-text-product">ឈ្មោះ</div>
          <div className="english-text-product1">Name</div>
        </div>
      ),
      dataIndex: "name",
      render: (text) => {
        const displayText = text === "oil" ? "ប្រេងឥន្ធនៈ" : text || "N/A";
        return (
          <span className="custom-cell-text khmer-text-product">
            {displayText}
          </span>
        );
      },
      width: 150,
    },
    {
      title: (
        <div className="column-header-product">
          <div className="khmer-text-product">ក្រុមហ៊ុន</div>
          <div className="english-text-product">Company</div>
        </div>
      ),
      dataIndex: "detail_company_name",
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
        <div className="column-header-product">
          <div className="khmer-text-product">អតិថិជន</div>
          <div className="english-text-product">Customer</div>
        </div>
      ),
      dataIndex: "customer_name",
      render: (name) => (
        <span className="custom-cell-text khmer-text-product">
          {name || "N/A"}
        </span>
      ),
      width: 150,
    },
    {
      title: (
        <div className="column-header-product">
          <div className="khmer-text-product">លេខប័ណ្ណ</div>
          <div className="english-text-product">Card Number</div>
        </div>
      ),
      dataIndex: "detail_description",
      key: "detail_description",
      render: (cardNumber) => (
        <span className="custom-cell-text card-number-product">
          {cardNumber || "N/A"}
        </span>
      ),
      width: 120,
    },
    {
      title: (
        <div className="column-header-product">
          <div className="khmer-text-product">ប្រភេទ</div>
          <div className="english-text-product">Category</div>
        </div>
      ),
      dataIndex: "category_name",
      key: "category",
      render: (category) => (
        <span className="custom-cell-text khmer-text-product">
          {category || "N/A"}
        </span>
      ),
      width: 150,
    },
    {
      key: "qty",
      title: (
        <div className="column-header-product">
          <div className="khmer-text-product">បរិមាណ</div>
          <div className="english-text-product">Quantity</div>
        </div>
      ),
      dataIndex: "qty",
      render: (value) => (
        <span className="custom-cell-text">
          {parseInt(value || 0).toLocaleString()}
        </span>
      ),
      width: 100,
    },
    {
      key: "unit",
      title: (
        <div className="column-header-product">
          <div className="khmer-text-product">ឯកតា</div>
          <div className="english-text-product">Unit</div>
        </div>
      ),
      dataIndex: "unit",
      render: (unit) => (
        <span className="custom-cell-text">
          {unit || "N/A"}
        </span>
      ),
      width: 100,
    },
    {
      title: (
        <div className="column-header-product">
          <div className="khmer-text-product">តម្លៃឯកតា</div>
          <div className="english-text-product">Unit Price</div>
        </div>
      ),
      dataIndex: "detail_unit_price",
      key: "unit_price",
      render: (price) => (
        <div className="price-cell-product">
          {price !== null ? `$${parseFloat(price).toFixed(2)}` : "N/A"}
        </div>
      ),
      width: 120,
    },
    {
      key: "corrected_total_price",
      title: (
        <div className="column-header-product">
          <div className="khmer-text-product">តម្លៃសរុប</div>
          <div className="english-text-product">Total Price</div>
        </div>
      ),
      dataIndex: "corrected_total_price",
      render: (price) => (
        <div className="price-cell-product">
          {formatPrice(price || 0)}
        </div>
      ),
      width: 120,
    },
    {
      title: (
        <div className="column-header-product">
          <div className="khmer-text-product">ស្ថានភាព</div>
          <div className="english-text-product">Status</div>
        </div>
      ),
      dataIndex: "detail_status",
      key: "status",
      render: (status) =>
        status === 1 ? (
          <Badge status="success" text={<span className="status-active-product">Active</span>} />
        ) : (
          <Badge status="error" text={<span className="status-inactive-product">Inactive</span>} />
        ),
      width: 100,
    },
    {
      key: "detail_created_at",
      title: (
        <div className="column-header-product">
          <div className="khmer-text-product">ថ្ងែទីបញ្ចាទិញ</div>
          <div className="english-text-product">Order date</div>
        </div>
      ),
      dataIndex: "detail_created_at",
      render: (value) => (
        <div className="date-cell-product">
          {formatDateClient(value, "DD/MM/YYYY ")}
        </div>
      ),
      width: 150,
    },
    {
      key: "detail_receive_date",
      title: (
        <div className="column-header-product">
          <div className="khmer-text-product">ថ្ងៃទទួលទំនិញ</div>
          <div className="english-text-product">Receive Date</div>
        </div>
      ),
      dataIndex: "receive_date",
      render: (value) => (
        <div className="date-cell-product">
          {formatDateClient(value, "DD/MM/YYYY")}
        </div>
      ),
      width: 150,
    },
    {
      key: "updated_at",
      title: (
        <div className="column-header-product">
          <div className="khmer-text-product">ថ្ងៃបង្កើត</div>
          <div className="english-text-product">Create Date</div>
        </div>
      ),
      dataIndex: "updated_at",
      render: (value) => (
        <div className="date-cell-product">
          {formatDateClient(value, "DD/MM/YYYY h:m A")}
        </div>
      ),
      width: 150,
    },
    {
      key: "detail_created_by",
      title: (
        <div className="column-header-product">
          <div className="khmer-text-product">បង្កើតដោយ</div>
          <div className="english-text-product">Created By</div>
        </div>
      ),
      dataIndex: "detail_created_by",
      render: (user) => (
        <div className="user-cell-product">{user || "N/A"}</div>
      ),
      width: 120,
    },
    ...(isPermission("customer.update") ? [{
      key: "completed",
      title: (
        <div className="column-header-product">
          <div className="khmer-text-product">បានបញ្ចប់</div>
          <div className="english-text-product">Completed</div>
        </div>
      ),
      render: (_, record) => (
        <Checkbox
          checked={Boolean(record.is_completed)}
          onChange={(e) =>
            handleCheckboxChange(record.detail_id, e.target.checked)
          }
        />
      ),
      width: 100,
    }] : [])
  ];

  return (
    <MainPage loading={loading}>
      <div className="product-page-container-product">
        <Card className="product-card-product">
          <div className="page-header-container-product">
            <Typography.Title level={4} className="page-title-product">
              <span className="khmer-title-product">តារាងព័ត៌មានលម្អិតផលិតផល</span>
              <span className="english-text-product">Product Details</span>
            </Typography.Title>

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space wrap>
                <Input.Search
                  placeholder="Search products..."
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="search-input-product"
                  size="large"
                />

                <DatePicker
                  placeholder="From Date (Update Date)"
                  value={dateRange && dateRange[0] ? dayjs(dateRange[0]) : null}
                  onChange={(date) => {
                    if (date) {
                      const newFromDate = dayjs(date).startOf('day');
                      setDateRange([newFromDate, dateRange && dateRange[1] ? dayjs(dateRange[1]) : null]);
                    } else {
                      setDateRange([null, dateRange && dateRange[1] ? dayjs(dateRange[1]) : null]);
                    }
                  }}
                  format="DD/MM/YYYY"
                  inputReadOnly={false}
                  size="large"
                  disabledDate={(current) => {
                    return current && current > dayjs().endOf('day');
                  }}
                />
                <DatePicker
                  placeholder="To Date (Update Date)"
                  value={dateRange && dateRange[1] ? dayjs(dateRange[1]) : null}
                  onChange={(date) => {
                    if (date) {
                      const newToDate = dayjs(date).endOf('day');
                      setDateRange([dateRange && dateRange[0] ? dayjs(dateRange[0]) : null, newToDate]);
                    } else {
                      setDateRange([dateRange && dateRange[0] ? dayjs(dateRange[0]) : null, null]);
                    }
                  }}
                  format="DD/MM/YYYY"
                  inputReadOnly={false}
                  size="large"
                  disabledDate={(current) => {
                    return dateRange && dateRange[0] && current && current < dayjs(dateRange[0]).startOf('day');
                  }}
                />

                <DatePicker
                  placeholder="Order Date"
                  value={orderDate}
                  onChange={(date) => setOrderDate(date)}
                  format="DD/MM/YYYY"
                  inputReadOnly={false}
                  size="large"
                  style={{ backgroundColor: orderDate ? '#e6f7ff' : 'white' }}
                />

                <DatePicker
                  placeholder="Receive Date"
                  value={receiveDate}
                  onChange={(date) => setReceiveDate(date)}
                  format="DD/MM/YYYY"
                  inputReadOnly={false}
                  size="large"
                  style={{ backgroundColor: receiveDate ? '#fff7e6' : 'white' }}
                />

                <Button onClick={handleClearFilters}>
                  Clear Filters
                </Button>
                <Button
                  type={showAll ? "primary" : "default"}
                  onClick={toggleShowAll}
                >
                  {showAll ? "Show Paginated" : "Show All"}
                </Button>

                {isPermission("customer.getone") && (
                  <Button
                    onClick={handleClearAllCheckboxes}
                    danger
                    size="small"
                  >
                    Refresh From Server
                  </Button>
                )}
              </Space>
            </Space>
          </div>

          {/* Grand Totals Summary - ប្រើ data ពី backend */}
          <Card style={{ marginBottom: 16, backgroundColor: '#f8f9fa' }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title={
                    <div>
                      <div className="khmer-text-product">បរិមាណសរុប</div>
                      <div className="english-text-product">Total Quantity</div>
                    </div>
                  }
                  value={summaryData.totalQuantity}
                  valueStyle={{
                    color: '#52c41a',
                    fontFamily: 'monospace'
                  }}
                  formatter={(value) => value.toLocaleString('en-US')}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={
                    <div>
                      <div className="khmer-text-product">តម្លៃសរុប</div>
                      <div className="english-text-product">Total Value</div>
                    </div>
                  }
                  value={summaryData.totalValue}
                  precision={2}
                  prefix="$"
                  valueStyle={{
                    color: '#f5222d',
                    fontFamily: 'monospace',
                    fontWeight: 600
                  }}
                  formatter={(value) => value.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={
                    <div>
                      <div className="khmer-text-product">បានបង់</div>
                      <div className="english-text-product">Total Paid</div>
                    </div>
                  }
                  value={summaryData.totalPaid}
                  precision={2}
                  prefix="$"
                  valueStyle={{
                    color: '#1890ff',
                    fontFamily: 'monospace',
                    fontWeight: 600
                  }}
                  formatter={(value) => value.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={
                    <div>
                      <div className="khmer-text-product">នៅសល់</div>
                      <div className="english-text-product">Remaining Balance</div>
                    </div>
                  }
                  value={summaryData.remainingBalance}
                  precision={2}
                  prefix="$"
                  valueStyle={{
                    color: summaryData.remainingBalance > 0 ? '#faad14' : '#52c41a',
                    fontFamily: 'monospace',
                    fontWeight: 600
                  }}
                  formatter={(value) => value.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                />
              </Col>
            </Row>
            {isPermission("customer.update") && (
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={24}>
                  <Statistic
                    title={
                      <div>
                        <div className="khmer-text-product">បានបញ្ចប់</div>
                        <div className="english-text-product">Completed Items</div>
                      </div>
                    }
                    value={completedCount}
                    suffix={`/ ${filteredData.length}`}
                    valueStyle={{
                      color: '#722ed1',
                      fontFamily: 'monospace'
                    }}
                  />
                </Col>
              </Row>
            )}
          </Card>

          {/* Category Totals Summary */}
          {Object.keys(categoryTotals).length > 0 && (
            <Card style={{ marginBottom: 16 }}>
              <Typography.Title level={5}>
                <span className="khmer-text-product">សរុបតាមប្រភេទ</span>
                <span className="english-text-product"> - Category Summary</span>
              </Typography.Title>
              <Row gutter={16}>
                {Object.entries(categoryTotals).map(([category, totals]) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={category} style={{ marginBottom: 16 }}>
                    <Card
                      size="small"
                      style={{
                        backgroundColor: '#fafafa',
                        border: '1px solid #e8e8e8',
                        height: '100%'
                      }}
                    >
                      <Typography.Text
                        strong
                        className="khmer-text-product"
                        style={{
                          fontSize: '15px',
                          display: 'block',
                          marginBottom: 12,
                          wordBreak: 'break-word'
                        }}
                      >
                        {category}
                      </Typography.Text>
                      <div style={{ marginTop: 8 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '4px 0'
                        }}>
                          <span className="khmer-text-product" style={{ color: '#666' }}>
                            ចំនួន:
                          </span>
                          <Typography.Text type="secondary">
                            {totals.count} items
                          </Typography.Text>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '4px 0'
                        }}>
                          <span className="khmer-text-product" style={{ color: '#666' }}>
                            បរិមាណ:
                          </span>
                          <Typography.Text strong>
                            {totals.totalQuantity.toLocaleString('en-US')}
                          </Typography.Text>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '4px 0',
                          borderTop: '1px solid #e8e8e8',
                          marginTop: 4,
                          paddingTop: 8
                        }}>
                          <span className="khmer-text-product" style={{ color: '#666' }}>
                            តម្លៃ:
                          </span>
                          <Typography.Text
                            strong
                            style={{
                              color: '#f5222d',
                              fontSize: '15px',
                              fontFamily: 'monospace'
                            }}
                          >
                            ${totals.totalValue.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </Typography.Text>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          )}

          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="detail_id"
            rowClassName={getRowClassName}
            pagination={false}
            loading={loading}
            size="middle"
            scroll={true}
          />

        </Card>
      </div>
    </MainPage>
  );
}

export default ProductDetailPage;