// import React from "react";
// import { useNavigate } from "react-router-dom";
// import { Carousel } from "antd";
// import Banner1 from "../../assets/pertronaspic.jpg";
// import Banner2 from "../../assets/Baner2.jpg";
// import Banner3 from "../../assets/Baner3.jpg";
// import Banner4 from "../../assets/Baner4.jpg";
// import Banner5 from "../../assets/Baner5.jpg"; 
// import Banner6 from "../../assets/Baner6.jpg"; 
// import Banner7 from "../../assets/Baner7.jpg"; 

// const AboutHomepage = () => {
//   const navigate = useNavigate();

//   const clicklogin = () => {
//     navigate("/login");
//   };

//   return (
//     <div className="about-container">
//       {/* Navbar */}
//       <nav className="navbar">
//         <h1 className="logo">PETRONAS CAMBODIA</h1>
//         <div className="nav-links">
//           <a href="#">Business</a>
//           <a href="#">Products</a>
//           <a href="#">About</a>
//           <a href="#">Careers</a>
//           <a href="#">Contact</a>
//           <button onClick={clicklogin} className="login-btn">
//             Login
//           </button>
//         </div>
//       </nav>

//       {/* Hero Section with Carousel */}
//       <Carousel autoplay >
//         {[Banner1, Banner5, Banner3, Banner4].map((image, index) => (
//           <div key={index} className="carousel-slide">
//             <img src={image} alt={`Slide ${index + 1}`} className="carousel-image" />
//           </div>
//         ))}
//       </Carousel>

//       {/* Initiatives Section */}
//       <div className="initiatives">
//         {[Banner2, Banner3, Banner4, Banner5, Banner6, Banner7].map((banner, index) => (
//           <div key={index} className="initiative">
//             <img src={banner} alt={`News ${index + 1}`} />
//             <h3 className="title">Location {index + 1}</h3>
//             <p className="text">Our commitment to community and sustainability.</p>
//           </div>
//         ))}
//       </div>

//       {/* Footer */}
//       <footer className="footer">
//         <p>&copy; 2025 PETRONAS</p>
//         <div className="footer-links">
//           <a href="#">Privacy</a>
//           <a href="#">Terms</a>
//           <a href="#">Accessibility</a>
//           <a href="#">Contact</a>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default AboutHomepage;
