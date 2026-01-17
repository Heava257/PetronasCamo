// import React, { useEffect, useState, useRef } from "react";
// import { Outlet, useNavigate } from "react-router-dom";
// import "./MainLayout.css";
// import "./responsive.css";
// import "./modern-mobile-header.css";
// import logo from "../../assets/petronas_header.png";
// import ImgUser from "../../assets/profile.png";
// import { useTranslation } from '../../../src/locales/TranslationContext.jsx';
// import LanguageSwitcher from '../../../src/component/printer/LanguageSwitcher.jsx';
// import NotificationPanel from "../../page/supperAdmin/NotificationPanel/NotificationPanelPage";
// import { APP_VERSION } from "../../version.js";

// import {
//   getPermission,
//   getProfile,
//   setAcccessToken,
//   setProfile,
// } from "../../store/profile.store";
// import { request } from "../../util/helper";
// import { configStore } from "../../store/configStore";
// import { Config } from "../../util/config";
// import { GoChecklist } from "react-icons/go";
// import KhmerTimeGreeting from "./KhmerTimeGreeting";
// import LiveClock from "./LiveClock";
// import { useDarkMode } from "../../../src/component/printer/DarkModeContext.jsx";



import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Avatar, Dropdown, Space, Input } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  SearchOutlined,
  GlobalOutlined,
  BulbOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  HomeOutlined,
  UserOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  LayoutDashboard,
  Shield,
  FileText,
  Bell,
  Users,
  User,
  Settings,
  ShoppingCart,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Package,
  AlignJustify,
} from "lucide-react";
import "./CleanDarkLayout.css";
import logo from "../../assets/petronas_header.png";
import ImgUser from "../../assets/profile.png";
import { useTranslation } from 'react-i18next';

import { useTranslation as useCustomTranslation } from "../../locales/TranslationContext.jsx";
import { getPermission, getProfile } from "../../store/profile.store";
import { isPermission, request } from "../../util/helper";
import { configStore } from "../../store/configStore";
import { Config } from "../../util/config";
import NotificationPanel from "../../page/supperAdmin/NotificationPanel/NotificationPanelPage.jsx";
import NotificationBell from "../../page/supperAdmin/NotificationBell/NotificationBellPage.jsx";
import { APP_VERSION } from "../../version.js";
import { useDarkMode } from "../DarkModeContext.jsx";
const { Header, Content, Footer } = Layout;
const { Search } = Input;

// ✅ Menu configuration with categories
const menuItems = [
  {
    key: "",
    icon: LayoutDashboard,
    label: "menu.dashboard",
    category: "MAIN",
  },
  {
    key: "security/dashboard",
    icon: Shield,
    label: "menu.security_dashboard",
    category: "MAIN",
  },
  {
    key: "report_BranchComparison",
    icon: FileText,
    label: "menu.report_branch_comparison",
    category: "MAIN",
  },
  {
    key: "notifications/statistics",
    icon: Bell,
    label: "menu.notifications_statistics",
    category: "STATISTICS",
  },
  {
    key: "admin-management",
    icon: Users,
    label: "menu.admin_management",
    category: "MANAGEMENT",
  },
  {
    key: "supperadmin-management",
    icon: User,
    label: "menu.super_admin_management",
    category: "MANAGEMENT",
  },
  {
    key: "permission-management",
    icon: Settings,
    label: "menu.permission_management",
    category: "MANAGEMENT",
  },
  {
    key: "inactive_admins",
    icon: User,
    label: "menu.inactive_admins",
    category: "MANAGEMENT",
  },
  {
    key: "super-TelegramConfiguration",
    icon: Bell,
    label: "menu.telegram_configuration",
    category: "MANAGEMENT",
  },
  {
    key: "BranchPermissionOverride",
    icon: Settings,
    label: "menu.branch_permission_override",
    category: "MANAGEMENT",
  },
  {
    key: "invoices",
    icon: FileText,
    label: "menu.invoices",
    category: "FINANCE",
  },
  {
    key: "fakeinvoices",
    icon: FileText,
    label: "menu.fake_invoices",
    category: "FINANCE",
  },
  {
    key: "delivery",
    icon: ShoppingCart,
    label: "menu.delivery_note",
    category: "OPERATIONS",
    children: [
      { key: "delivery-map", label: "menu.delivery_map" },
      { key: "DeliveryReports", label: "menu.delivery_reports" },
      { key: "deliverynote", label: "menu.delivery_note" },
      { key: "active-deliveries", label: "menu.active_deliveries" },
      { key: "driver", label: "menu.driver" },
      { key: "driver-auth", label: "menu.driver_auth" },
      { key: "Truck", label: "menu.truck" },
    ],
  },
  {
    key: "finance",
    icon: DollarSign,
    label: "menu.family_finance",
    category: "FINANCE",
  },
  {
    key: "EnhancedPOSOrder",
    icon: ShoppingCart,
    label: "menu.enhanced_pos_order",
    category: "OPERATIONS",
    children: [
      { key: "pre-order-management", label: "menu.pre_order_management" },
      { key: "pre-order-detail", label: "menu.pre_order_detail" },
    ],
  },
  {
    key: "order",
    icon: FileText,
    label: "menu.invoice_details",
    category: "FINANCE",
  },
  {
    key: "total_due",
    icon: DollarSign,
    label: "menu.debt_list",
    category: "FINANCE",
  },
  {
    key: "payment/history",
    icon: DollarSign,
    label: "menu.payment_summary",
    category: "FINANCE",
  },
  {
    key: "products",
    icon: Package,
    label: "menu.products",
    category: "OPERATIONS",
    children: [
      { key: "category", label: "menu.category" },
      { key: "product", label: "menu.products" },
      { key: "company-payment-management", label: "menu.company_payment_management" },
      { key: "company-payment", label: "menu.company_payment" },
    ],
  },
  {
    key: "purchase",
    icon: ShoppingCart,
    label: "menu.purchase",
    category: "OPERATIONS",
    children: [
      { key: "supplier", label: "menu.supplier" },
      { key: "purchase-orders", label: "menu.purchase_orders" },
      { key: "inventory-transactions", label: "menu.inventory_transactions" },
    ],
  },
  {
    key: "customer",
    icon: User,
    label: "menu.customer",
    category: "MANAGEMENT",
  },
  {
    key: "admin-ShiftClosing",
    icon: User,
    label: "menu.shift_closing",
    category: "MANAGEMENT",
  },
  {
    key: "admin-DailyClosing",
    icon: User,
    label: "menu.daily_closing",
    category: "MANAGEMENT",
  },
  {
    key: "admin-ShiftClosingChecklist",
    icon: User,
    label: "menu.closing_checklist",
    category: "MANAGEMENT",
  },
  {
    key: "admin-StockReconciliation",
    icon: User,
    label: "menu.stock_reconciliation",
    category: "MANAGEMENT",
  },
  {
    key: "expense",
    icon: DollarSign,
    label: "menu.expense",
    category: "FINANCE",
    children: [
      { key: "expanse", label: "menu.expense" },
      { key: "expanse_type", label: "menu.expense_type" },
    ],
  },
  {
    key: "employee-management",
    icon: Users,
    label: "menu.employee",
    category: "MANAGEMENT",
    children: [
      { key: "employee", label: "menu.employee" },
      { key: "ip-Management", label: "menu.ip_management" },
    ],
  },
  {
    key: "user-management",
    icon: User,
    label: "menu.user",
    category: "MANAGEMENT",
    children: [
      { key: "user", label: "menu.user" },
      { key: "role", label: "menu.role" },
    ],
  },
  {
    key: "reports",
    icon: FileText,
    label: "menu.reports",
    category: "REPORTS",
    children: [
      { key: "report_Sale_Summary", label: "menu.sales_summary" },
      { key: "report_Expense_Summary", label: "menu.expense_summary" },
      { key: "report_Customer", label: "menu.new_customer_summary" },
      { key: "Top_Sale", label: "menu.top_sales" },
      { key: "report_Stock_Status", label: "report.stock_status_report" },
      { key: "report_Stock_Movement", label: "report.stock_movement_report" },
      { key: "report_Purchase_History", label: "report.purchase_history" },
      { key: "report_Outstanding_Debt", label: "report.outstanding_debt" },
      { key: "report_Payment_History", label: "report.payment_history" },
      { key: "report_Profit_Loss", label: "report.profit_loss" },
    ],
  },
];

const CleanDarkLayout = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const permision = getPermission();
  const { setConfig } = configStore();
  const profile = getProfile();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState(["delivery", "products", "reports"]);
  const [selectedKey, setSelectedKey] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { changeLanguage: changeCustomLanguage } = useCustomTranslation();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    changeCustomLanguage(lng);
    localStorage.setItem('language', lng);
  };

  // ✅✅✅ CORRECT: Filter menu by permissions (EXACT LOGIC FROM MainLayout) ✅✅✅
  const filteredItems = useMemo(() => {
    if (!permision || permision.length === 0) return [];

    const new_items_menu = [];

    menuItems.forEach((item1) => {
      // ✅ Step 1: Check if parent has direct permission
      const p1 = permision.findIndex(
        (data1) => data1.web_route_key === "/" + item1.key
      );

      // ✅ Step 2: If parent has permission, add it immediately
      if (p1 !== -1) {
        new_items_menu.push({ ...item1 });
      }

      // ✅ Step 3: If item has children, filter them by permission
      if (item1?.children && item1?.children.length > 0) {
        let childTmp = [];
        
        // ✅ Double loop to match children permissions (exact MainLayout logic)
        item1.children.forEach((data1) => {
          permision.forEach((data2) => {
            if (data2.web_route_key === "/" + data1.key) {
              // Avoid duplicates
              if (!childTmp.find(c => c.key === data1.key)) {
                childTmp.push(data1);
              }
            }
          });
        });

        // ✅ Step 4: If has valid children, add/update parent
        if (childTmp.length > 0) {
          const existingIndex = new_items_menu.findIndex(m => m.key === item1.key);
          
          if (existingIndex !== -1) {
            // Update existing parent with children
            new_items_menu[existingIndex] = {
              ...new_items_menu[existingIndex],
              children: childTmp
            };
          } else {
            // Add new parent with children
            new_items_menu.push({
              ...item1,
              children: childTmp
            });
          }
        }
      }
    });

    return new_items_menu;
  }, [permision]);

  // Load config
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const res = await request("config", "get");
        if (res && isMounted) {
          setConfig(res);
          setConfigLoaded(true);
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
        setConfigLoaded(true);
      }
    };
    if (!configLoaded) {
      fetchConfig();
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Check profile & redirect
  useEffect(() => {
    if (!profile) {
      navigate("/login");
    }
  }, [profile, navigate]);

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Check page permission and redirect if needed (LOGIC FROM MainLayout)
  useEffect(() => {
    if (!permision || permision.length === 0) return;

    const findIndex = permision.findIndex(
      (item) => item.web_route_key === location.pathname
    );

    if (findIndex === -1 && location.pathname !== "/login") {
      if (permision.length > 0) {
        navigate(permision[0].web_route_key);
      }
    }
  }, [location.pathname, permision, navigate]);

  // Update selected key based on location
  useEffect(() => {
    const path = location.pathname.substring(1);
    setSelectedKey(path);
  }, [location.pathname]);

  // Fullscreen listener
  useEffect(() => {
    const checkFullscreen = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", checkFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", checkFullscreen);
    };
  }, []);

  // Handlers
  const handleLogout = async () => {
    try {
      await request("auth/logout", "post", {
        refresh_token: localStorage.getItem("refresh_token"),
      });
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  const getProfileImageUrl = () => {
    if (!profile?.profile_image) return ImgUser;
    try {
      const imageUrl = Config.getFullImagePath(profile.profile_image);
      new URL(imageUrl);
      return imageUrl;
    } catch (error) {
      return ImgUser;
    }
  };

  const toggleExpanded = (key) => {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleMenuClick = (key) => {
    setSelectedKey(key);
    if (key) {
      navigate("/" + key);
    } else {
      navigate("/");
    }
  };

  // Filter menu by search
  const filteredMenuItems = useMemo(() => {
    return filteredItems.filter((item) => {
      if (!searchValue) return true;
      const searchLower = searchValue.toLowerCase();
      const labelMatch = t(item.label).toLowerCase().includes(searchLower);
      const childMatch = item.children?.some((child) =>
        t(child.label).toLowerCase().includes(searchLower)
      );
      return labelMatch || childMatch;
    });
  }, [filteredItems, searchValue, t]);

  // Group by category
  const categories = useMemo(() => {
    return [...new Set(filteredMenuItems.map((item) => item.category))];
  }, [filteredMenuItems]);

  // Render menu item
  const renderMenuItem = (item, level = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedKeys.includes(item.key);
    const isSelected = selectedKey === item.key;

    return (
      <div key={item.key} className="menu-item-container">
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.key);
            } else {
              handleMenuClick(item.key);
            }
          }}
          className={`hierarchical-menu-item ${isSelected ? "selected" : ""} ${
            collapsed && level === 0 ? "collapsed" : ""
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          {Icon && <Icon size={18} className="menu-icon" />}
          {!collapsed && (
            <>
              <span className="menu-label">{t(item.label)}</span>
              {hasChildren && (
                <span className="expand-icon">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
              )}
            </>
          )}
        </button>

        {hasChildren && isExpanded && !collapsed && (
          <div className="submenu">
            {item.children.map((child) => (
              <button
                key={child.key}
                onClick={() => handleMenuClick(child.key)}
                className={`hierarchical-menu-item submenu-item ${
                  selectedKey === child.key ? "selected" : ""
                }`}
                style={{ paddingLeft: `${12 + (level + 1) * 16}px` }}
              >
                <span className="menu-label">{t(child.label)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Dropdowns
  const languageMenu = {
    items: [
      {
        key: "km",
        label: (
          <Space>
            <span>🇰🇭</span>
            <span>ភាសាខ្មែរ</span>
          </Space>
        ),
        onClick: () => changeLanguage("km"),
      },
      {
        key: "en",
        label: (
          <Space>
            <span>🇬🇧</span>
            <span>English</span>
          </Space>
        ),
        onClick: () => changeLanguage("en"),
      },
    ],
  };

  const profileMenu = {
    items: [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: t("menu.my_profile"),
        onClick: () => navigate("/profile"),
      },
      { type: "divider" },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: t("menu.logout"),
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  if (!profile) {
    return null;
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Hierarchical Sidebar */}
      <div className={`hierarchical-sidebar ${collapsed ? "collapsed" : "expanded"}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="logo-section">
            <img src={logo} alt="PETRONAS" className="logo-icon-img" />
            {!collapsed && (
              <div className="logo-text">
                <div className="company-name">PETRONAS</div>
                <div className="company-subtitle">CAMBODIA</div>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="sidebar-search">
            <Search
              placeholder={t("menu.search")}
              allowClear
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </div>
        )}

        {/* Menu */}
        <div className="menu-container">
          {categories.map((category) => {
            const categoryItems = filteredMenuItems.filter(
              (item) => item.category === category
            );
            if (categoryItems.length === 0) return null;

            return (
              <div key={category} className="menu-category">
                {!collapsed && (
                  <div className="category-header">
                    {t(`menu.categories.${category.toLowerCase()}`)}
                  </div>
                )}
                {categoryItems.map((item) => renderMenuItem(item))}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="sidebar-footer">
            <div className="footer-content">
              <SettingOutlined />
              <span>Version {APP_VERSION}</span>
            </div>
            <p className="footer-copyright">© {new Date().getFullYear()} PETRONAS</p>
          </div>
        )}
      </div>

      {/* Main Layout */}
      <Layout style={{ marginLeft: collapsed ? "80px" : "280px", transition: "margin-left 0.3s" }}>
        {/* Header */}
        <Header className="clean-dark-header">
          <div className="header-left">
            <div className="trigger-button" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
          </div>

          <div className="header-right">
            <Dropdown menu={languageMenu} placement="bottomRight">
              <div className="header-icon">
                <GlobalOutlined />
              </div>
            </Dropdown>

            <div className="header-icon" onClick={toggleDarkMode}>
              <BulbOutlined />
            </div>

            <div className="header-icon" onClick={toggleFullScreen}>
              {isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            </div>

            {isPermission("notifications.getlist") && (
              <div className="header-icon">
                <NotificationBell />
              </div>
            )}

            <Link to="/attendance">
              <div className="header-icon" title="Attendance">
                <HomeOutlined />
              </div>
            </Link>

            <Dropdown menu={profileMenu} placement="bottomRight">
              <Space className="header-profile">
                <Avatar src={getProfileImageUrl()} size={32} />
                <span className="profile-name">{profile?.name}</span>
              </Space>
            </Dropdown>
          </div>
        </Header>

        {/* Content */}
        <Content className="clean-dark-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </Content>

        {/* Footer */}
        <Footer className="clean-dark-footer">
          ©{new Date().getFullYear()} Created by PETRONAS CO.,LTD • Version: {APP_VERSION}
        </Footer>
      </Layout>
    </Layout>
  );
};

export default CleanDarkLayout;