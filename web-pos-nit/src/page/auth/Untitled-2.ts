// MainLayout.jsx - Updated with i18n
import React, { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import "./MainLayout.css";
import logo from "../../assets/petronas_header.png";
import ImgUser from "../../assets/profile.png";
import {
  getPermission,
  getProfile,
  setAcccessToken,
  setProfile,
} from "../../store/profile.store";
import { request } from "../../util/helper";
import { configStore } from "../../store/configStore";
import { Config } from "../../util/config";
import { GoChecklist } from "react-icons/go";
import KhmerTimeGreeting from "./KhmerTimeGreeting";
import LiveClock from "./LiveClock";
import LanguageSelector from "../../component/LanguageSelector";

const MainLayout = () => {
  const { t } = useTranslation();
  const permision = getPermission();
  const { setConfig } = configStore();
  const profile = getProfile();
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [selectedKey, setSelectedKey] = useState('');
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // New state for dark mode and fullscreen
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Define menu items using translation keys
  const items_menu = [
    {
      key: "version",
      label: "V 1.0.1",
      disabled: true,
      className: "version-item khmrt-branch petronas-tag",
    },
    {
      key: "",
      label: t('menu.dashboard'),
      icon: "📊",
      className: "dashboard-item khmrt-branch petronas-sidebar-menu-item",
    },
    {
      key: "invoices",
      label: t('menu.invoices'),
      icon: "🖥️",
      className: "invoices-item khmrt-branch petronas-sidebar-menu-item",
    },
    {
      key: "fakeinvoices",
      label: t('menu.fakeInvoices'),
      icon: "🖥️",
      className: "invoices-item khmrt-branch petronas-sidebar-menu-item",
    },
    {
      key: "deliverynote",
      label: t('menu.deliveryNote'),
      icon: "🖥️",
      className: "invoices-item khmrt-branch petronas-sidebar-menu-item",
    },
    {
      key: "finance",
      label: t('menu.familyFinance'),
      icon: "🖥️",
      className: "invoices-item khmrt-branch petronas-sidebar-menu-item",
    },
    {
      key: "order",
      label: t('menu.invoiceDetails'),
      icon: "📄",
      className: "invoices-detail-item khmrt-branch petronas-sidebar-menu-item",
    },
    {
      key: "total_due",
      label: t('menu.debtorsList'),
      icon: "💳",
      className: "invoices-detail-item khmrt-branch petronas-sidebar-menu-item",
    },
    {
      key: "payment/history",
      label: t('menu.paymentHistory'),
      icon: "💳",
      className: "invoices-detail-item khmrt-branch petronas-sidebar-menu-item",
    },
    {
      label: t('menu.products'),
      icon: "🏪",
      className: "product-menu khmrt-branch petronas-sidebar-menu-item",
      children: [
        {
          key: "product",
          label: t('menu.terminal'),
          icon: "🔐",
          className: "list-product-item khmrt-branch petronas-sidebar-submenu-item",
        },
        {
          key: "product_detail",
          label: t('menu.productDetails'),
          icon: "📋",
          className: "list-product-item khmrt-branch petronas-sidebar-submenu-item",
        }
      ],
    },
    {
      key: "category",
      label: t('menu.category'),
      icon: "📋",
      className: "category-item khmrt-branch petronas-sidebar-menu-item",
    },
    {
      label: t('menu.purchase'),
      icon: "🛒",
      className: "purchase-menu khmrt-branch petronas-sidebar-menu-item",
      children: [
        {
          key: "supplier",
          label: t('menu.supplier'),
          icon: "👥",
          className: "supplier-item khmrt-branch petronas-sidebar-submenu-item",
        },
      ],
    },
    {
      key: "customer",
      label: t('menu.customer'),
      icon: "👤",
      className: "list-Customer-item khmrt-branch petronas-sidebar-menu-item",
    },
    {
      label: t('menu.expense'),
      icon: "💲",
      className: "expense-menu khmrt-branch petronas-sidebar-menu-item",
      children: [
        {
          key: "expanse",
          label: t('menu.expense'),
          icon: "💲",
          className: "expense-item khmrt-branch petronas-sidebar-submenu-item",
        },
        {
          key: "expanse_type",
          label: t('menu.expenseType'),
          icon: "💲",
          className: "expense-item khmrt-branch petronas-sidebar-submenu-item",
        },
      ],
    },
    {
      label: t('menu.employee'),
      icon: "👤",
      className: "employee-menu khmrt-branch petronas-sidebar-menu-item",
      children: [
        {
          key: "employee",
          label: t('menu.employee'),
          icon: "👤",
          className: "employee-item khmrt-branch petronas-sidebar-submenu-item",
        },
      ],
    },
    {
      label: t('menu.user'),
      icon: "📋",
      className: "user-menu khmrt-branch petronas-sidebar-menu-item",
      children: [
        {
          key: "user",
          label: t('menu.user'),
          icon: "👤",
          className: "user-item khmrt-branch petronas-sidebar-submenu-item",
        },
        {
          key: "role",
          label: t('menu.role'),
          icon: "🔒",
          className: "role-item khmrt-branch petronas-sidebar-submenu-item",
        },
      ],
    },
    {
      label: t('menu.reports'),
      icon: "📄",
      className: "report-menu khmrt-branch petronas-sidebar-menu-item",
      children: [
        {
          key: "report_Sale_Summary",
          label: t('menu.saleSummary'),
          icon: "📊",
          className: "sale-summary-item khmrt-branch petronas-sidebar-submenu-item",
        },
        {
          key: "report_Expense_Summary",
          label: t('menu.expenseSummary'),
          icon: "💲",
          className: "expense-summary-item khmrt-branch petronas-sidebar-submenu-item",
        },
        {
          key: "report_Customer",
          label: t('menu.customerSummary'),
          icon: "👤",
          className: "new-customer-summary-item khmrt-branch petronas-sidebar-submenu-item",
        },
        {
          key: "Top_Sale",
          label: t('menu.topSale'),
          icon: "🏆",
          className: "top-sale-item khmrt-branch petronas-sidebar-submenu-item",
        },
      ],
    },
  ];

  const [items, setItems] = useState([]);

  useEffect(() => {
    checkISnotPermissionViewPage();
    getMenuByUser();
    getConfig();
    if (!profile) {
      navigate("/login");
    }

    // Apply dark mode class to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Check fullscreen status
    const checkFullscreen = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', checkFullscreen);
    return () => document.removeEventListener('fullscreenchange', checkFullscreen);
  }, [isDarkMode]);

  // Update menu items when translation changes
  useEffect(() => {
    getMenuByUser();
  }, [t]);

  const checkISnotPermissionViewPage = () => {
    let findIndex = permision?.findIndex(
      (item) => item.web_route_key == location.pathname
    );
    if (findIndex == -1) {
      for (let i = 0; i < permision.length; i++) {
        navigate(permision[i].web_route_key);
        break;
      }
    }
  }

  const handleClick = () => {
    navigate("/attendance");
  };

  // Dark mode toggle function
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Fullscreen toggle function
  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const getMenuByUser = () => {
    let new_items_menu = [];
    items_menu?.map((item1) => {
      const p1 = permision?.findIndex(
        (data1) => data1.web_route_key == "/" + item1.key
      );
      if (p1 != -1) {
        new_items_menu.push(item1);
      }
      if (item1?.children && item1?.children.length > 0) {
        let childTmp = [];
        item1?.children.map((data1) => {
          permision?.map((data2) => {
            if (data2.web_route_key == "/" + data1.key) {
              childTmp.push(data1);
            }
          });
        });
        if (childTmp.length > 0) {
          item1.children = childTmp;
          new_items_menu.push(item1);
        }
      }
    })
    setItems(new_items_menu)
  }

  const getConfig = async () => {
    const res = await request("config", "get");
    if (res) {
      setConfig(res);
    }
  };

  const toggleSubmenu = (key) => {
    setOpenSubmenus({
      ...openSubmenus,
      [key]: !openSubmenus[key]
    });
  };

  const onClickMenu = (item) => {
    setSelectedKey(item.key);
    if (item.key) {
      navigate("/" + item.key);
    } else {
      navigate("/");
    }
  };

  const onLoginOut = () => {
    setProfile("");
    setAcccessToken("");
    navigate("/login");
  };

  if (!profile) {
    return null;
  }

  const getProfileImageUrl = () => {
    if (!profile?.profile_image) return ImgUser;

    try {
      const imageUrl = Config.getFullImagePath(profile.profile_image);
      new URL(imageUrl);
      return imageUrl;
    } catch (error) {
      console.error("Invalid profile image URL:", error);
      return ImgUser;
    }
  };

  return (
    <div className={`admin-container flex h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
      {/* Sidebar */}
      <div
        className={`petronas-sidebar ${collapsed ? 'w-20' : 'w-64'} ${isDarkMode
            ? 'bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700'
            : 'bg-gradient-to-b from-blue-50 to-blue-100 border-blue-200'
          } shadow-md transition-all duration-300 h-screen flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className={`admin-sidebar-header p-4 flex justify-center items-center border-b ${isDarkMode ? 'border-gray-700' : 'border-blue-200'
          }`}>
          {!collapsed ? (
            <div className="flex flex-col items-center space-y-1">
              <img
                src={logo}
                alt="Company Logo"
                className="h-12 object-contain"
              />
              <h1 className={`text-lg font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'
                }`}>PETRONAS CAMBODIA</h1>
              <div className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-500'
                }`}>CO., LTD</div>
            </div>
          ) : (
            <div className="flex justify-center">
              <img
                src={logo}
                alt="Company Logo"
                className="h-10 object-contain"
              />
            </div>
          )}
        </div>

        {/* Version Tag */}
        <div className="flex justify-center my-2">
          <span className={`petronas-tag px-2 py-1 text-xs font-medium rounded-full ${isDarkMode
              ? 'bg-gray-700 text-blue-300'
              : 'bg-blue-100 text-blue-600'
            }`}>
            V 1.2.4
          </span>
        </div>

        <div>
          <LiveClock />
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`sidebar-toggle-button self-end mx-2 p-1 focus:outline-none transition-colors ${isDarkMode
              ? 'text-blue-400 hover:text-blue-300'
              : 'text-blue-500 hover:text-blue-700'
            }`}
        >
          {collapsed ? '→' : '←'}
        </button>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto">
          <ul className="py-2">
            {items.map((item) => (
              <li key={item.key || item.label} className="px-2 py-1">
                {/* Parent menu item */}
                <div
                  className={`${item.className} flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors ${selectedKey === item.key
                      ? (isDarkMode
                        ? 'bg-gray-700 text-blue-300 petronas-sidebar-menu-item-active'
                        : 'bg-blue-200 text-blue-800 petronas-sidebar-menu-item-active')
                      : (isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-blue-700 hover:bg-blue-100')
                    }`}
                  onClick={() => {
                    if (item.children) {
                      toggleSubmenu(item.label);
                    } else {
                      onClickMenu(item);
                    }
                  }}
                >
                  <span className="mr-3">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.children && (
                        <span className="ml-auto">
                          {openSubmenus[item.label] ? '▼' : '▶'}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Submenu items */}
                {!collapsed && item.children && openSubmenus[item.label] && (
                  <ul className="pl-6 mt-1">
                    {item.children.map((child) => (
                      <li key={child.key} className="mb-1">
                        <div
                          className={`${child.className} flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors ${selectedKey === child.key
                              ? (isDarkMode
                                ? 'bg-gray-700 text-blue-300 petronas-sidebar-submenu-item-active'
                                : 'bg-blue-200 text-blue-800 petronas-sidebar-submenu-item-active')
                              : (isDarkMode
                                ? 'text-gray-400 hover:bg-gray-700'
                                : 'text-blue-600 hover:bg-blue-100')
                            }`}
                          onClick={() => onClickMenu(child)}
                        >
                          <span className="mr-3 text-sm">{child.icon}</span>
                          <span className="text-sm">{child.label}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main-content flex-1 flex flex-col">
        {/* Header */}
        <header className={`admin-header transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''
          }`}>
          <div>
            <h1 className={`admin-title ${isDarkMode ? 'text-white' : ''
              }`}>PETRONAS CAMBODIA CO., LTD</h1>
            <div className="flex flex-wrap mt-1">
              <div className={`khmer-branch ${isDarkMode ? 'text-gray-300' : ''
                }`}>សាខា: {profile?.branch_name}</div>
              <div className={`khmer-branch ${isDarkMode ? 'text-gray-300' : ''
                }`}>អាសយដ្ឋាន: {profile?.address}</div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-md transition-colors ${isDarkMode
                  ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullScreen}
              className={`p-2 rounded-md transition-colors ${isDarkMode
                  ? 'bg-gray-700 text-blue-400 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullScreen ? '⤓' : '⤢'}
            </button>

            <div className="notification-icon relative cursor-pointer" onClick={handleClick}>
              <GoChecklist size={20} className={isDarkMode ? 'text-white' : ''} />
              <span className="notification-badge"></span>
            </div>

            <div>
              <KhmerTimeGreeting />
            </div>

            {/* Custom Profile Dropdown */}
            <div className="user-profile-container ml-4" ref={dropdownRef}>
              <div className="relative">
                <button
                  className={`user-profile-select flex items-center gap-2 ${isDarkMode ? 'text-white' : ''
                    }`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <img
                    src={getProfileImageUrl()}
                    className="profile-img w-8 h-8 rounded-full border border-yellow-300"
                    alt="User"
                    onError={(e) => {
                      e.target.src = ImgUser;
                      console.error("Failed to load profile image, using fallback");
                    }}
                  />
                  <span>{profile?.name}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-50 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
                    }`}>
                    <div className="py-1">
                      <button
                        className={`dropdown-item flex items-center px-4 py-2 text-sm w-full text-left transition-colors ${isDarkMode
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-700 hover:bg-blue-50'
                          }`}
                        onClick={() => {
                          navigate("/profile");
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span className="mr-2">👤</span> My Profile
                      </button>
                      <button
                        className={`dropdown-item flex items-center px-4 py-2 text-sm w-full text-left transition-colors ${isDarkMode
                            ? 'text-red-400 hover:bg-gray-700'
                            : 'text-red-600 hover:bg-red-50'
                          }`}
                        onClick={() => {
                          onLoginOut();
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span className="mr-2">🚪</span> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="admin-body flex-1 p-6 overflow-auto">
          <div className={`petronas-card rounded-lg shadow-sm p-6 transition-colors ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
            }`}>
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className={`admin-footer border-t py-3 px-6 text-center text-sm transition-colors ${isDarkMode
            ? 'bg-gray-800 border-gray-700 text-gray-400'
            : 'bg-white border-gray-100 text-gray-500'
          }`}>
          ©{new Date().getFullYear()} Created by PETRONAS CO.,LTD
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;