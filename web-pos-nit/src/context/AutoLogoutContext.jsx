// import React, { createContext, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Alert } from 'antd';
// export const AutoLogoutContext = createContext();

// export const AutoLogoutProvider = ({ children }) => {
//   const navigate = useNavigate();
//   const timeoutRef = useRef();

//   const logout = () => {
//     localStorage.removeItem('token'); // Or clear all if needed
//     navigate('/login');
//       <Alert message="Error" type="error" showIcon />
//   };

//   const resetTimer = () => {
//     clearTimeout(timeoutRef.current);
// timeoutRef.current = setTimeout(logout, 60 * 60 * 1000); // 1 hour in ms
//   };

//   useEffect(() => {
//     window.addEventListener('mousemove', resetTimer);
//     window.addEventListener('keydown', resetTimer);
//     resetTimer(); // Start timer on load

//     return () => {
//       window.removeEventListener('mousemove', resetTimer);
//       window.removeEventListener('keydown', resetTimer);
//       clearTimeout(timeoutRef.current);
//     };
//   }, []);

//   return (
//     <AutoLogoutContext.Provider value={{}}>
//       {children}
//     </AutoLogoutContext.Provider>
//   );
// };
