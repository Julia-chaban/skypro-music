// app/components/MainLayout/MainLayout.tsx
'use client';

import React, { useState } from 'react';
import Navigation from '../Navigation/navigation';
import Sidebar from '../Sidebar/sidebar';
import Bar from '../Bar/bar';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export default function MainLayout({ children, pageTitle }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleBurgerClick = (isOpen: boolean) => {
    setIsSidebarOpen(isOpen);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <main className={styles.main}>
          <Navigation
            onBurgerClick={handleBurgerClick}
            isSidebarOpen={isSidebarOpen}
            pageTitle={pageTitle}
          />
          {children}
          <Sidebar isOpen={isSidebarOpen} />
        </main>
        <footer className={styles.footer}></footer>
      </div>
      <Bar />
    </div>
  );
}
