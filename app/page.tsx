'use client';

import './page.css';
import './page.mobile.css';
import Navigation from './components/Navigation/navigation';
import Centerblock from './components/Centerblock/centerblock';
import Sidebar from './components/Sidebar/sidebar';
import { useState } from 'react';

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleBurgerClick = (isOpen: boolean) => {
    setIsSidebarOpen(isOpen);
  };

  return (
    <div className="wrapper">
      <div className="container">
        <main className="main">
          <Navigation
            onBurgerClick={handleBurgerClick}
            isSidebarOpen={isSidebarOpen}
          />
          <Centerblock />
          <Sidebar isOpen={isSidebarOpen} />
        </main>
        <footer className="footer"></footer>
      </div>
    </div>
  );
}
