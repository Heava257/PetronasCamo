import React, { useEffect, useState, useMemo } from "react";
import { Table, Input, Space, message, Button, Typography, Card, Badge, DatePicker, Statistic, Row, Col, Checkbox, Modal } from "antd";
import { EyeOutlined, FilterOutlined } from '@ant-design/icons';
import MainPage from "../../component/layout/MainPage";
import "./product-detail-fix.css";
import { formatDateClient, formatPrice, isPermission, request } from "../../util/helper";
import { getProfile } from "../../store/profile.store";
import { useTranslation } from "../../locales/TranslationContext";
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
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [showAll, dateRange, orderDate, receiveDate]);


  // Custom Empty State Component
  const CustomEmpty = () => (
    <div className="custom-empty-state">
      <div className="empty-icon">📦</div>
      <div className="empty-title khmer-text-product">
        មិនមានទិន្នន័យ
      </div>
      <div className="empty-description">
        សូមជ្រើសរើសកាលបរិច្ឆេទ ឬលុបតម្រងដើម្បីមើលទិន្នន័យ
      </div>
    </div>
  );

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

  const showDetailModal = (record) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  const showFilterModal = () => {
    setIsFilterModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedRecord(null);
  };

  const handleFilterModalClose = () => {
    setIsFilterModalVisible(false);
  };

  // Mobile Card Component
  const MobileCard = ({ record, index }) => {
    const displayName = record.name === "oil" ? "ប្រេងឥន្ធនៈ" : record.name || "N/A";

    return (
      <div
        className={`mb-3 p-4 rounded-lg border ${record.is_completed
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">#{index + 1}</span>
              {isPermission("customer.update") && (
                <Checkbox
                  checked={Boolean(record.is_completed)}
                  onChange={(e) => handleCheckboxChange(record.detail_id, e.target.checked)}
                />
              )}
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white khmer-text-product">
              {displayName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 khmer-text-product">
              {record.customer_name || "N/A"}
            </p>
          </div>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showDetailModal(record)}
            className="text-blue-500 dark:text-blue-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 khmer-text-product">{t("card_number")}</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {record.detail_description || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 khmer-text-product">{t("category_name")}</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white khmer-text-product">
              {record.category_name || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 khmer-text-product">{t("quantity")}</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {parseInt(record.qty || 0).toLocaleString()} {record.unit || ""}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 khmer-text-product">{t("total_price")}</p>
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              {formatPrice(record.corrected_total_price || 0)}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400 khmer-text-product">{t("company")}</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {record.detail_company_name || "N/A"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const columns = [
    {
      key: "No",
      title: <div className="khmer-text1">{t("NO")}</div>,
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
      dataIndex: "product_create_at",
      render: (value) => (
        <div className="date-cell-product">
          {formatDateClient(value, "DD/MM/YYYY h:mm A")}
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
      <div className="product-page-container-product px-2 sm:px-4 lg:px-6">
        <Card className="product-card-product">
          {/* Header */}
          <div className="page-header-container-product mb-4">
            <Typography.Title level={4} className="page-title-product text-lg sm:text-xl lg:text-2xl">
              <span className="khmer-title-product">{t("product_detail_list")}</span>
            </Typography.Title>

            {/* Desktop Filters */}
            <div className="hidden lg:block">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space wrap>
                  <Input.Search
                    placeholder={t("search_products")}
                    allowClear
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="search-input-product w-full sm:w-64"
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

            {/* Mobile Filter Button */}
            <div className="lg:hidden mt-4">
              <Button
                icon={<FilterOutlined />}
                onClick={showFilterModal}
                type="primary"
                block
                size="large"
              >
                {t("filters")}
              </Button>
            </div>
          </div>

          {/* Grand Totals Summary */}
          <Card style={{ marginBottom: 16 }} className="bg-gray-50 dark:bg-gray-800">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={12} md={6}>
                <Statistic
                  title={
                    <div className="khmer-text-product text-xs sm:text-sm">{t("total_quantity")}</div>
                  }
                  value={summaryData.totalQuantity}
                  valueStyle={{
                    color: '#52c41a',
                    fontFamily: 'monospace',
                    fontSize: 'clamp(1rem, 3vw, 1.5rem)'
                  }}
                  formatter={(value) => value.toLocaleString('en-US')}
                />
              </Col>
              <Col xs={12} sm={12} md={6}>
                <Statistic
                  title={
                    <div className="khmer-text-product text-xs sm:text-sm">{t("total_value")}</div>
                  }
                  value={summaryData.totalValue}
                  precision={2}
                  prefix="$"
                  valueStyle={{
                    color: '#f5222d',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    fontSize: 'clamp(1rem, 3vw, 1.5rem)'
                  }}
                  formatter={(value) => value.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                />
              </Col>
              <Col xs={12} sm={12} md={6}>
                <Statistic
                  title={
                    <div className="khmer-text-product text-xs sm:text-sm">{t("total_paid")}</div>
                  }
                  value={summaryData.totalPaid}
                  precision={2}
                  prefix="$"
                  valueStyle={{
                    color: '#1890ff',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    fontSize: 'clamp(1rem, 3vw, 1.5rem)'
                  }}
                  formatter={(value) => value.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                />
              </Col>
              <Col xs={12} sm={12} md={6}>
                <Statistic
                  title={
                    <div className="khmer-text-product text-xs sm:text-sm">{t("remaining_balance")}</div>
                  }
                  value={summaryData.remainingBalance}
                  precision={2}
                  prefix="$"
                  valueStyle={{
                    color: summaryData.remainingBalance > 0 ? '#faad14' : '#52c41a',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    fontSize: 'clamp(1rem, 3vw, 1.5rem)'
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
                      <div className="khmer-text-product text-xs sm:text-sm">{t("completed")}</div>
                    }
                    value={completedCount}
                    suffix={`/ ${filteredData.length}`}
                    valueStyle={{
                      color: '#722ed1',
                      fontFamily: 'monospace',
                      fontSize: 'clamp(1rem, 3vw, 1.5rem)'
                    }}
                  />
                </Col>
              </Row>
            )}
          </Card>

          {/* Category Totals Summary */}
          {Object.keys(categoryTotals).length > 0 && (
            <Card style={{ marginBottom: 16 }} className="dark:bg-gray-800">
              <Typography.Title level={5} className="text-base sm:text-lg">
                <span className="khmer-text-product">{t("category_summary")}</span>
              </Typography.Title>
              <Row gutter={[8, 8]}>
                {Object.entries(categoryTotals).map(([category, totals]) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={category}>
                    <Card
                      size="small"
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 h-full"
                    >
                      <Typography.Text
                        strong
                        className="khmer-text-product text-sm sm:text-base block mb-3"
                      >
                        {category}
                      </Typography.Text>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="khmer-text-product text-xs text-gray-600 dark:text-gray-400">
                            {t("count")}:
                          </span>
                          <Typography.Text type="secondary" className="text-xs">
                            {totals.count} {t("items")}
                          </Typography.Text>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="khmer-text-product text-xs text-gray-600 dark:text-gray-400">
                            {t("quantity")}:
                          </span>
                          <Typography.Text strong className="text-xs">
                            {totals.totalQuantity.toLocaleString('en-US')}
                          </Typography.Text>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
                          <span className="khmer-text-product text-xs text-gray-600 dark:text-gray-400">
                            {t("price")}:
                          </span>
                          <Typography.Text
                            strong
                            className="text-red-600 dark:text-red-400 text-sm"
                            style={{ fontFamily: 'monospace' }}
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

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="detail_id"
              rowClassName={getRowClassName}
              pagination={false}
              loading={loading}
              size="middle"
              scroll={{ x: true }}
              locale={{
                emptyText: <CustomEmpty />  // ⬅️ Add this
              }}
            />
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="space-y-2">
                {filteredData.map((record, index) => (
                  <MobileCard key={record.detail_id} record={record} index={index} />
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Detail Modal for Mobile */}
      <Modal
        title={
          <span className="khmer-text-product text-base sm:text-lg">
            {t("product_details")}
          </span>
        }
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width="95%"
        style={{ maxWidth: '500px', top: 20 }}
      >
        {selectedRecord && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-gray-500 dark:text-gray-400 khmer-text-product mb-1">{t("name")}</p>
                <p className="font-semibold khmer-text-product">
                  {selectedRecord.name === "oil" ? "ប្រេងឥន្ធនៈ" : selectedRecord.name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 khmer-text-product mb-1">{t("company")}</p>
                <p className="font-semibold">{selectedRecord.detail_company_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 khmer-text-product mb-1">{t("customer")}</p>
                <p className="font-semibold khmer-text-product">{selectedRecord.customer_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 khmer-text-product mb-1">{t("card_number")}</p>
                <p className="font-semibold">{selectedRecord.detail_description || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 khmer-text-product mb-1">{t("category_name")}</p>
                <p className="font-semibold khmer-text-product">{selectedRecord.category_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 khmer-text-product mb-1">{t("quantity")}</p>
                <p className="font-semibold">
                  {parseInt(selectedRecord.qty || 0).toLocaleString()} {selectedRecord.unit || ""}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 khmer-text-product mb-1">{t("unit_price")}</p>
                <p className="font-semibold">
                  ${parseFloat(selectedRecord.detail_unit_price || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 khmer-text-product mb-1">{t("total_price")}</p>
                <p className="font-bold text-red-600 dark:text-red-400">
                  {formatPrice(selectedRecord.corrected_total_price || 0)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 khmer-text-product mb-1">{t("status")}</p>
                {selectedRecord.detail_status === 1 ? (
                  <Badge status="success" text={<span className="status-active-product">{t("active")}</span>} />
                ) : (
                  <Badge status="error" text={<span className="status-inactive-product">{t("inactive")}</span>} />
                )}
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 khmer-text-product mb-1">{t("order_date")}</p>
                <p className="font-semibold">
                  {formatDateClient(selectedRecord.detail_created_at, "DD/MM/YYYY")}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 khmer-text-product mb-1">{t("receive_date")}</p>
                <p className="font-semibold">
                  {formatDateClient(selectedRecord.receive_date, "DD/MM/YYYY")}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 khmer-text-product mb-1">{t("created_date")}</p>
                <p className="font-semibold">
                  {formatDateClient(selectedRecord.updated_at, "DD/MM/YYYY h:m A")}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 dark:text-gray-400 khmer-text-product mb-1">{t("created_by")}</p>
                <p className="font-semibold">{selectedRecord.detail_created_by || "N/A"}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Filter Modal for Mobile */}
      <Modal
        title={
          <span className="khmer-text-product text-base sm:text-lg">
            {t("filters")}
          </span>
        }
        open={isFilterModalVisible}
        onCancel={handleFilterModalClose}
        footer={null}
        width="95%"
        style={{ maxWidth: '500px', top: 20 }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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
            style={{ width: '100%' }}
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
            style={{ width: '100%' }}
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
            style={{
              width: '100%',
              backgroundColor: orderDate ? '#e6f7ff' : 'white'
            }}
          />

          <DatePicker
            placeholder={t("receive_date")}
            value={receiveDate}
            onChange={(date) => setReceiveDate(date)}
            format="DD/MM/YYYY"
            inputReadOnly={false}
            size="large"
            style={{
              width: '100%',
              backgroundColor: receiveDate ? '#fff7e6' : 'white'
            }}
          />

          <Button
            onClick={() => {
              handleClearFilters();
              handleFilterModalClose();
            }}
            block
            size="large"
          >
            {t("clear_filters")}
          </Button>

          <Button
            type={showAll ? "primary" : "default"}
            onClick={() => {
              toggleShowAll();
              handleFilterModalClose();
            }}
            block
            size="large"
          >
            {showAll ? t("show_paginated") : t("show_all")}
          </Button>

          {isPermission("customer.getone") && (
            <Button
              onClick={() => {
                handleClearAllCheckboxes();
                handleFilterModalClose();
              }}
              danger
              block
              size="large"
            >
              {t("refresh_from_server")}
            </Button>
          )}
        </Space>
      </Modal>

      <style jsx>{`
        .checked-row {
          background-color: #fef3c7 !important;
        }
        .dark .checked-row {
          background-color: rgba(251, 191, 36, 0.2) !important;
        }
        .even-row {
          background-color: #fafafa;
        }
        .dark .even-row {
          background-color: #1f2937;
        }
        .odd-row {
          background-color: #ffffff;
        }
        .dark .odd-row {
          background-color: #111827;
        }
      `}</style>
    </MainPage>
  );
}

export default ProductDetailPage;