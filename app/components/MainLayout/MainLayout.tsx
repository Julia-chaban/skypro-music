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

  const handleSidebarToggle = (isOpen: boolean) => {
    setIsSidebarOpen(isOpen);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.main}>
          {/* Навигация слева */}
          <Navigation
            onSidebarToggle={handleSidebarToggle}
            pageTitle={pageTitle}
          />

          {/* Центральный блок */}
          <div className={styles.centerContent}>{children}</div>

          {/* Сайдбар справа */}
          <Sidebar isOpen={isSidebarOpen} />
        </div>
        <footer className={styles.footer}></footer>
      </div>
      <Bar />
    </div>
  );
}
