import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Users, Globe, Zap, Award, Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import {  useNavigate } from "react-router-dom";

const AboutHomepage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();

  // Sample images - replace with actual PETRONAS images
  const carouselImages = [
    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1564094591045-6aaf5ec8c85e?w=1200&h=600&fit=crop"
  ];

  const initiatives = [
    {
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=250&fit=crop",
      title: "Oil & Gas Exploration",
      description: "Advanced exploration technologies for sustainable energy development in Cambodia."
    },
    {
      image: "https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=400&h=250&fit=crop",
      title: "Retail Fuel Stations",
      description: "Comprehensive network of modern fuel stations across Cambodia."
    },
    {
      image: "https://images.unsplash.com/photo-1566228015668-4c45dbc4e2f5?w=400&h=250&fit=crop",
      title: "Industrial Solutions",
      description: "Premium lubricants and industrial chemicals for various sectors."
    },
    {
      image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=250&fit=crop",
      title: "Renewable Energy",
      description: "Investing in sustainable energy solutions for Cambodia's future."
    },
    {
      image: "https://images.unsplash.com/photo-1562184552-c0217ce0e97b?w=400&h=250&fit=crop",
      title: "Community Development",
      description: "Supporting local communities through education and development programs."
    },
    {
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop",
      title: "Technology Innovation",
      description: "Cutting-edge technology solutions for energy efficiency and sustainability."
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const clicklogin = () => {
    navigate("/login");
    console.log("Navigate to login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg py-2' 
          : 'bg-transparent py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center">
              <Zap className="text-white w-6 h-6" />
            </div>
            <h1 className={`text-xl font-bold transition-colors ${
              isScrolled ? 'text-gray-800' : 'text-white'
            }`}>
              PETRONAS CAMBODIA
            </h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {['Business', 'Products', 'About', 'Careers', 'Contact'].map((item) => (
              <a 
                key={item}
                href="#" 
                className={`font-medium transition-all hover:scale-105 ${
                  isScrolled 
                    ? 'text-gray-700 hover:text-green-600' 
                    : 'text-white hover:text-green-200'
                }`}
              >
                {item}
              </a>
            ))}
            <button 
              onClick={clicklogin}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-full font-medium hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-lg"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Carousel */}
      <div className="relative h-screen overflow-hidden">
        <div 
          className="flex transition-transform duration-700 ease-in-out h-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {carouselImages.map((image, index) => (
            <div key={index} className="min-w-full h-full relative">
              <img 
                src={image} 
                alt={`Energy Innovation ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            </div>
          ))}
        </div>
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-6 text-white">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                Powering
                <span className="block bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Cambodia's Future
                </span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-200 leading-relaxed">
                Leading energy solutions for sustainable development, innovation, and community growth across Cambodia.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-4 rounded-full font-semibold text-lg hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-xl flex items-center">
                  <Play className="w-5 h-5 mr-2" />
                  Explore Our Services
                </button>
                <button className="border-2 border-white/30 px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all backdrop-blur-sm">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Navigation */}
        <button 
          onClick={prevSlide}
          className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-full transition-all"
        >
          <ChevronLeft className="text-white w-6 h-6" />
        </button>
        <button 
          onClick={nextSlide}
          className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-full transition-all"
        >
          <ChevronRight className="text-white w-6 h-6" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide ? 'bg-white scale-125' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gradient-to-r from-green-600 to-green-800 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Globe, number: "25+", label: "Fuel Stations" },
              { icon: Users, number: "500+", label: "Local Employees" },
              { icon: Award, number: "15+", label: "Years in Cambodia" },
              { icon: Zap, number: "100%", label: "Quality Commitment" }
            ].map((stat, index) => (
              <div key={index} className="transform hover:scale-105 transition-all">
                <stat.icon className="w-12 h-12 mx-auto mb-4 text-green-200" />
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-green-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Business Areas */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Our Business Areas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From upstream exploration to downstream retail, we deliver comprehensive energy solutions across Cambodia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {initiatives.map((initiative, index) => (
              <div 
                key={index}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2"
              >
                <div className="relative overflow-hidden">
                  <img 
                    src={initiative.image} 
                    alt={initiative.title}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-green-600 transition-colors">
                    {initiative.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {initiative.description}
                  </p>
                  <button className="text-green-600 font-semibold flex items-center group-hover:text-green-700 transition-colors">
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="py-20 bg-gradient-to-br from-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Power Your Business?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Join thousands of businesses across Cambodia who trust PETRONAS for their energy needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <div className="flex items-center space-x-3">
              <Phone className="w-6 h-6 text-green-400" />
              <span className="text-lg">+855 (0) 23 123 456</span>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-6 h-6 text-green-400" />
              <span className="text-lg">info@petronas.com.kh</span>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-6 h-6 text-green-400" />
              <span className="text-lg">Phnom Penh, Cambodia</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center">
                  <Zap className="text-white w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">PETRONAS</h3>
              </div>
              <p className="text-gray-400">
                Leading the energy transition in Cambodia with sustainable solutions and community commitment.
              </p>
            </div>
            
            {[
              {
                title: "Business",
                links: ["Upstream", "Downstream", "Petrochemicals", "Gas & Power"]
              },
              {
                title: "Products",
                links: ["Fuel", "Lubricants", "Chemicals", "LPG"]
              },
              {
                title: "Company",
                links: ["About Us", "Careers", "News", "Sustainability"]
              }
            ].map((section, index) => (
              <div key={index}>
                <h4 className="font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href="#" className="text-gray-400 hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; 2025 PETRONAS. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Accessibility'].map((item) => (
                <a key={item} href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutHomepage;