import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Avatar, Dropdown, Space, Input, Drawer, Modal } from "antd";
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
  ClockCircleOutlined,
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
    key: "",
    icon: LayoutDashboard,
    label: "menu.dashboard",
    category: "MAIN",
  },
  {
    key: "security/dashboard",
    icon: Shield,
    label: "menu.security_dashboard",
    category: "MANAGEMENT",
  },

  // OPERATIONS
  {
    key: "invoices-parent",
    icon: FileText,
    label: "menu.invoices",
    category: "OPERATIONS",
    children: [
      { key: "invoices", label: "menu.create_invoice" },
      { key: "order", label: "menu.invoice_details" },
      { key: "fakeinvoices", label: "menu.fake_invoices" },

    ]
  },

  // {
  //   key: "EnhancedPOSOrder",
  //   icon: ShoppingCart,
  //   label: "menu.enhanced_pos_order",
  //   category: "OPERATIONS",
  //   children: [
  //     { key: "pre-order-management", label: "menu.pre_order_management" },
  //   ]
  // },


  // INVENTORY

  {
    key: "purchase",
    icon: ShoppingCart,
    label: "menu.purchase",
    category: "OPERATIONS",
    children: [
      { key: "pre-order-management", label: "menu.pre_order_management" },
      { key: "supplier", label: "menu.supplier" },
      { key: "purchase-orders", label: "menu.purchase_orders" },
      { key: "inventory-transactions", label: "menu.inventory_transactions" },
      { key: "admin-StockReconciliation", icon: Package, label: "menu.stock_reconciliation", category: "OPERATIONS", },
    ]
  },


  // LOGISTICS
  {
    key: "delivery",
    icon: ShoppingCart,
    label: "menu.delivery",
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
    key: "finance-management",
    icon: DollarSign,
    label: "menu.family_finance",
    category: "FINANCE",
    children: [
      { key: "finance", label: "menu.family_finance" },
      { key: "customer-payment", label: "menu.customer_payment_ledger" },
      { key: "supplier-payment", label: "menu.supplier_payment_ledger" },
      {
        key: "expense",
        label: "menu.expense",
        children: [
          { key: "expanse", label: "menu.expense" },
          { key: "expanse_type", label: "menu.expense_type" },
        ]
      },
    ]
  },

  // ADMINISTRATION
  // {
  //   key: "customer",
  //   icon: User,
  //   label: "menu.customer",
  //   category: "MANAGEMENT",
  // },
  {
    key: "employee-management",
    icon: Users,
    label: "menu.setup",
    category: "MANAGEMENT",
    children: [
      { key: "customer", label: "menu.customer" },
      { key: "employee", label: "menu.employee" },
      { key: "category", label: "menu.category" },
      { key: "product", label: "menu.product_list" },

      { key: "branch-permission", label: "menu.permission" }, // ✅ Added Permission item
      { key: "ip-Management", label: "menu.ip_management" },
    ]
  },

  {
    key: "user-management",
    icon: User,
    label: "menu.user",
    category: "MANAGEMENT",
    children: [
      { key: "user", label: "menu.user" },
      { key: "role", label: "menu.role" },
    ]
  },
  {
    key: "admin-management",
    icon: Users,
    label: "menu.admin_management",
    category: "MANAGEMENT",
  },
  {
    key: "supperadmin-management",
    icon: Shield,
    label: "menu.super_admin_management",
    category: "MANAGEMENT",
  },
  {
    key: "inactive_admins",
    icon: User,
    label: "menu.inactive_admins",
    category: "MANAGEMENT",
  },
  {
    key: "closing-group",
    icon: AlignJustify,
    label: "menu.closing_management",
    category: "MANAGEMENT",
    children: [
      { key: "admin-ShiftClosing", label: "menu.shift_closing" },
      { key: "admin-DailyClosing", label: "menu.daily_closing" },
      { key: "admin-ShiftClosingChecklist", label: "menu.closing_checklist" },
    ]
  },

  // STATISTICS & REPORTS
  {
    key: "notifications/statistics",
    icon: Bell,
    label: "menu.notifications_statistics",
    category: "REPORTS",
  },
  {
    key: "reports-group",
    icon: FileText,
    label: "menu.reports",
    category: "REPORTS",
    children: [
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
  {
    key: "settings-group",
    icon: Settings,
    label: "menu.settings",
    category: "SETTINGS",
    children: [
      { key: "settings", label: "menu.general_settings" },
      { key: "profile", label: "menu.my_profile" },
      { key: "permission-management", label: "menu.permission_management" },
      { key: "super-TelegramConfiguration", label: "menu.telegram_configuration" },
      { key: "logout-trigger", label: "menu.logout" },
    ]
  },
];

const CleanDarkLayout = () => {
  /* Dark Mode & Theme - Replaced with SettingsContext */
  /* Dark Mode & Theme - Replaced with SettingsContext */
  const { isSettingsOpen, isDarkMode, currentTemplate, settings } = useSettings();
  // ... (lines 356-847 remain same, I will use multiple replace chunks or just update the useSettings line and the Layout line separate if they are far apart)

  // Actually, useSettings is around line 355. Layout is line 848. I should use separate chunks.
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
  const [expandedKeys, setExpandedKeys] = useState(() => {
    // 1. Try to load from localStorage
    const saved = localStorage.getItem("sidebar_expanded_keys");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
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
    const isSuperAdmin = profile && (Number(profile.role_id) === 29 || profile.role_code === 'SUPER_ADMIN');

    let items = [];
    if (isSuperAdmin) {
      // ✅ Super Admin should only see Management & System tools
      const allowedCategories = ['MANAGEMENT', 'MAIN_SECURITY']; // Custom filter
      const blacklistedKeys = [
        'invoices-parent', 'EnhancedPOSOrder', 'fakeinvoices',
        'products', 'purchase', 'admin-StockReconciliation',
        'delivery', 'finance', 'customer-payment', 'supplier-payment',
        'expense', 'customer', 'admin-ShiftClosing', 'admin-DailyClosing',
        'admin-ShiftClosingChecklist', 'employee-management'
      ];

      items = menuItems.filter(item => {
        // Hide standard operations and reports
        if (item.category === 'OPERATIONS' ||
          item.category === 'FINANCE' ||
          item.category === 'REPORTS') {
          return false;
        }

        // Specifically blacklist certain keys if they are in other categories
        if (blacklistedKeys.includes(item.key)) {
          return false;
        }

        return true;
      }).map(item => {
        return item;
      }).filter(Boolean);
    } else {
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
      items = menuItems
        .map(checkItemPermission)
        .filter(Boolean);
    }

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
  }, [permision, searchValue, t, profile]);

  // ✅ AUTO-EXPAND parent menu on path change
  useEffect(() => {
    if (!selectedKey) return;

    // Find if the selected key is a child of any menu item
    const parentItem = menuItems.find(item =>
      item.children?.some(child => child.key === selectedKey)
    );

    if (parentItem && !expandedKeys.includes(parentItem.key)) {
      setExpandedKeys(prev => [...prev, parentItem.key]);
    }
  }, [selectedKey]);

  // ✅ PERSIST expanded keys to localStorage
  useEffect(() => {
    localStorage.setItem("sidebar_expanded_keys", JSON.stringify(expandedKeys));
  }, [expandedKeys]);

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
    const isSuperAdmin = profile && (Number(profile.role_id) === 29 || profile.role_code === 'SUPER_ADMIN');
    if (isSuperAdmin) return; // ✅ Super Admin can access any page

    const findIndex = (permision || []).findIndex(
      (item) => {
        const routeKey = item.web_route_key;
        if (!routeKey) return false;
        // Check for exact match or if current path starts with permitted route as a base path
        return location.pathname === routeKey || location.pathname.startsWith(routeKey + "/");
      }
    );

    if (findIndex === -1 && location.pathname !== "/login") {
      if (permision && permision.length > 0) {
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
  const performLogout = async () => {
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

  const handleLogout = () => {
    Modal.confirm({
      title: t("menu.logout_confirm_title"),
      content: t("menu.logout_confirm_msg"),
      okText: t("menu.yes"),
      cancelText: t("menu.no"),
      centered: true,
      onOk: () => {
        performLogout();
      },
      okButtonProps: {
        danger: true,
      },
    });
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

  const toggleExpanded = (key, level = 0, siblings = []) => {
    setExpandedKeys((prev) => {
      const isExpanded = prev.includes(key);

      // If closing, just filter it out
      if (isExpanded) {
        return prev.filter((k) => k !== key);
      }

      // Accordion mode:
      let filteredPrev = prev;
      if (level === 0) {
        // Strict Root Accordion: Close all other root keys globally
        const rootKeys = filteredMenuItems.map(m => m.key);
        filteredPrev = prev.filter(k => !rootKeys.includes(k));
      } else {
        // Standard Accordion: Close siblings at the same level
        filteredPrev = prev.filter(k => !siblings.includes(k));
      }

      return [...filteredPrev, key];
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
    if (key === "logout-trigger") {
      handleLogout();
      return;
    }
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
  const renderMenuItem = (item, level = 0, siblings = []) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedKeys.includes(item.key);
    const Icon = item.icon;
    const isSelected = selectedKey === item.key;

    return (
      <div key={item.key} className={`menu-item-container level-${level} ${settings.menuItemTemplate === 'tree' ? 'tree-node' : ''} ${hasChildren ? 'has-children' : 'leaf-node'} ${isExpanded ? 'is-expanded' : ''}`}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.key, level, siblings);
            } else {
              handleMenuClick(item.key);
            }
          }}
          className={`hierarchical-menu-item ${isSelected ? "selected" : ""} ${collapsed && level === 0 ? "collapsed" : ""} ${hasChildren ? "has-children" : ""}`}
          style={settings.menuItemTemplate === 'tree' ? {} : { paddingLeft: `${12 + level * 16}px` }}
        >
          {Icon && settings.menuItemTemplate !== 'tree' && <Icon size={18} className="menu-icon" />}
          {!collapsed && (
            <>
              <span className="menu-label">{t(item.label)}</span>
              {hasChildren && (
                <span className="expand-icon">
                  {settings.menuItemTemplate === 'tree' ? (
                    <span className="tree-toggle-box">
                      {isExpanded ? "-" : "+"}
                    </span>
                  ) : (
                    isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                  )}
                </span>
              )}
            </>
          )}
        </button>

        {hasChildren && !collapsed && (
          <div className={`submenu ${isExpanded ? 'expanded' : ''}`}>
            <div className="submenu-inner">
              {item.children.map((child) => renderMenuItem(child, level + 1, item.children.map(c => c.key)))}
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

      {/* Search - Removed from Sidebar to match design */}

      {/* Menu */}
      <div className="menu-container">
        {categories.map((category) => {
          const categoryItems = filteredMenuItems.filter(
            (item) => item.category === category
          );
          if (categoryItems.length === 0) return null;

          return (
            <div key={category} className="menu-category">
              {(!collapsed || isMobile) && category !== 'SETTINGS' && category !== 'MAIN' && (
                <div className="category-header">
                  {t(`menu.categories.${category.toLowerCase()}`)}
                </div>
              )}
              {categoryItems.map((item) => renderMenuItem(item, 0, filteredMenuItems.map(m => m.key)))}
            </div>
          );
        })}
      </div>

      {/* Footer / Profile Section */}
      <div className="sidebar-footer" style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '8px' }}
          className="sidebar-profile-info"
        >
          <Avatar src={getProfileImageUrl()} size={32} />
          {(!collapsed || isMobile) && (
            <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <span className="profile-name-text" style={{
                color: 'var(--text-primary, white)',
                fontWeight: '700',
                fontSize: '14px',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                maxWidth: '160px',
                lineHeight: '1.2'
              }}>
                {profile?.name || profile?.firstname || profile?.username || 'User'}
              </span>
              <span className="profile-logout-text"
                onClick={handleLogout}
                style={{
                  color: 'var(--text-muted, #94a3b8)',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  marginTop: '2px'
                }}>
                <LogoutOutlined style={{ fontSize: '10px' }} /> {t("menu.logout")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Layout className={`layout-root ${currentTemplate ? `template-${currentTemplate.id}` : ''}`} style={{ minHeight: "100vh", background: 'transparent' }}>
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
            <div className="trigger-button" onClick={() => isMobile ? setDrawerVisible(true) : setCollapsed(!collapsed)} style={currentTemplate?.id === 'castle' && !isMobile ? { display: 'none' } : {}}>
              {isMobile ? <AlignJustify /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
            </div>

            {currentTemplate?.id === 'castle' && !isMobile && (
              <div className="castle-header-title">
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', fontFamily: 'Playfair Display, serif' }}>
                  Good Evening <span style={{ fontWeight: '400' }}>{profile?.name?.split(' ')[0]}</span>
                </h1>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Dashboard &gt; {t(`menu.${selectedKey}`) || selectedKey}
                </div>
              </div>
            )}
          </div>

          <div className="header-right">
            {/* <Dropdown menu={languageMenu} placement="bottomRight">
              <div className="header-icon glass-pill">
                <GlobalOutlined />
                {!isMobile && <span className="pill-label">{i18n.language === 'km' ? 'ភាសាខ្មែរ' : 'English'}</span>}
              </div>
            </Dropdown> */}



            {/* Attendance Quick Access */}
            {(profile?.role_code === 'SUPER_ADMIN' || permision?.some(p => p.web_route_key === '/attendance')) && (
              <div
                className={`header-icon glass-pill ${location.pathname === '/attendance' ? 'active' : ''}`}
                onClick={() => navigate('/attendance')}
              >
                <ClockCircleOutlined />
                {!isMobile && <span className="pill-label">{t('menu.attendance')}</span>}
              </div>
            )}

            {/* <TemplateSelector isMobile={isMobile} /> */}
            <div
              className={`header-icon glass-pill ${isFullScreen ? "active" : ""}`}
              onClick={toggleFullScreen}
            >
              {isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              {!isMobile && <span className="pill-label">{isFullScreen ? 'Exit' : 'Full'}</span>}
            </div>


            {/* <NotificationBell /> */}



            {/* Profile moved to sidebar footer */}
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