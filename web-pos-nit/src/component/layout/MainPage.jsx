import { Button, Result } from "antd";
import React, { useEffect, useState } from "react";
import { getServerStatus } from "../../store/server.store";
import { useSettings } from "../../settings";

const info = {
  404: {
    message: "404-Route Not Found",
    sub: "404-Route Not Found. Please confirm your correct route that request to server",
  },
  403: {
    message: "403-Authorized",
    sub: "Sorry, you are not authorized to access this page.",
  },
  500: {
    message: "500-Internal Error Server",
    sub: "Please contact administrator",
  },
  error: {
    message: "Can not connect to server",
    sub: "Please contact administrator",
  },
};

/* Dark Mode & Theme - Replaced with SettingsContext */
export default function MainPage({ children, loading }) {
  const { isDarkMode } = useSettings();

  const server_status = getServerStatus();
  const isServerError =
    server_status == "403" ||
    server_status == "500" ||
    server_status == "404" ||
    server_status == "error";


  if (isServerError) {
    return (
      <div
        data-theme={isDarkMode ? 'dark' : 'light'}
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 dark' : 'bg-gray-50 light'
          }`}
      >
        <div className={`max-w-md w-full mx-4 p-8 rounded-lg shadow-lg text-center transition-colors ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
          }`}>
          <Result
            status={server_status + ""}
            title={
              <h1 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                {info[server_status].message}
              </h1>
            }
            subTitle={
              <p className={`text-base mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                {info[server_status].sub}
              </p>
            }
            extra={
              <Button
                type="primary"
                size="large"
                className={`${isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 border-blue-600'
                  : 'bg-blue-500 hover:bg-blue-600 border-blue-500'
                  } transition-colors`}
                onClick={() => window.location.href = '/'}
              >
                Back Home
              </Button>
            }
          />

          {/* Additional error details for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className={`mt-6 p-4 rounded-md text-left text-sm ${isDarkMode
              ? 'bg-gray-700 border border-gray-600'
              : 'bg-gray-100 border border-gray-300'
              }`}>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                }`}>
                Debug Information:
              </h3>
              <ul className={`space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                <li><strong>Status Code:</strong> {server_status}</li>
                <li><strong>Timestamp:</strong> {new Date().toISOString()}</li>
                <li><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      data-theme={isDarkMode ? 'dark' : 'light'}
      className={`transition-colors duration-300 ${isDarkMode ? 'bg-transparent text-gray-100 dark' : 'bg-transparent text-gray-900 light'
        }`}
    >
      {loading && (
        <div className="petronas-loader-overlay">
          <div className="flex flex-col items-center">
            <div className="petronas-loader-container">
              <div className="ripple-effect"></div>
              <div className="ripple-effect delay-1"></div>
              <div className="logo-pulse">
                <img src="/favicon.png" alt="Petronas" className="loading-logo" />
              </div>
            </div>
            <div className="loading-text-container">
              <span className="loading-text-main">PETRONAS</span>
              <div className="loading-progress-bar">
                <div className="loading-progress-fill"></div>
              </div>
              <span className="loading-text-sub">កំពុងដំណើរការ...</span>
            </div>
          </div>
        </div>
      )}

      <div className={`min-h-full transition-colors duration-300 ${loading ? 'opacity-70' : 'opacity-100'
        }`}>
        {children}
      </div>
    </div>
  );
}