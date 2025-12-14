

import React, { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import "./MainLayout.css";
import logo from "../../assets/petronas_header.png";
import ImgUser from "../../assets/profile.png";
import { useTranslation } from '../../../src/locales/TranslationContext.jsx';
import LanguageSwitcher from '../../../src/component/LanguageSwitcher.jsx';
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
import { useDarkMode } from "../DarkModeContext.jsx";

// Define the menu items with the original structure but using div and span instead of Ant Design
const items_menu = [
  {
    key: "version",
    label: "V 1.0.1",
    disabled: true,
    className: "version-item khmrt-branch petronas-tag",
  },
  {
    key: "",
    label: "ផ្ទាំងគ្រប់គ្រង",
    icon: "📊",
    className: "dashboard-item khmrt-branch petronas-sidebar-menu-item",
  },
  {
    key: "invoices",
    label: "វិក្កយបត្រ",
    icon: "🖥️",
    className: "invoices-item khmrt-branch petronas-sidebar-menu-item",
  },
  {
    key: "fakeinvoices",
    label: "វិក្កយបត្រក្លែងក្លាយ",
    icon: "🖥️",
    className: "invoices-item khmrt-branch petronas-sidebar-menu-item",
  }
  ,
  {
    key: "deliverynote",
    label: "លិខិតដឹកជញ្ជូន",
    icon: "🖥️",
    className: "invoices-item khmrt-branch petronas-sidebar-menu-item",
  },
  {
    key: "finance",
    label: "family_finance",
    icon: "🖥️",
    className: "invoices-item khmrt-branch petronas-sidebar-menu-item",
  },
  {
    key: "order",
    label: "សេចក្ដីលម្អិតវិក្កយបត្រ",
    icon: "📄",
    className: "invoices-detail-item khmrt-branch petronas-sidebar-menu-item",
  },
  {
    key: "total_due",
    label: "បញ្ជីអ្នកជំពាក់",
    icon: "💳",
    className: "invoices-detail-item khmrt-branch petronas-sidebar-menu-item",
  },
  {
    key: "payment/history",
    label: "សរុបសង",
    icon: "💳",
    className: "invoices-detail-item khmrt-branch petronas-sidebar-menu-item",
  },
  {
    label: "ផលិតផល",
    icon: "🏪",
    className: "product-menu khmrt-branch petronas-sidebar-menu-item",
    children: [
      {
        key: "product",
        label: "ឃ្លាំងបញ្ចូលស្តុកប្រេងរាវ/Terminal",
        icon: "🔐",
        className: "list-product-item khmrt-branch petronas-sidebar-submenu-item",
      },
      {
        key: "product_detail",
        label: "ព័ត៌មានលម្អិតផលិតផល",
        icon: "📋",
        className: "list-product-item khmrt-branch petronas-sidebar-submenu-item",
      }
    ],
  },
  {
    key: "category",
    label: "ប្រភេទ",
    icon: "📋",
    className: "category-item khmrt-branch petronas-sidebar-menu-item",
  },
  {
    label: "ការទិញ",
    icon: "🛒",
    className: "purchase-menu khmrt-branch petronas-sidebar-menu-item",
    children: [
      {
        key: "supplier",
        label: "អ្នកផ្គត់ផ្គង់",
        icon: "👥",
        className: "supplier-item khmrt-branch petronas-sidebar-submenu-item",
      },
    ],
  },
  {
    key: "customer",
    label: "អតិថិជន",
    icon: "👤",
    className: "list-Customer-item khmrt-branch petronas-sidebar-menu-item",
  },
  {
    label: "ចំណាយ",
    icon: "💲",
    className: "expense-menu khmrt-branch petronas-sidebar-menu-item",
    children: [
      {
        key: "expanse",
        label: "ចំណាយ",
        icon: "💲",
        className: "expense-item khmrt-branch petronas-sidebar-submenu-item",
      },
      {
        key: "expanse_type",
        label: "ប្រភេទនៃការចំណាយ",
        icon: "💲",
        className: "expense-item khmrt-branch petronas-sidebar-submenu-item",
      },
    ],
  },
  {
    label: "និយោជិក",
    icon: "👤",
    className: "employee-menu khmrt-branch petronas-sidebar-menu-item",
    children: [
      {
        key: "employee",
        label: "និយោជិក",
        icon: "👤",
        className: "employee-item khmrt-branch petronas-sidebar-submenu-item",
      },
    ],
  },
  {
    label: "អ្នកប្រើប្រាស់",
    icon: "📋",
    className: "user-menu khmrt-branch petronas-sidebar-menu-item",
    children: [
      {
        key: "user",
        label: "អ្នកប្រើប្រាស់",
        icon: "👤",
        className: "user-item khmrt-branch petronas-sidebar-submenu-item",
      },
      {
        key: "role",
        label: "តួនាទី",
        icon: "🔒",
        className: "role-item khmrt-branch petronas-sidebar-submenu-item",
      },
    ],
  },
  {
    label: "របាយការណ៍",
    icon: "📄",
    className: "report-menu khmrt-branch petronas-sidebar-menu-item",
    children: [
      {
        key: "report_Sale_Summary",
        label: "សង្ខេបការលក់",
        icon: "📊",
        className: "sale-summary-item khmrt-branch petronas-sidebar-submenu-item",
      },
      {
        key: "report_Expense_Summary",
        label: "សង្ខេបការចំណាយ",
        icon: "💲",
        className: "expense-summary-item khmrt-branch petronas-sidebar-submenu-item",
      },
      {
        key: "report_Customer",
        label: "សង្ខេបអតិថិជនថ្មី",
        icon: "👤",
        className: "new-customer-summary-item khmrt-branch petronas-sidebar-submenu-item",
      },
      {
        key: "Top_Sale",
        label: "ការលក់កំពូល",
        icon: "🏆",
        className: "top-sale-item khmrt-branch petronas-sidebar-submenu-item",
      },
    ],
  },
];

const MainLayout = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode(); // ប្រើ dark mode context
  const permision = getPermission();
  const { setConfig } = configStore();
  const [items, setItems] = useState(items_menu);
  const profile = getProfile();
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [selectedKey, setSelectedKey] = useState('');
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { t } = useTranslation();
  const dropdownRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

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
  // ✅ Add useEffect to handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

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
    <div className="admin-container flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <div className={`petronas-sidebar ${collapsed ? 'w-20' : 'w-64'} 
        bg-gradient-to-b from-blue-50 to-blue-100 
        dark:bg-gradient-to-b dark:from-gray-800 dark:to-gray-900 
        border-blue-200 dark:border-gray-700 
        shadow-md transition-all duration-300 h-screen flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="admin-sidebar-header p-4 flex justify-center items-center 
          border-b border-blue-200 dark:border-gray-700">
          {!collapsed ? (
            <div className="flex flex-col items-center space-y-1">
              <img src={logo} alt="Company Logo" className="h-12 object-contain" />
              <h1 className="text-lg font-bold text-blue-700 dark:text-blue-400">
                PETRONAS CAMBODIA
              </h1>
              <div className="text-xs text-blue-500 dark:text-blue-300">CO., LTD</div>
            </div>
          ) : (
            <img src={logo} alt="Company Logo" className="h-10 object-contain" />
          )}
        </div>

        {/* Version Tag */}
        <div className="flex justify-center my-2">
          <span className={`petronas-tag px-2 py-1 text-xs font-medium rounded-full ${isDarkMode
            ? 'bg-gray-700 text-blue-300'
            : 'bg-blue-100 text-blue-600'
            }`}>
            V 1.4.4
          </span>
        </div>

      

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-toggle-button self-end mx-2 p-1 focus:outline-none 
            text-blue-500 hover:text-blue-700 
            dark:text-blue-400 dark:hover:text-blue-300 
            transition-colors"
        >
          {collapsed ? '→' : '←'}
        </button>

        <div className="flex-1 overflow-y-auto">
          <ul className="py-2">
            {items.map((item) => (
              <li key={item.key || item.label} className="px-2 py-1">
                <div className={`${item.className} flex items-center px-3 py-2 rounded-md 
                  cursor-pointer transition-colors
                  ${selectedKey === item.key
                    ? 'bg-blue-200 text-blue-800 dark:bg-gray-700 dark:text-blue-300'
                    : 'text-blue-700 hover:bg-blue-100 dark:text-gray-300 dark:hover:bg-gray-700'
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
                      <span className="flex-1">{t(item.label)}</span>
                      {item.children && (
                        <span className="ml-auto">
                          {openSubmenus[item.label] ? '▼' : '▶'}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Submenu */}
                {!collapsed && item.children && openSubmenus[item.label] && (
                  <ul className="pl-6 mt-1">
                    {item.children.map((child) => (
                      <li key={child.key} className="mb-1">
                        <div className={`flex items-center px-3 py-2 rounded-md cursor-pointer 
                          transition-colors text-sm
                          ${selectedKey === child.key
                            ? 'bg-blue-200 text-blue-800 dark:bg-gray-700 dark:text-blue-300'
                            : 'text-blue-600 hover:bg-blue-100 dark:text-gray-400 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => onClickMenu(child)}
                        >
                          <span className="mr-3">{child.icon}</span>
                          <span>{t(child.label)}</span>
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

      <div className="admin-main-content flex-1 flex flex-col">


<header className="admin-header relative overflow-hidden">
  {/* Animated Background Particles */}
  <div className="header-particles"></div>
  
  {/* Bottom Decorative Line */}
  <div className="header-bottom-line"></div>

  <div className="relative flex items-center justify-between px-6 py-4">
    {/* Company Info Section */}
    <div className="flex-1">
      <div className="flex items-center space-x-4 mb-2">
        {/* Decorative Line */}
        <div className="decorative-line"></div>
        
        <div>
          <h1 className="text-2xl font-bold text-white dark:text-gray-100 
            tracking-wide flex items-center space-x-2">
            <span>PETRONAS CAMBODIA CO., LTD</span>
            <span className="text-yellow-400 dark:text-yellow-500 animated-emoji">⛽</span>
          </h1>
          
          <div className="flex flex-wrap gap-4 mt-2">
            {/* Branch Info Badge */}
            <div className="info-badge flex items-center space-x-2 text-white dark:text-gray-200 
              px-3 py-1.5 rounded-lg text-sm">
              <span className="animated-icon">📍</span>
              <span className="font-medium">សាខា:</span>
              <span className="font-semibold">{profile?.branch_name}</span>
            </div>
            
            {/* Address Info Badge */}
            <div className="info-badge flex items-center space-x-2 text-white dark:text-gray-200 
              px-3 py-1.5 rounded-lg text-sm">
              <span className="animated-icon">🏢</span>
              <span className="font-medium">អាសយដ្ឋាន:</span>
              <span className="font-semibold">{profile?.address}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Control Panel Section */}
    <div className="flex items-center space-x-3">
      {/* Language Switcher */}
      <LanguageSwitcher />

      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        className="control-button p-2.5 rounded-xl transition-all duration-300
          text-white dark:text-yellow-400
          hover:scale-110 active:scale-95"
        title={isDarkMode ? 'បិទងងឹត' : 'បើកងងឹត'}
      >
        {isDarkMode ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>

      {/* Fullscreen Toggle */}
      <button
        onClick={toggleFullScreen}
        className="control-button p-2.5 rounded-xl transition-all duration-300
          text-white dark:text-blue-400
          hover:scale-110 active:scale-95"
        title={isFullScreen ? 'ចាកចេញពីពេញអេក្រង់' : 'ពេញអេក្រង់'}
      >
        {isFullScreen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        )}
      </button>

      {/* Notification Button */}
      <div className="relative cursor-pointer" onClick={handleClick}>
        <button className="control-button p-2.5 rounded-xl transition-all duration-300
          text-white dark:text-gray-200">
          <GoChecklist className="w-5 h-5" />
        </button>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 
          border-2 border-blue-600 dark:border-gray-800 rounded-full notification-badge"></span>
      </div>

      {/* Time Greeting with LiveClock */}
      <div className="flex items-center space-x-2 bg-white/15 dark:bg-white/8 
        backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 dark:border-white/10
        text-white dark:text-gray-200 font-semibold text-sm">
        <KhmerTimeGreeting />
        <LiveClock />
      </div>

      {/* Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          className="control-button flex items-center gap-2 px-3 py-2 rounded-xl"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <img
            src={getProfileImageUrl()}
            className="profile-img w-8 h-8 rounded-lg object-cover"
            alt="User"
          />
          <span className="font-medium text-white dark:text-gray-200 hidden sm:inline">
            {profile?.name}
          </span>
          <svg
            className={`w-4 h-4 text-white dark:text-gray-200 transition-transform 
              ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div
            className="profile-dropdown-menu rounded-xl"
            style={{
              position: 'fixed',
              top: dropdownRef.current ?
                dropdownRef.current.getBoundingClientRect().bottom + 8 : '60px',
              right: '20px',
              zIndex: 999999,
              minWidth: '13rem',
              maxWidth: '16rem'
            }}
          >
            <div className="bg-white dark:bg-gray-800 border border-gray-200 
              dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
              <div className="py-2">
                <button
                  className="dropdown-item w-full flex items-center gap-3 px-4 py-3 text-left
                    text-gray-700 dark:text-gray-300
                    hover:bg-blue-50 dark:hover:bg-gray-700
                    transition-colors"
                  onClick={() => {
                    navigate("/profile");
                    setIsDropdownOpen(false);
                  }}
                >
                  <span className="text-xl">👤</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">My Profile</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">View your profile</p>
                  </div>
                </button>

                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                <button
                  className="dropdown-item w-full flex items-center gap-3 px-4 py-3 text-left
                    text-red-600 dark:text-red-400
                    hover:bg-red-50 dark:hover:bg-gray-700
                    transition-colors"
                  onClick={() => {
                    onLoginOut();
                    setIsDropdownOpen(false);
                  }}
                >
                  <span className="text-xl">🚪</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Logout</p>
                    <p className="text-xs opacity-75">Sign out of your account</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
</header>

        {/* Content */}
       <main className="admin-body flex-1 p-6 overflow-auto 
  bg-gray-50 dark:bg-gray-900"
  style={{ position: 'relative', zIndex: 1 }}>
          <div className="petronas-card rounded-lg shadow-sm p-6 
            bg-white dark:bg-gray-800 
            text-gray-900 dark:text-white 
            transition-colors">
            <Outlet />
          </div>
        </main>
        {/* Footer */}
        <footer className="admin-footer border-t py-3 px-6 text-center text-sm 
          bg-white dark:bg-gray-800 
          border-gray-100 dark:border-gray-700 
          text-gray-500 dark:text-gray-400 
          transition-colors">
          ©{new Date().getFullYear()} Created by PETRONAS CO.,LTD
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;