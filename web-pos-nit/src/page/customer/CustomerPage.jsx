
import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  Form,
  Input,
  Select,
  Tooltip,
  Modal,
  Space
} from "antd";
import Swal from "sweetalert2";
import {
  SearchOutlined,
  UserAddOutlined,
  TableOutlined,
  AppstoreOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from "@ant-design/icons";
import { request, isPermission } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import { getProfile } from "../../store/profile.store";
import { configStore } from "../../store/configStore";
import { useTranslation } from "../../locales/TranslationContext";
import dayjs from "dayjs";
import CustomerLocationsModal from "../delivery/CustomerLocationsModal";
import { useSettings } from "../../settings";


import CustomerStats from "./components/CustomerStats";
import CustomerList from "./components/CustomerList";
import CustomerModal from "./components/CustomerModal";

function CustomerPage() {
  const { config } = configStore();
  const { t } = useTranslation();
  const { isDarkMode } = useSettings();
  const [form] = Form.useForm();

  const [assignForm] = Form.useForm();

  // State
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tableContainerRef, setTableContainerRef] = useState(document.body); // Default ref
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [stats, setStats] = useState({ total: 0, male: 0, female: 0, other: 0 });

  // Filter & View Stats
  const [viewMode, setViewMode] = useState("table"); // "table" or "grid"
  const [blockedPermissions, setBlockedPermissions] = useState(() => {
    const saved = localStorage.getItem("blocked_permissions");
    return saved ? JSON.parse(saved) : { delete: [], create: [] };
  });

  const [state, setState] = useState({
    visibleModal: false,
    id: null,
    searchText: "",
    user_id: null,
    isEditing: false,
    visibleAssignModal: false,
    customerTypeFilter: null,
  });

  // Effects
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const profileData = getProfile();
    if (profileData && profileData.id) {
      setProfile(profileData);
      setState((prev) => ({ ...prev, user_id: profileData.id }));
      setPermissionsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (state.user_id) getList();
  }, [state.user_id, state.customerTypeFilter]); // Only reload when filter changes explicitly

  useEffect(() => {
    calculateStats();
  }, [list]);

  const calculateStats = () => {
    const total = list.length;
    const male = list.filter(c => c.gender === 'Male').length;
    const female = list.filter(c => c.gender === 'Female').length;
    const other = total - male - female;
    setStats({ total, male, female, other });
  };

  const getList = async () => {
    if (!state.user_id) return;

    setLoading(true);
    const param = {
      txtSearch: state.searchText || "",
      type: state.customerTypeFilter || "",
    };

    try {
      const res = await request(`customer/my-group`, "get", param);
      if (res?.success) {
        setList(res.list || []);
      } else {
        // Handle error quietly or show simple toast
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onSearch = () => {
    getList();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Fullscreen error:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  // Handlers
  const onClickAddBtn = () => {
    setState((prev) => ({
      ...prev,
      visibleModal: true,
      isEditing: false,
      id: null,
    }));
    form.resetFields();
  };

  const onClickEdit = (record) => {
    const formData = {
      ...record,
      dob: record.dob ? dayjs(record.dob) : undefined
    };

    setState((prev) => ({
      ...prev,
      visibleModal: true,
      isEditing: true,
      id: record.id,
    }));
    form.setFieldsValue(formData);
  };

  const onClickDelete = (record) => {
    Swal.fire({
      title: t("delete_confirm_title"),
      text: t("delete_confirm_text"),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonText: t("cancel"),
      confirmButtonText: t("confirm")
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await request(`customer/${record.id}`, "delete");
        if (res && !res.error) {
          Swal.fire('Deleted!', res.message, 'success');
          getList();
        } else {
          Swal.fire('Error', res.message || "Failed to delete", 'error');
        }
      }
    });
  };

  const onFinishModal = async (values) => {
    if (values.dob) values.dob = values.dob.format('YYYY-MM-DD');

    const { id, isEditing } = state;
    let res;

    if (isEditing) {
      res = await request(`customer/${id}`, "put", values);
    } else {
      res = await request("customer", "post", values);
    }

    if (res && res.success) {
      Swal.fire('Success', isEditing ? t("update_success") : t("create_success"), 'success');
      setState(prev => ({ ...prev, visibleModal: false }));
      getList();
    } else {
      Swal.fire('Error', res?.message || "Operation failed", 'error');
    }
  };

  // Helper for Phone Info
  const getPhoneCarrierInfo = (phoneNumber) => {
    if (!phoneNumber) return { icon: null, color: '#666', carrier: '', bgColor: '#F5F5F5' };
    const phone = phoneNumber.toString().replace(/\s+/g, '');

    if (phone.match(/^(010|015|016|069|070|081|085|086|087|093|096|098)/)) {
      return { logo: 'https://goldzonemedia.com.kh/wp-content/uploads/2023/05/346613115_4921066671351995_2477302429196727443_n-900x550.jpg', color: '#00A651', carrier: 'Smart', bgColor: '#f0fdf4' }; // Green-50 but hex for compatibility
    }
    if (phone.match(/^(011|012|014|017|061|076|077|078|079|089|092)/)) {
      return { logo: 'https://www.khmertimeskh.com/wp-content/uploads/2021/06/cellcard-002.jpg', color: '#0066CC', carrier: 'Cellcard', bgColor: '#eff6ff' }; // Blue-50
    }
    if (phone.match(/^(031|060|066|067|068|071|088|090|097)/)) {
      return { logo: 'https://b2b-cambodia.com/storage/uploads/articles/large/eCD1qa1PSRIqYhK5wLbXbRMDOVnpzNDlaN5QUgdP.png', color: '#E30613', carrier: 'Metfone', bgColor: '#fef2f2' }; // Red-50
    }
    return { logo: null, color: '#666', carrier: 'Other', bgColor: '#F5F5F5' };
  };

  return (
    <MainPage loading={loading}>
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold m-0 dark:text-white">{t("customer_management")}</h1>


        <Space wrap>
          <Input.Search
            placeholder={t("search_by_name")}
            onSearch={onSearch}
            onChange={(e) => setState(prev => ({ ...prev, searchText: e.target.value }))}
            style={{ width: 250 }}
            allowClear
          />

          <Select
            placeholder={t("customer_type")}
            style={{ width: 150 }}
            allowClear
            onChange={(val) => setState(prev => ({ ...prev, customerTypeFilter: val }))}
          >
            <Select.Option value="regular">{t('regular')}</Select.Option>
            <Select.Option value="special">{t('vip')}</Select.Option>
          </Select>

          <div className="bg-gray-100 p-1 rounded-lg flex border border-gray-200">
            <Tooltip title={t("table_view")}>
              <Button
                type={viewMode === 'table' ? 'primary' : 'text'}
                icon={<TableOutlined />}
                size="small"
                onClick={() => setViewMode('table')}
              />
            </Tooltip>
            <Tooltip title={t("grid_view")}>
              <Button
                type={viewMode === 'grid' ? 'primary' : 'text'}
                icon={<AppstoreOutlined />}
                size="small"
                onClick={() => setViewMode('grid')}
              />
            </Tooltip>
          </div>

          <Tooltip title={isFullscreen ? t("exit_fullscreen") : t("enter_fullscreen")}>
            <Button
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
            />
          </Tooltip>

          {isPermission("customer.create") && !blockedPermissions.create.includes(profile?.id) && (
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={onClickAddBtn}
              className="bg-blue-600 hover:bg-blue-700 border-none"
            >
              {t("new_customer")}
            </Button>
          )}
        </Space>
      </div>

      {/* Stats Section */}
      <CustomerStats stats={stats} t={t} />

      {/* List Section */}
      <CustomerList
        list={list}
        loading={loading}
        isPermission={isPermission}
        profile={profile}
        blockedPermissions={blockedPermissions}
        onClickEdit={onClickEdit}
        onClickDelete={onClickDelete}
        setLocationModalVisible={setLocationModalVisible}
        setSelectedCustomer={setSelectedCustomer}
        getPhoneCarrierInfo={getPhoneCarrierInfo}
        t={t}
        viewMode={viewMode}
        isMobile={isMobile}
      />

      {/* Modals */}
      <CustomerModal
        visible={state.visibleModal}
        onCancel={() => setState(prev => ({ ...prev, visibleModal: false }))}
        onFinish={onFinishModal}
        form={form}
        t={t}
        isEditing={state.isEditing}
        phoneValidationRules={[
          { required: true, message: t("required_phone") },
          { pattern: /^[0-9+\-\s()]+$/, message: t("invalid_phone_format") },
          { min: 8, max: 15, message: t("phone_length_8_15") }
        ]}
      />

      <CustomerLocationsModal
        visible={locationModalVisible}
        onClose={() => {
          setLocationModalVisible(false);
          setSelectedCustomer(null);
        }}
        customerId={selectedCustomer?.id}
        customerName={selectedCustomer?.name}
      />

      <style>{`
        /* Dark Mode Overrides for Customer Page */
        .dark .ant-table {
          background: transparent !important;
          color: #e2e8f0 !important;
        }
        .dark .ant-table-thead > tr > th {
          background: #1e293b !important;
          color: #f8fafc !important;
          border-bottom: 1px solid #334155 !important;
        }
        .dark .ant-table-tbody > tr > td {
          background: #0f172a !important;
          color: #cbd5e1 !important;
          border-bottom: 1px solid #1e293b !important;
        }
        .dark .ant-table-tbody > tr:hover > td {
          background: #1e293b !important;
        }

        .dark .ant-card {
          background: #1e293b !important;
          border-color: #334155 !important;
          color: #f8fafc !important;
        }

        .dark .ant-modal-content,
        .dark .ant-modal-header {
          background-color: #1e293b !important;
          color: #f8fafc !important;
          border-bottom-color: #334155 !important;
        }
        .dark .ant-modal-title {
          color: #f8fafc !important;
        }

        /* Form Labels - More Specific for Visibility */
        .dark .ant-form-item-label > label,
        .dark .ant-form-item-label label,
        .customer-modal.dark .ant-form-item-label > label,
        body.dark .ant-form-item-label > label {
          color: #e2e8f0 !important;
          font-weight: 500 !important;
        }
        
        /* Secondary text and hints in dark mode */
        .dark .ant-form-item-extra,
        .dark .ant-typography-secondary,
        .dark .ant-input-textarea-show-count-after {
           color: #94a3b8 !important;
        }

        /* Inputs, Selects, DatePickers */
        .dark .ant-input,
        .dark .ant-input-number,
        .dark .ant-input-number-input,
        .dark .ant-select:not(.ant-select-customize-input) .ant-select-selector,
        .dark .ant-picker {
          background-color: #0f172a !important;
          border-color: #334155 !important;
          color: #ffffff !important;
        }

        .dark .ant-select-arrow,
        .dark .ant-picker-suffix {
          color: #94a3b8 !important;
        }

        /* Table Summary/Footer in Dark Mode */
        .dark .ant-table-summary {
          background-color: #1e293b !important;
        }

        /* Pagination */
        .dark .ant-pagination-item a {
          color: #e2e8f0 !important;
        }
        .dark .ant-pagination-item-active {
          background: #334155 !important;
          border-color: #475569 !important;
        }
        .dark .ant-pagination-prev .ant-pagination-item-link,
        .dark .ant-pagination-next .ant-pagination-item-link {
          background: #1e293b !important;
          color: #e2e8f0 !important;
          border-color: #334155 !important;
        }

        /* Adjust placeholder colors */
        .dark .ant-input::placeholder,
        .dark .ant-select-selection-placeholder,
        .dark .ant-input-search .ant-input::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
        }

        
        /* Autofill override */
        .dark input:-webkit-autofill {
            -webkit-box-shadow: 0 0 0 30px #0f172a inset !important;
            -webkit-text-fill-color: white !important;
        }
      `}</style>
    </MainPage>
  );
}

export default CustomerPage;