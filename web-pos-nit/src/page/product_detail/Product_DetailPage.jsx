import React, { useEffect, useState, useMemo } from "react";
import { Table, Input, Space, message, Button, Typography, Card, Badge, DatePicker, Statistic, Row, Col, Checkbox } from "antd";
import MainPage from "../../component/layout/MainPage";
import { formatDateClient, formatPrice, isPermission, request } from "../../util/helper";
import { getProfile } from "../../store/profile.store";
import { useTranslation } from "../../locales/TranslationContext";
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
  const { t } = useTranslation();
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
      const fromDate = dayjs(dateRange[0]).startOf('day').format("YYYY-MM-DD");
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
      message.error(t("failed_load_product_details"));
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
      message.error(t("failed_load_product_details"));
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
        message.error(t("failed_update_status"));
      } else {
        message.success(checked ? t("marked_completed") : t("marked_incomplete"));
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
      message.error(t("failed_update_status"));
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

      const unitPrice = parseFloat(item.detail_unit_price || 0);
      const actualPrice = parseFloat(item.actual_price || 0);

      if (actualPrice === 0 || isNaN(actualPrice)) {
        console.warn(`Invalid actual_price for item:`, item);
        return;
      }

      const totalPrice = (qty * unitPrice) / actualPrice;

      if (!isFinite(totalPrice)) {
        console.warn(`Invalid totalPrice calculated for item:`, item);
        return;
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
    message.info(t("refreshed_from_server"));
  };

  const getRowClassName = (record, index) => {
    const baseClass = index % 2 === 0 ? 'even-row' : 'odd-row';
    const isChecked = record.is_completed;
    return isChecked ? `${baseClass} checked-row` : baseClass;
  };

  const columns = [
   
    {
      key: "No",
      title: <div className="khmer-text1">{t("no")}</div>,
      render: (text, record, index) => index + 1,
      width: 60,
    },
    {
      key: "name",
      title: (
        <div className="column-header-product">
          <div className="khmer-text-product">{t("name")}</div>
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
          <div className="khmer-text-product">{t("company")}</div>
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
          <div className="khmer-text-product">{t("customer")}</div>
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
          <div className="khmer-text-product">{t("card_number")}</div>
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
          <div className="khmer-text-product">{t("category_name")}</div>
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
          <div className="khmer-text-product">{t("quantity")}</div>
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
          <div className="khmer-text-product">{t("unit")}</div>
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
          <div className="khmer-text-product">{t("unit_price")}</div>
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
          <div className="khmer-text-product">{t("total_price")}</div>
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
          <div className="khmer-text-product">{t("status")}</div>
        </div>
      ),
      dataIndex: "detail_status",
      key: "status",
      render: (status) =>
        status === 1 ? (
          <Badge status="success" text={<span className="status-active-product">{t("active")}</span>} />
        ) : (
          <Badge status="error" text={<span className="status-inactive-product">{t("inactive")}</span>} />
        ),
      width: 100,
    },
    {
      key: "detail_created_at",
      title: (
        <div className="column-header-product">
          <div className="khmer-text-product">{t("order_date")}</div>
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
          <div className="khmer-text-product">{t("receive_date")}</div>
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
          <div className="khmer-text-product">{t("created_date")}</div>
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
          <div className="khmer-text-product">{t("created_by")}</div>
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
          <div className="khmer-text-product">{t("completed")}</div>
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
              <span className="khmer-title-product">{t("product_details_table")}</span>
            </Typography.Title>

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space wrap>
                <Input.Search
                  placeholder={t("search_products")}
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="search-input-product"
                  size="large"
                />

                <DatePicker
                  placeholder={t("from_date_update")}
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
                  placeholder={t("to_date_update")}
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
                  placeholder={t("order_date")}
                  value={orderDate}
                  onChange={(date) => setOrderDate(date)}
                  format="DD/MM/YYYY"
                  inputReadOnly={false}
                  size="large"
                  style={{ backgroundColor: orderDate ? '#e6f7ff' : 'white' }}
                />

                <DatePicker
                  placeholder={t("receive_date")}
                  value={receiveDate}
                  onChange={(date) => setReceiveDate(date)}
                  format="DD/MM/YYYY"
                  inputReadOnly={false}
                  size="large"
                  style={{ backgroundColor: receiveDate ? '#fff7e6' : 'white' }}
                />

                <Button onClick={handleClearFilters}>
                  {t("clear_filters")}
                </Button>
                <Button
                  type={showAll ? "primary" : "default"}
                  onClick={toggleShowAll}
                >
                  {showAll ? t("show_paginated") : t("show_all")}
                </Button>

                {isPermission("customer.getone") && (
                  <Button
                    onClick={handleClearAllCheckboxes}
                    danger
                    size="small"
                  >
                    {t("refresh_from_server")}
                  </Button>
                )}
              </Space>
            </Space>
          </div>

          {/* Grand Totals Summary */}
          <Card style={{ marginBottom: 16, backgroundColor: '#f8f9fa' }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title={
                    <div>
                      <div className="khmer-text-product">{t("total_quantity")}</div>
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
                      <div className="khmer-text-product">{t("total_value")}</div>
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
                      <div className="khmer-text-product">{t("total_paid")}</div>
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
                      <div className="khmer-text-product">{t("remaining_balance")}</div>
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
                        <div className="khmer-text-product">{t("completed_items")}</div>
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
                <span className="khmer-text-product">{t("category_summary")}</span>
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
                            {t("count")}:
                          </span>
                          <Typography.Text type="secondary">
                            {totals.count} {t("items")}
                          </Typography.Text>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '4px 0'
                        }}>
                          <span className="khmer-text-product" style={{ color: '#666' }}>
                            {t("quantity")}:
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
                            {t("price")}:
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