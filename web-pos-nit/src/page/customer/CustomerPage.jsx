import React, { useEffect, useState } from "react";
import {
  Button,
  Col,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  DatePicker,
  Checkbox,
  Tooltip,
} from "antd";
import { CiSearch } from "react-icons/ci";
import { MdOutlineCreateNewFolder, MdSecurity, MdDelete, MdEdit, MdFullscreen, MdFullscreenExit, MdLocationOn, MdFormatListBulleted, MdGridView } from "react-icons/md";
import { IoPersonAddSharp } from "react-icons/io5";
import { LuUserRoundSearch } from "react-icons/lu";
import { FiPhone, FiMail } from "react-icons/fi";
import { AiOutlineZoomIn, AiOutlineZoomOut } from "react-icons/ai";
import { TbZoomReset } from "react-icons/tb";
import { formatDateClient, isPermission, request } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import { getProfile } from "../../store/profile.store";
import { configStore } from "../../store/configStore";
import { useTranslation } from "../../locales/TranslationContext";
import dayjs from "dayjs";
import "./customer.css"
import CustomerLocationsModal from "../delivery/CustomerLocationsModal";

function CustomerPage() {
  const { config } = configStore();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [profile, setProfile] = useState(null);
  const [deletePermissionModalVisible, setDeletePermissionModalVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tableContainerRef, setTableContainerRef] = useState(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("customer_font_size");
    return saved ? parseInt(saved) : 100;
  });

  const [filteredList, setFilteredList] = useState([]);
  const [blockedUserIds, setBlockedUserIds] = useState(() => {
    const saved = localStorage.getItem("blocked_user_ids");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedPermissionType, setSelectedPermissionType] = useState("delete");
  const [blockedPermissions, setBlockedPermissions] = useState(() => {
    const saved = localStorage.getItem("blocked_permissions");
    return saved ? JSON.parse(saved) : { delete: [], create: [] };
  });

  const [state, setState] = useState({
    visibleModal: false,
    id: null,
    txtSearch: "",
    user_id: null,
    isEditing: false,
    visibleAssignModal: false,
    customerTypeFilter: null,
    viewMode: "table", // "table" or "grid"
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const profileData = getProfile();
    if (profileData && profileData.id) {
      setProfile(profileData);
      setState((prev) => ({ ...prev, user_id: profileData.id }));
      setPermissionsLoaded(true);
    } else {
      message.error(t("មិនមានលេខសម្គាល់អ្នកប្រើប្រាស់។ សូមចូលម្តងទៀត។"));
    }
  }, [t]);

  useEffect(() => {
    if (state.user_id) {
      getList();
    }
  }, [state.user_id]);

  useEffect(() => {
    if (state.customerTypeFilter) {
      const filtered = list.filter(item => item.type === state.customerTypeFilter);
      setFilteredList(filtered);
    } else {
      setFilteredList(list);
    }
  }, [list, state.customerTypeFilter]);

  useEffect(() => {
    const saved = localStorage.getItem("blocked_user_ids");
    if (saved) {
      setBlockedUserIds(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("blocked_permissions");
    if (saved) {
      setBlockedPermissions(JSON.parse(saved));
    }
  }, []);

  const handleCheckboxChange = (checkedValues) => {
    const updated = {
      ...blockedPermissions,
      [selectedPermissionType]: checkedValues
    };
    setBlockedPermissions(updated);
    localStorage.setItem("blocked_permissions", JSON.stringify(updated));
  };

  const onChangeBlockedUsers = (checkedValues) => {
    setBlockedUserIds(checkedValues);
    localStorage.setItem("blocked_user_ids", JSON.stringify(checkedValues));
  };

  const getList = async () => {
    if (!state.user_id) {
      message.error(t("តម្រូវឱ្យមានលេខសម្គាល់អ្នកប្រើប្រាស់!"));
      return;
    }
    const param = {
      txtSearch: state.txtSearch || "",
      type: state.customerTypeFilter || "",
    };
    try {
      setLoading(true);
      const { id } = getProfile();
      if (!id) return;
      const res = await request(`customer/my-group`, "get", param);
      setLoading(false);
      if (res?.success) {
        // Sort by ID ascending (smallest to largest)
        const sortedList = (res.list || []).sort((a, b) => a.id - b.id);
        setList(sortedList);
      } else {
        message.error(res?.message || t("Failed to fetch customer list"));
      }
    } catch (error) {
      setLoading(false);
      console.error("Error fetching customer list:", error);
      message.error(t("Failed to fetch customer list"));
    }
  };

  const toggleFullscreen = () => {
    if (!tableContainerRef) return;

    if (!document.fullscreenElement) {
      tableContainerRef.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Fullscreen error:', err);
        message.error(t("Cannot enter fullscreen"));
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle font size changes
  useEffect(() => {
    document.documentElement.style.setProperty('--customer-font-scale', `${fontSize}%`);
    localStorage.setItem("customer_font_size", fontSize.toString());
  }, [fontSize]);

  const increaseFontSize = () => {
    if (fontSize < 150) {
      setFontSize(prev => Math.min(prev + 10, 150));
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 70) {
      setFontSize(prev => Math.max(prev - 10, 70));
    }
  };

  const resetFontSize = () => {
    setFontSize(100);
  };

  const onClickAddBtn = () => {
    setState((prev) => ({
      ...prev,
      visibleModal: true,
      isEditing: false,
      id: null,
    }));
    form.resetFields();
  };

  const phoneValidationRules = [
    { required: true, message: t("តម្រូវឱ្យមានលេខទូរស័ព្ទ") },
    {
      pattern: /^[0-9+\-\s()]+$/,
      message: t("លេខទូរស័ព្ទត្រូវតែជាលេខ")
    },
    {
      min: 8,
      max: 15,
      message: t("លេខទូរស័ព្ទត្រូវតែមានពី 8 ដល់ 15 ខ្ទង់")
    }
  ];

  const onClickEdit = (record) => {
    const formData = {
      ...record,
      id_card_expiry: record.id_card_expiry ? dayjs(record.id_card_expiry) : undefined
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
    if (!record.id) {
      message.error(t("មិនមានលេខសម្គាល់អតិថិជន!"));
      return;
    }
    Modal.confirm({
      title: t("Delete Customer"),
      content: t("Are you sure you want to delete this customer?"),
      onOk: async () => {
        try {
          const res = await request(`customer/${record.id}`, "delete");
          if (res && !res.error) {
            message.success(res.message);
            getList();
          } else {
            message.error(res.message || t("Customer is in use and cannot be deleted!"));
          }
        } catch (error) {
          console.error("Delete Error:", error);
          message.error(t("មានបញ្ហាកើតឡើងខណៈពេលលុបអតិថិជន។"));
        }
      },
    });
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (values.id_card_expiry) {
        values.id_card_expiry = values.id_card_expiry.format('YYYY-MM-DD');
      }

      const { id, isEditing } = state;
      if (isEditing) {
        const res = await request(`customer/${id}`, "put", values);
        if (res && res.success && !res.error) {
          message.success(t("អតិថិជនត្រូវបានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ!"));
          setState((prev) => ({ ...prev, visibleModal: false }));
          getList();
        } else {
          message.error(res?.message || t("បរាជ័យក្នុងការធ្វើបច្ចុប្បន្នភាពអតិថិជន។"));
        }
      } else {
        const res = await request("customer", "post", values);
        if (res && res.success && !res.error) {
          message.success(t("Customer created successfully!"));
          setState((prev) => ({ ...prev, visibleModal: false }));
          getList();
        } else {
          message.error(res?.message || t("Phone number already exists"));
        }
      }
    } catch (error) {
      console.error("Validation or API error:", error);
      message.error(t("មានបញ្ហាកើតឡើងក្នុងការរក្សាទុកទិន្នន័យ។"));
    }
  };

  const handleModalCancel = () => {
    setState((prev) => ({ ...prev, visibleModal: false }));
    form.resetFields();
  };

  const onClickAssignToUser = () => {
    setState((prev) => ({
      ...prev,
      visibleAssignModal: true,
    }));
    assignForm.resetFields();
  };

  const handleAssignToUserSubmit = async () => {
    try {
      const values = await assignForm.validateFields();

      if (!values.customer_id || !values.assigned_user_id) {
        message.error(t("តម្រូវឱ្យមានអតិថិជននិងអ្នកប្រើប្រាស់!"));
        return;
      }

      const res = await request("customer/user", "post", {
        customer_id: values.customer_id,
        assigned_user_id: values.assigned_user_id
      });

      if (res && res.success) {
        message.success(t("Customer assigned successfully!"));
        setState((prev) => ({ ...prev, visibleAssignModal: false }));
        assignForm.resetFields();
        getList();
      } else {
        message.error(res?.message || t("បរាជ័យក្នុងការកំណត់អតិថិជន។"));
      }
    } catch (error) {
      console.error("Validation or API error:", error);
      message.error(t("មានបញ្ហាកើតឡើងខណៈពេលកំណត់អតិថិជន។"));
    }
  };

  const handleAssignModalCancel = () => {
    setState((prev) => ({ ...prev, visibleAssignModal: false }));
    assignForm.resetFields();
  };

  const canCreateCustomer = permissionsLoaded &&
    isPermission("customer.create") &&
    !blockedPermissions.create.includes(profile?.id);

  // Function to detect phone carrier and return appropriate icon/color
  const getPhoneCarrierInfo = (phoneNumber) => {
    if (!phoneNumber) return { icon: null, color: '#666', carrier: '', bgColor: '#F5F5F5' };

    const phone = phoneNumber.toString().replace(/\s+/g, '');

    // Smart Axiata
    if (phone.match(/^(010|015|016|069|070|081|085|086|087|093|096|098)/)) {
      return {
        logo: 'https://goldzonemedia.com.kh/wp-content/uploads/2023/05/346613115_4921066671351995_2477302429196727443_n-900x550.jpg',
        color: '#00A651',
        carrier: 'Smart',
        bgColor: '#E6F7EE'
      };
    }
    // Cellcard
    if (phone.match(/^(011|012|014|017|061|076|077|078|079|089|092)/)) {
      return {
        logo: 'https://www.khmertimeskh.com/wp-content/uploads/2021/06/cellcard-002.jpg',
        color: '#0066CC',
        carrier: 'Cellcard',
        bgColor: '#E6F2FF'
      };
    }
    // Metfone
    if (phone.match(/^(031|060|066|067|068|071|088|090|097)/)) {
      return {
        logo: 'https://b2b-cambodia.com/storage/uploads/articles/large/eCD1qa1PSRIqYhK5wLbXbRMDOVnpzNDlaN5QUgdP.png',
        color: '#E30613',
        carrier: 'Metfone',
        bgColor: '#FFE6E8'
      };
    }
    // Seatel
    if (phone.match(/^(018|084|095)/)) {
      return {
        logo: 'https://www.khmertimeskh.com/wp-content/uploads/2018/09/41474040_1968319579910358_3351402894199881728_n.jpg',
        color: '#FF6B00',
        carrier: 'Seatel',
        bgColor: '#FFF0E6'
      };
    }
    // CooTel
    if (phone.match(/^(038|099)/)) {
      return {
        logo: 'https://kbcambodia.com/wp-content/uploads/2016/12/CooTel-Cambodia-1.png',
        color: '#9933CC',
        carrier: 'CooTel',
        bgColor: '#F2E6F7'
      };
    }

    return {
      logo: null,
      color: '#666',
      carrier: 'Other',
      bgColor: '#F5F5F5'
    };
  };

  // Calculate gender statistics
  const getGenderStats = () => {
    const total = filteredList.length;
    const male = filteredList.filter(c => c.gender === 'Male').length;
    const female = filteredList.filter(c => c.gender === 'Female').length;
    const other = total - male - female;

    return { total, male, female, other };
  };

  // Mobile Card View Component
  const MobileCustomerCard = ({ record, index }) => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-500">#{record.id}</span>
            <Tag color={record.type === "special" ? "blue" : "green"} className="text-xs">
              {record.type === "special" ? t("special") : t("regular")}
            </Tag>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {record.name || t("គ្មាន")}
          </h3>
          <p className="text-sm text-gray-600">
            {record.gender || t("គ្មាន")}
          </p>
        </div>
        <Space>
          {permissionsLoaded && isPermission("customer.update") && (
            <Button
              type="primary"
              icon={<MdEdit />}
              onClick={() => onClickEdit(record)}
              size="small"
              className="bg-blue-500 hover:bg-blue-600"
            />
          )}
          {permissionsLoaded &&
            isPermission("customer.update") &&
            !blockedPermissions.delete.includes(profile?.id) && (
              <Button
                type="primary"
                danger
                icon={<MdDelete />}
                onClick={() => onClickDelete(record)}
                size="small"
              />
            )}
        </Space>
      </div>

      <div className="space-y-2 border-t border-gray-200 pt-3">
        <div className="flex items-start">
          <span className="text-xs font-medium text-gray-500 w-28 flex-shrink-0">{t("email")}:</span>
          {record.email ? (
            <a
              href={`mailto:${record.email}`}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <FiMail className="text-xs flex-shrink-0" />
              <span className="break-all">{record.email}</span>
            </a>
          ) : (
            <span className="text-sm text-gray-900">-</span>
          )}
        </div>
        <div className="flex items-start">
          <span className="text-xs font-medium text-gray-500 w-28 flex-shrink-0">{t("ទូរស័ព្ទ")}:</span>
          {record.tel ? (
            <a
              href={`tel:${record.tel}`}
              className="text-sm hover:opacity-80 flex items-center gap-1 transition-all"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: getPhoneCarrierInfo(record.tel).bgColor,
                padding: '4px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                border: `1px solid ${getPhoneCarrierInfo(record.tel).color}30`
              }}
            >
              {getPhoneCarrierInfo(record.tel).logo ? (
                <img
                  src={getPhoneCarrierInfo(record.tel).logo}
                  alt={getPhoneCarrierInfo(record.tel).carrier}
                  style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                />
              ) : (
                <span style={{ fontSize: '16px' }}>📞</span>
              )}
              <span style={{ color: getPhoneCarrierInfo(record.tel).color, fontWeight: '600' }}>
                {record.tel}
              </span>
            </a>
          ) : (
            <span className="text-sm text-gray-900">-</span>
          )}
        </div>
        <div className="flex items-start">
          <span className="text-xs font-medium text-gray-500 w-28 flex-shrink-0">{t("address")}:</span>
          <span className="text-sm text-gray-900 line-clamp-2">{record.address || t("no")}</span>
        </div>
        {record.id_card_number && (
          <div className="flex items-start">
            <span className="text-xs font-medium text-gray-500 w-28 flex-shrink-0">{t("id_card_number")}:</span>
            <span className="text-sm text-gray-900">{record.id_card_number}</span>
          </div>
        )}
        {record.spouse_name && (
          <div className="flex items-start">
            <span className="text-xs font-medium text-gray-500 w-28 flex-shrink-0">{t("spouse_name")}:</span>
            <span className="text-sm text-gray-900">{record.spouse_name}</span>
          </div>
        )}
        {record.guarantor_name && (
          <div className="flex items-start">
            <span className="text-xs font-medium text-gray-500 w-28 flex-shrink-0">{t("ឈ្មោះអ្នកធានា")}:</span>
            <span className="text-sm text-gray-900">{record.guarantor_name}</span>
          </div>
        )}
        <div className="flex items-start">
          <span className="text-xs font-medium text-gray-500 w-28 flex-shrink-0">{t("create_by")}:</span>
          <div className="flex-1">
            <div className="text-sm text-gray-900">{record.create_by || t("គ្មាន")}</div>
            <div className="text-xs text-gray-500">
              {record.create_at ? dayjs(record.create_at).format("DD-MM-YYYY h:mm A") : "-"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const columns = [
    {
      key: "index",
      title: (
        <div>
          <div className="khmer-text">{t("NO")}</div>
        </div>
      ),
      width: 70,
      fixed: 'left',
      render: (_, __, index) => index + 1,
    },
    {
      key: "name",
      title: (
        <div>
          <div className="customer-table-header-main">{t("name")}</div>
        </div>
      ),
      dataIndex: "name",
      width: 250,
      fixed: 'left',
      render: (text, record) => (
        <div className="customer-name-cell">
          <div className="customer-name-main">
            {text || t("គ្មាន")}
          </div>
          <div className="customer-name-details">
            <span className="customer-gender-text">
              {record.gender || t("គ្មាន")}
            </span>
            <span className="customer-type-separator">•</span>
            <Tag
              color={record.type === "special" ? "blue" : "green"}
              className="customer-type-tag"
            >
              {record.type === "special" ? t("ពិសេស") : t("ធម្មតា")}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      key: "tel",
      title: (
        <div>
          <div className="customer-table-header-main">{t("Telephone")}</div>
        </div>
      ),
      dataIndex: "tel",
      width: 200,
      render: (tel) => {
        const carrierInfo = getPhoneCarrierInfo(tel);
        return tel ? (
          <a
            href={`tel:${tel}`}
            className="flex items-center gap-2 transition-all hover:opacity-80"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: carrierInfo.bgColor,
              padding: '6px 10px',
              borderRadius: '8px',
              display: 'inline-flex',
              border: `1px solid ${carrierInfo.color}30`
            }}
          >
            {carrierInfo.logo ? (
              <img
                src={carrierInfo.logo}
                alt={carrierInfo.carrier}
                style={{ width: '20px', height: '20px', objectFit: 'contain' }}
              />
            ) : (
              <span style={{ fontSize: '18px' }}>📞</span>
            )}
            <div className="flex flex-col">
              <span style={{
                color: carrierInfo.color,
                fontWeight: '600',
                fontSize: '13px'
              }}>
                {tel}
              </span>
              <span style={{
                fontSize: '9px',
                color: carrierInfo.color,
                opacity: 0.7,
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {carrierInfo.carrier}
              </span>
            </div>
          </a>
        ) : "-";
      }
    },
    {
      key: "action",
      title: (
        <div>
          <div className="customer-table-header-main">{t("action")}</div>
        </div>
      ),
      align: "center",
      width: 140,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t("manage_locations") || "គ្រប់គ្រងទីតាំង"}>
            <Button
              type="default"
              icon={<MdLocationOn />}
              onClick={() => {
                setSelectedCustomer(record);
                setLocationModalVisible(true);
              }}
              size="small"
              style={{ color: '#1890ff' }}
            />
          </Tooltip>

          {permissionsLoaded && isPermission("customer.update") && (
            <Button
              type="primary"
              icon={<MdEdit />}
              onClick={() => onClickEdit(record)}
              size="small"
            />
          )}

          {permissionsLoaded &&
            isPermission("customer.update") &&
            !blockedPermissions.delete.includes(profile?.id) && (
              <Button
                type="primary"
                danger
                icon={<MdDelete />}
                onClick={() => onClickDelete(record)}
                size="small"
              />
            )}
        </Space>
      ),
    }
  ];

  const renderExpandableContent = (record) => (
    <div className="p-6 bg-blue-50/30 rounded-xl border border-blue-100/50 flex flex-wrap gap-8 mx-4 my-2">
      <div className="flex-1 min-w-[200px]">
        <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-3 leading-none">{t("Contact Info")}</h4>
        <div className="space-y-2">
          <p className="text-sm flex justify-between border-b border-blue-50 pb-1"><span className="text-gray-500">{t("Email")}:</span> <span className="font-semibold">{record.email || '-'}</span></p>
          <p className="text-sm flex justify-between border-b border-blue-50 pb-1"><span className="text-gray-500">{t("ID Card")}:</span> <span className="font-semibold">{record.id_card_number || '-'}</span></p>
          <p className="text-sm flex justify-between border-b border-blue-50 pb-1"><span className="text-gray-500">{t("Expiry")}:</span> <span className="font-semibold">{record.id_card_expiry ? dayjs(record.id_card_expiry).format("DD/MM/YYYY") : '-'}</span></p>
        </div>
      </div>
      <div className="flex-1 min-w-[200px]">
        <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-3 leading-none">{t("Family Info")}</h4>
        <div className="space-y-2">
          <p className="text-sm flex justify-between border-b border-blue-50 pb-1"><span className="text-gray-500">{t("Spouse")}:</span> <span className="font-semibold">{record.spouse_name || '-'}</span     ></p>
          <p className="text-sm flex justify-between border-b border-blue-50 pb-1"><span className="text-gray-500">{t("Spouse Tel")}:</span> <span className="font-semibold">{record.spouse_tel || '-'}</span   ></p>
          <p className="text-sm flex justify-between border-b border-blue-50 pb-1"><span className="text-gray-500">{t("Guarantor")}:</span> <span className="font-semibold">{record.guarantor_name || '-'}</      span></p>
        </div>
      </div>
      <div className="flex-1 min-w-[250px]">
        <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-3 leading-none">{t("Address & Origins")}</h4>
        <div className="space-y-2">
          <p className="text-sm flex flex-col border-b border-blue-50 pb-1"><span className="text-gray-500 text-[10px]">{t("Address")}:</span> <span className="font-semibold mt-1">{record.address || '-'}</span     ></p>
          <p className="text-sm flex justify-between border-b border-blue-50 pb-1"><span className="text-gray-500">{t("Created By")}:</span> <span className="font-semibold">{record.create_by || '-'}</span      ></p>
          <p className="text-sm flex justify-between border-b border-blue-50 pb-1"><span className="text-gray-500">{t("Created At")}:</span> <span className="font-semibold">{record.create_at ? dayjs(record.create_at).format("DD-MM-YYYY h:mm A") : '-'}</span  ></p>
        </div>
      </div>
    </div>
  );

  const renderCustomerForm = () => (
    <Form form={form} layout="vertical">
      <Row gutter={[16, 8]}>
        <Col xs={24} sm={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("name")}</span>}
            name="name"
            rules={[{ required: true, message: t("Name is required") }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("gender")}</span>}
            name="gender"
            rules={[{ required: true, message: t("Gender is required") }]}
          >
            <Select placeholder={t("pls_select_gender")}>
              <Select.Option value="Male">{t("male")}</Select.Option>
              <Select.Option value="Female">{t("female")}</Select.Option>
              <Select.Option value="Other">{t("other")}</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 8]}>
        <Col xs={24} sm={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("email")}</span>}
            name="email"
            rules={[{ required: true, message: t("តម្រូវឱ្យមានអ៊ីមែល") }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("telephone")}</span>}
            name="tel"
            rules={phoneValidationRules}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 8]}>
        <Col xs={24} sm={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("id_card_number")}</span>}
            name="id_card_number"
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("id_card_expiry")}</span>}
            name="id_card_expiry"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 8]}>
        <Col span={24}>
          <Form.Item
            label={<span className="customer-form-label">{t("address")}</span>}
            name="address"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 8]}>
        <Col xs={24} sm={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("spouse_name")}</span>}
            name="spouse_name"
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("spouse_tel")}</span>}
            name="spouse_tel"
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 8]}>
        <Col xs={24} sm={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("guarantor_name")}</span>}
            name="guarantor_name"
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("guarantor_tel")}</span>}
            name="guarantor_tel"
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 8]}>
        <Col xs={24} sm={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("action")}</span>}
            name="status"
            initialValue={1}
          >
            <Select>
              <Select.Option value={1}>
                <span className="customer-btn-text">{t("Active")}</span>
              </Select.Option>
              <Select.Option value={0}>
                <span className="customer-btn-text">{t("Inactive")}</span>
              </Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("customer_type")}</span>}
            name="type"
            rules={[{ required: true, message: t("តម្រូវឱ្យមានប្រភេទអតិថិជន") }]}
          >
            <Select>
              <Select.Option value="regular">
                <span className="customer-btn-text">{t("Regular Customer")}</span>
              </Select.Option>
              <Select.Option value="special">
                <span className="customer-btn-text">{t("Special Customer")}</span>
              </Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );

  const renderAssignForm = () => (
    <Form form={assignForm} layout="vertical">
      <Form.Item
        label={<span className="customer-form-label">{t("អតិថិជន")}</span>}
        name="customer_id"
        rules={[{ required: true, message: t("តម្រូវឱ្យមានអតិថិជន") }]}
      >
        <Select
          showSearch
          placeholder={t("ជ្រើសរើសអតិថិជន")}
          optionFilterProp="children"
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {filteredList.map(customer => (
            <Select.Option key={customer.id} value={customer.id}>
              {customer.name} - {customer.tel}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item
        label={<span className="customer-form-label">{t("អ្នកប្រើប្រាស់")}</span>}
        name="assigned_user_id"
        rules={[{ required: true, message: t("តម្រូវឱ្យមានអ្នកប្រើប្រាស់") }]}
      >
        <Select
          style={{ width: '100%' }}
          allowClear
          placeholder={t("ជ្រើសរើសអ្នកប្រើប្រាស់")}
          options={config?.user?.map(user => ({
            value: user.value,
            label: user.label
          })) || []}
          suffixIcon={<LuUserRoundSearch />}
        />
      </Form.Item>
    </Form>
  );

  return (
    <MainPage loading={loading}>
      {/* Page Header - Responsive */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 px-2 sm:px-4 lg:px-0">
        {/* Left Side - Title and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-wrap">
          <div>
            <h1 className="customer-page-title text-xl sm:text-2xl font-bold text-gray-900">
              {t("Customer Management")}
            </h1>
            {/* Gender Statistics */}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-medium text-gray-600">
                {t("total")}: <span className="font-bold text-blue-600">{getGenderStats().total}</span>
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-xs font-medium text-gray-600">
                👨 {t("male")}: <span className="font-bold text-blue-500">{getGenderStats().male}</span>
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-xs font-medium text-gray-600">
                👩 {t("female")}: <span className="font-bold text-pink-500">{getGenderStats().female}</span>
              </span>
              {getGenderStats().other > 0 && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-xs font-medium text-gray-600">
                    {t("ផ្សេងៗ")}: <span className="font-bold text-gray-500">{getGenderStats().other}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Input.Search
              className="customer-search-input w-full sm:w-48"
              onChange={(e) =>
                setState((prev) => ({ ...prev, txtSearch: e.target.value }))
              }
              allowClear
              onSearch={getList}
              placeholder={t("Search by name")}
            />

            <Select
              className="customer-type-filter w-full sm:w-44"
              placeholder={t("customer_type")}
              allowClear
              value={state.customerTypeFilter}
              onChange={(value) => {
                setState((prev) => ({ ...prev, customerTypeFilter: value }));
              }}
            >
              <Select.Option value="regular">
                <span className="customer-btn-text">{t("អតិថិជនធម្មតា")}</span>
              </Select.Option>
              <Select.Option value="special">
                <span className="customer-btn-text">{t("អតិថិជនពិសេស")}</span>
              </Select.Option>
            </Select>

            <Button
              className="customer-btn-text w-full sm:w-auto"
              type="primary"
              onClick={getList}
              icon={<CiSearch />}
            >
              <span className="hidden sm:inline">{t("Search")}</span>
            </Button>

            <Button
              className="customer-btn-text w-full sm:w-auto"
              type="default"
              onClick={toggleFullscreen}
              icon={isFullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
            >
              <span className="hidden sm:inline">
                {isFullscreen ? t("Exit Fullscreen") : t("Enter Fullscreen")}
              </span>
            </Button>

            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
              <Button
                type={state.viewMode === "table" ? "primary" : "text"}
                size="small"
                onClick={() => setState(prev => ({ ...prev, viewMode: "table" }))}
                className={state.viewMode === "table" ? "shadow-sm" : ""}
                icon={<MdFormatListBulleted size={18} />}
              >
                {t("Table")}
              </Button>
              <Button
                type={state.viewMode === "grid" ? "primary" : "text"}
                size="small"
                onClick={() => setState(prev => ({ ...prev, viewMode: "grid" }))}
                className={state.viewMode === "grid" ? "shadow-sm" : ""}
                icon={<MdGridView size={18} />}
              >
                {t("Grid")}
              </Button>
            </div>

            {permissionsLoaded && isPermission("customer.getone") && (
              <Button
                className="customer-btn-text w-full sm:w-auto"
                type="primary"
                icon={<MdSecurity />}
                onClick={() => setDeletePermissionModalVisible(true)}
              >
                <span className="hidden sm:inline">{t("Set Permissions")}</span>
              </Button>
            )}
            {permissionsLoaded && isPermission("customer.getone") && (
              <Button
                className="customer-btn-text w-full sm:w-auto"
                type="primary"
                onClick={onClickAssignToUser}
                icon={<IoPersonAddSharp />}
              >
                <span className="hidden md:inline">{t("Assign Customer to User")}</span>
                <span className="md:hidden">{t("ចាត់ចែង")}</span>
              </Button>
            )}
            {canCreateCustomer && (
              <Button
                className="customer-btn-text w-full sm:w-auto"
                type="primary"
                onClick={onClickAddBtn}
                icon={<MdOutlineCreateNewFolder />}
              >
                {t("Create New")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table for Desktop / Cards for Mobile */}
      {isMobile ? (
        <div className="px-2 sm:px-4 pb-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              {t("កំពុងផ្ទុក...")}
            </div>
          ) : filteredList.length > 0 ? (
            filteredList.map((record, index) => (
              <MobileCustomerCard
                key={record.id}
                record={record}
                index={index}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg">
              {t("គ្មានទិន្នន័យ")}
            </div>
          )}
        </div>
      ) : (
        <div
          ref={setTableContainerRef}
          className={`customer-table-container ${isFullscreen ? 'fullscreen-table' : ''}`}
          style={{
            backgroundColor: isFullscreen ? '#ffffff' : 'transparent',
            padding: isFullscreen ? '20px' : '0',
            position: 'relative'
          }}
        >
          {isFullscreen && (
            <div className="fullscreen-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '2px solid #e8e8e8'
            }}>
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#262626',
                  margin: 0,
                  fontFamily: 'var(--khmer-font-main)'
                }}>
                  {t("Customer Management")}
                </h2>
                {/* Gender Statistics in Fullscreen */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#666' }}>
                    {t("total")}: <span style={{ fontWeight: '700', color: '#1890ff' }}>{getGenderStats().total}</span>
                  </span>
                  <span style={{ color: '#d9d9d9' }}>|</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#666' }}>
                    👨 {t("male")}: <span style={{ fontWeight: '700', color: '#3b82f6' }}>{getGenderStats().male}</span>
                  </span>
                  <span style={{ color: '#d9d9d9' }}>|</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#666' }}>
                    👩 {t("female")}: <span style={{ fontWeight: '700', color: '#ec4899' }}>{getGenderStats().female}</span>
                  </span>
                  {getGenderStats().other > 0 && (
                    <>
                      <span style={{ color: '#d9d9d9' }}>|</span>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#666' }}>
                        {t("other")}: <span style={{ fontWeight: '700', color: '#6b7280' }}>{getGenderStats().other}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* Font Size Zoom Controls in Fullscreen */}
                <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1 bg-white">
                  <Tooltip title={t("Decrease font size")}>
                    <Button
                      size="small"
                      icon={<AiOutlineZoomOut />}
                      onClick={decreaseFontSize}
                      disabled={fontSize <= 70}
                      className="zoom-btn"
                    />
                  </Tooltip>
                  <span className="text-xs font-semibold px-2 min-w-[45px] text-center" style={{ fontFamily: 'monospace' }}>
                    {fontSize}%
                  </span>
                  <Tooltip title={t("Reset font size")}>
                    <Button
                      size="small"
                      icon={<TbZoomReset />}
                      onClick={resetFontSize}
                      className="zoom-btn"
                    />
                  </Tooltip>
                  <Tooltip title={t("Increase font size")}>
                    <Button
                      size="small"
                      icon={<AiOutlineZoomIn />}
                      onClick={increaseFontSize}
                      disabled={fontSize >= 150}
                      className="zoom-btn"
                    />
                  </Tooltip>
                </div>
                <Button
                  type="primary"
                  danger
                  onClick={toggleFullscreen}
                  icon={<MdFullscreenExit />}
                  size="large"
                >
                  {t("បិត Fullscreen")}
                </Button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            {state.viewMode === "table" ? (
              <Table
                className="customer-table-modern"
                rowClassName={() => "customer-table-row"}
                rowKey="id"
                dataSource={filteredList}
                columns={columns}
                pagination={false}
                expandable={{
                  expandedRowRender: renderExpandableContent,
                  expandRowByClick: true,
                  columnTitle: "",
                  columnWidth: 40,
                }}
                scroll={{
                  x: 1000,
                  y: isFullscreen ? 'calc(100vh - 220px)' : 'calc(100vh - 350px)'
                }}
                sticky={{
                  offsetHeader: 0
                }}
              />
            ) : (
              <Row gutter={[20, 20]} className="p-2 sm:p-4">
                {filteredList.map((record, index) => (
                  <Col key={record.id} xs={24} sm={12} md={12} lg={8} xl={6}>
                    <div
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col h-full group"
                      onClick={() => onClickEdit(record)}
                    >
                      {/* Card Header with Status and Actions */}
                      <div className="p-4 pb-2 flex justify-between items-start">
                        <Tag
                          color={record.type === "special" ? "blue" : "green"}
                          className="m-0 px-2 py-0 text-[10px] font-bold uppercase rounded-full"
                        >
                          {record.type === "special" ? t("Special") : t("Regular")}
                        </Tag>
                        <Space className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="text"
                            icon={<MdLocationOn className="text-blue-500" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(record);
                              setLocationModalVisible(true);
                            }}
                            size="small"
                          />
                          <Button
                            type="text"
                            danger
                            icon={<MdDelete />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onClickDelete(record);
                            }}
                            size="small"
                          />
                        </Space>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 pt-0 flex-1">
                        <h3 className="text-lg font-extrabold text-gray-900 mb-0 leading-tight">
                          {record.name || t("No Name")}
                        </h3>
                        <p className="text-xs font-medium text-gray-500 mb-4">{record.gender || '-'}</p>

                        <div className="space-y-3">
                          {record.tel && (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <FiPhone className="text-blue-500 text-xs" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-800">{record.tel}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                  {getPhoneCarrierInfo(record.tel).carrier}
                                </span>
                              </div>
                            </div>
                          )}
                          {record.email && (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <FiMail className="text-blue-500 text-xs" />
                              </div>
                              <span className="text-sm font-medium text-gray-600 truncate">{record.email}</span>
                            </div>
                          )}
                          <div className="flex items-start gap-3 mt-2">
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                              <MdLocationOn className="text-gray-400 text-xs" />
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-1 italic">
                              {record.address || t("No address available")}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer - Create Info */}
                      <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between mt-auto">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t("Added By")}</span>
                        <span className="text-[11px] font-bold text-gray-600">{record.create_by || '-'}</span>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </div>
      )}

      {/* Permission Settings Modal */}
      <Modal
        title={<span className="customer-modal-title">{t("Set User Permissions")}</span>}
        open={deletePermissionModalVisible}
        onOk={() => setDeletePermissionModalVisible(false)}
        onCancel={() => setDeletePermissionModalVisible(false)}
        width={isMobile ? '95%' : 600}
      >
        <div className="mb-4">
          <Select
            className="customer-type-filter"
            style={{ width: "100%" }}
            value={selectedPermissionType}
            onChange={(value) => setSelectedPermissionType(value)}
          >
            <Select.Option value="delete">{t("Block Delete Permission")}</Select.Option>
            <Select.Option value="create">{t('Block Create Permission')}</Select.Option>
          </Select>
        </div>

        <Checkbox.Group
          value={blockedPermissions[selectedPermissionType]}
          onChange={handleCheckboxChange}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4 sm:gap-x-8">
            {(config?.user || []).map((user) => {
              const label = user.label || "";
              const [namePart, ...rest] = label.split(" - ");
              const subPart = rest.join(" - ");

              return (
                <Checkbox key={user.value} value={user.value} className="customer-permission-checkbox">
                  <span className="customer-permission-label">{namePart}</span>
                  <span className="customer-permission-sub block sm:inline">{subPart}</span>
                </Checkbox>
              );
            })}
          </div>
        </Checkbox.Group>
      </Modal>

      {/* Create/Edit Customer Modal */}
      <Modal
        title={
          <span className="customer-modal-title">
            {state.isEditing ? t("Edit Customer") : t("Create Customer")}
          </span>
        }
        open={state.visibleModal}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        width={isMobile ? '95%' : 700}
        styles={{
          body: { maxHeight: isMobile ? '70vh' : 'auto', overflowY: 'auto' }
        }}
      >
        {renderCustomerForm()}
      </Modal>

      {/* Assign Customer to User Modal */}
      <Modal
        title={
          <span className="customer-modal-title">{t("Assign Customer to User")}</span>
        }
        open={state.visibleAssignModal}
        onOk={handleAssignToUserSubmit}
        onCancel={handleAssignModalCancel}
        width={isMobile ? '95%' : 500}
      >
        {renderAssignForm()}
      </Modal>

      <CustomerLocationsModal
        visible={locationModalVisible}
        onClose={() => {
          setLocationModalVisible(false);
          setSelectedCustomer(null);
        }}
        customerId={selectedCustomer?.id}
        customerName={selectedCustomer?.name}
      />

    </MainPage>
  );
}

export default CustomerPage;