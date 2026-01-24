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
import { Layout, Avatar, Dropdown, Space, Input, Drawer } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  SearchOutlined,
  GlobalOutlined,
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
import { useSettings } from "../../settings";
import TemplateSelector from "../common/TemplateSelector";
const { Header, Content, Footer } = Layout;
const { Search } = Input;

// ✅ Menu configuration with categories (organized logically)
const menuItems = [
  // MAIN DASHBOARDS
  {
    key: "dashboard-group",
    icon: LayoutDashboard,
    label: "menu.categories.main",
    category: "MAIN",
    children: [
      { key: "", icon: LayoutDashboard, label: "menu.dashboard" },
      { key: "security/dashboard", icon: Shield, label: "menu.security_dashboard" },
    ]
  },

  // SALES & ORDERS
  {
    key: "sales-group",
    icon: ShoppingCart,
    label: "menu.categories.sales", // Need to add this key or use a literal
    category: "OPERATIONS",
    children: [
      { key: "invoices", label: "menu.invoices", children: [{ key: "order", label: "menu.invoice_details" }] },
      { key: "EnhancedPOSOrder", label: "menu.enhanced_pos_order", children: [{ key: "pre-order-management", label: "menu.pre_order_management" }] },
      { key: "fakeinvoices", label: "menu.fake_invoices" },
    ]
  },

  // INVENTORY & STOCK
  {
    key: "inventory-group",
    icon: Package,
    label: "menu.categories.inventory",
    category: "OPERATIONS",
    children: [
      { key: "products", label: "menu.products", children: [{ key: "category", label: "menu.category" }, { key: "product", label: "menu.products" }, { key: "company-payment-management", label: "menu.company_payment_management" }, { key: "company-payment", label: "menu.company_payment" }] },
      { key: "purchase", label: "menu.purchase", children: [{ key: "supplier", label: "menu.supplier" }, { key: "purchase-orders", label: "menu.purchase_orders" }, { key: "inventory-transactions", label: "menu.inventory_transactions" }] },
      { key: "admin-StockReconciliation", label: "menu.stock_reconciliation" },
    ]
  },

  // LOGISTICS
  {
    key: "delivery-group",
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
    ]
  },

  // FINANCE
  {
    key: "finance-group",
    icon: DollarSign,
    label: "menu.categories.finance",
    category: "FINANCE",
    children: [
      { key: "finance", label: "menu.family_finance" },
      { key: "customer-payment", label: "menu.customer_payment_ledger" },
      { key: "supplier-payment", label: "menu.supplier_payment_ledger" },
      { key: "expense", label: "menu.expense", children: [{ key: "expanse", label: "menu.expense" }, { key: "expanse_type", label: "menu.expense_type" }] },
    ]
  },

  // ADMINISTRATION
  {
    key: "admin-group",
    icon: Settings,
    label: "menu.categories.management",
    category: "MANAGEMENT",
    children: [
      { key: "customer", label: "menu.customer" },
      { key: "employee-management", label: "menu.employee", children: [{ key: "employee", label: "menu.employee" }, { key: "ip-Management", label: "menu.ip_management" }] },
      { key: "user-management", label: "menu.user", children: [{ key: "user", label: "menu.user" }, { key: "role", label: "menu.role" }] },
      { key: "admin-management", label: "menu.admin_management" },
      { key: "supperadmin-management", label: "menu.super_admin_management" },
      { key: "inactive_admins", label: "menu.inactive_admins" },
      { key: "permission-management", label: "menu.permission_management" },
      { key: "BranchPermissionOverride", label: "menu.branch_permission_override" },
      { key: "admin-ShiftClosing", label: "menu.shift_closing" },
      { key: "admin-DailyClosing", label: "menu.daily_closing" },
      { key: "admin-ShiftClosingChecklist", label: "menu.closing_checklist" },
      { key: "super-TelegramConfiguration", label: "menu.telegram_configuration" },
      { key: "settings", label: "menu.settings" },
    ]
  },

  // STATISTICS & REPORTS
  {
    key: "reports-group",
    icon: FileText,
    label: "menu.categories.reports",
    category: "REPORTS",
    children: [
      { key: "notifications/statistics", label: "menu.notifications_statistics" },
      { key: "report_BranchComparison", label: "menu.report_branch_comparison" },
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
    ]
  },
];

const CleanDarkLayout = () => {
  /* Dark Mode & Theme - Replaced with SettingsContext */
  const { isSettingsOpen, isDarkMode } = useSettings();
  const permisionRaw = getPermission();
  const permision = useMemo(() => permisionRaw, [JSON.stringify(permisionRaw)]);
  const { setConfig } = configStore();
  const profile = getProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [openKeys, setOpenKeys] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState(["dashboard-group"]);
  const [sidebarWidth, setSidebarWidth] = useState(260); // Default width
  const [isResizing, setIsResizing] = useState(false);
  const { changeLanguage: changeCustomLanguage } = useCustomTranslation();
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setDrawerVisible(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    changeCustomLanguage(lng);
    localStorage.setItem('language', lng);
  };

  // ✅ Filter menu by permissions & SEARCH logic
  const filteredItems = useMemo(() => {
    if (!permision || permision.length === 0) return [];

    const checkItemPermission = (item) => {
      // If it's a structural group (dashboard-group, etc.), it's visible if any child is visible
      if (item.children) {
        const visibleChildren = item.children.filter(checkItemPermission);
        if (visibleChildren.length > 0) {
          return { ...item, children: visibleChildren };
        }
        return null;
      }

      // Check permission for actual leaf items
      const hasPermission = permision.some(
        (data) => data.web_route_key === "/" + item.key ||
          (item.key === "" && data.web_route_key === "/")
      );

      return hasPermission ? item : null;
    };

    // First filter by permission
    let items = menuItems
      .map(checkItemPermission)
      .filter(Boolean);

    // Then filter by search value
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase();

      const filterBySearch = (item) => {
        const labelText = t(item.label).toLowerCase();
        const matchesLabel = labelText.includes(searchLower);

        if (item.children) {
          const visibleChildren = item.children.filter(filterBySearch);
          if (visibleChildren.length > 0 || matchesLabel) {
            return { ...item, children: visibleChildren };
          }
          return null;
        }

        return matchesLabel ? item : null;
      };

      items = items.map(filterBySearch).filter(Boolean);
    }

    return items;
  }, [permision, searchValue, t]);

  const onOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
    const rootSubmenuKeys = menuItems.map(item => item.key);

    if (rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
      setOpenKeys(keys);
    } else {
      setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
    }
  };

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

    const findIndex = (permision || []).findIndex(
      (item) => {
        const routeKey = item.web_route_key;
        if (!routeKey) return false;
        // Check for exact match or if current path starts with permitted route as a base path
        return location.pathname === routeKey || location.pathname.startsWith(routeKey + "/");
      }
    );

    if (findIndex === -1 && location.pathname !== "/login") {
      if (permision.length > 0) {
        navigate(permision[0].web_route_key);
      }
    }
  }, [location.pathname, permision, navigate]);

  // Update selected key based on location
  useEffect(() => {
    // For dynamic routes, use the base path segment as the selected key
    const pathParts = location.pathname.substring(1).split('/');
    setSelectedKey(pathParts[0]);
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

  const toggleExpanded = (key, level = 0) => {
    setExpandedKeys((prev) => {
      const isExpanded = prev.includes(key);

      // If closing, just filter it out
      if (isExpanded) {
        return prev.filter((k) => k !== key);
      }

      // If opening a top-level item (level 0), close all other level 0 items (Accordion mode)
      if (level === 0) {
        const otherRootKeys = menuItems.map(item => item.key);
        const filteredPrev = prev.filter(k => !otherRootKeys.includes(k));
        return [...filteredPrev, key];
      }

      // Otherwise just add it (allow multiple open at deeper levels)
      return [...prev, key];
    });
  };

  // ✅ RESIZE LOGIC
  const handleMouseDown = useCallback((e) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const newWidth = e.clientX - 12; // Adjusted for sidebar margin
      if (newWidth >= 200 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleMenuClick = (key) => {
    setSelectedKey(key);
    if (isMobile) setDrawerVisible(false);
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
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedKeys.includes(item.key);
    const Icon = item.icon;
    const isSelected = selectedKey === item.key;

    return (
      <div key={item.key} className={`menu-item-container level-${level}`}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.key, level);
            } else {
              handleMenuClick(item.key);
            }
          }}
          className={`hierarchical-menu-item ${isSelected ? "selected" : ""} ${collapsed && level === 0 ? "collapsed" : ""} ${hasChildren ? "has-children" : ""}`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          {Icon && <Icon size={18} className="menu-icon" />}
          {!collapsed && (
            <>
              <span className="menu-label">{t(item.label)}</span>
              {hasChildren && (
                <span className="expand-icon">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              )}
            </>
          )}
        </button>

        {hasChildren && !collapsed && (
          <div className={`submenu ${isExpanded ? 'expanded' : ''}`}>
            <div className="submenu-inner">
              {item.children.map((child) => renderMenuItem(child, level + 1))}
            </div>
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

  const sidebarContent = (
    <div className={`hierarchical-sidebar-content`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="logo-section">
          <img src={logo} alt="PETRONAS" className="logo-icon-img" />
          {(!collapsed || isMobile) && (
            <div className="logo-text">
              <div className="company-name">PETRONAS</div>
              <div className="company-subtitle">CAMBODIA</div>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      {(!collapsed || isMobile) && (
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
              {(!collapsed || isMobile) && (
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
      {(!collapsed || isMobile) && (
        <div className="sidebar-footer">
          <div className="footer-content">
            <SettingOutlined />
            <span>Version {APP_VERSION}</span>
          </div>
          <p className="footer-copyright">© {new Date().getFullYear()} PETRONAS</p>
        </div>
      )}
    </div>
  );

  return (
    <Layout style={{ minHeight: "100vh", background: 'transparent' }}>
      {/* Sidebar for Desktop */}
      {!isMobile && (
        <div
          className={`hierarchical-sidebar ${collapsed ? "collapsed" : "expanded"}`}
          style={{ width: collapsed ? "80px" : `${sidebarWidth}px` }}
        >
          {sidebarContent}
          {!collapsed && (
            <div
              className={`sidebar-resizer ${isResizing ? 'active' : ''}`}
              onMouseDown={handleMouseDown}
            />
          )}
        </div>
      )}

      {/* Sidebar for Mobile (Drawer) */}
      <Drawer
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={280}
        styles={{ body: { padding: 0 } }}
        className="mobile-sidebar-drawer"
        closable={false}
      >
        <div className="hierarchical-sidebar expanded" style={{ position: 'relative', left: 0, top: 0, bottom: 0, height: '100%', border: 'none', borderRadius: 0 }}>
          {sidebarContent}
        </div>
      </Drawer>

      {/* Main Layout */}
      <Layout style={{
        marginLeft: isMobile ? "0px" : (collapsed ? "80px" : `${sidebarWidth + 12}px`),
        transition: isResizing ? "none" : "margin-left 0.3s",
        background: 'transparent' // ✅ Make Layout transparent
      }}>
        {/* Header */}
        <Header className="clean-dark-header" style={{ background: 'transparent' }}>
          <div className="header-left">
            <div className="trigger-button" onClick={() => isMobile ? setDrawerVisible(true) : setCollapsed(!collapsed)}>
              {isMobile ? <AlignJustify /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
            </div>
          </div>

          <div className="header-right">
            <Dropdown menu={languageMenu} placement="bottomRight">
              <div className="header-icon glass-pill">
                <GlobalOutlined />
                {!isMobile && <span className="pill-label">{i18n.language === 'km' ? 'ភាសាខ្មែរ' : 'English'}</span>}
              </div>
            </Dropdown>



            <TemplateSelector isMobile={isMobile} />
            <div
              className={`header-icon glass-pill ${isFullScreen ? "active" : ""}`}
              onClick={toggleFullScreen}
            >
              {isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              {!isMobile && <span className="pill-label">{isFullScreen ? 'Exit' : 'Full'}</span>}
            </div>


            {/* <NotificationBell /> */}


            <Link to="/attendance">
              <div
                className={`header-icon glass-pill ${location.pathname === "/attendance" ? "active" : ""}`}
                title="Attendance"
              >
                <HomeOutlined />
                {!isMobile && <span className="pill-label">Attendance</span>}
              </div>
            </Link>

            <Dropdown menu={profileMenu} placement="bottomRight">
              <Space className="header-profile">
                <Avatar src={getProfileImageUrl()} size={isMobile ? 28 : 32} />
                {!isMobile && <span className="profile-name">{profile?.name}</span>}
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