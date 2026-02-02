import React from 'react';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <div className="gocast-layout">
      <Header />
      <main className="gocast-main">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;