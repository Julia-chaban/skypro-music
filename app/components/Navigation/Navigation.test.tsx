import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navigation from './navigation';
import { useAuth } from '@/app/context/AuthContext';

// Мокаем useAuth
jest.mock('@/app/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Мокаем next/link
jest.mock('next/link', () => {
  return ({ children, href, onClick }: any) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  );
});

// Мокаем next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, priority }: any) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      data-priority={priority}
    />
  ),
}));

describe('Navigation Component', () => {
  const mockOnSidebarToggle = jest.fn();
  const mockLogout = jest.fn();

  const mockUseAuth = (isAuthenticated = false, user = null) => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated,
      user,
      logout: mockLogout,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // Десктоп по умолчанию
    });

    mockUseAuth(false);
  });

  it('renders logo correctly', () => {
    render(<Navigation />);

    const logo = screen.getByAltText('logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/img/logo.png');
  });

  it('renders burger menu', () => {
    render(<Navigation />);

    const burger = screen.getByRole('button');
    expect(burger).toBeInTheDocument();
    expect(burger).toHaveClass('nav__burger');
  });

  it('shows desktop menu items for non-authenticated user', () => {
    render(<Navigation />);

    expect(screen.getByText('Главное')).toBeInTheDocument();
    expect(screen.getByText('Войти')).toBeInTheDocument();
    expect(screen.queryByText('Мои треки')).not.toBeInTheDocument();
    expect(screen.queryByText('Выйти')).not.toBeInTheDocument();
  });

  it('shows desktop menu items for authenticated user', () => {
    mockUseAuth(true, { username: 'Test User' });
    render(<Navigation />);

    expect(screen.getByText('Главное')).toBeInTheDocument();
    expect(screen.getByText('Мои треки')).toBeInTheDocument();
    expect(screen.getByText('Выйти')).toBeInTheDocument();
    expect(screen.queryByText('Войти')).not.toBeInTheDocument();
  });

  it('toggles desktop menu when burger is clicked', () => {
    render(<Navigation onSidebarToggle={mockOnSidebarToggle} />);

    const burger = screen.getByRole('button');

    // Начальное состояние
    expect(burger).not.toHaveClass('active');

    // Кликаем
    fireEvent.click(burger);

    // Проверяем вызов функции и класс
    expect(mockOnSidebarToggle).toHaveBeenCalledWith(true);
    expect(burger).toHaveClass('active');

    // Кликаем еще раз
    fireEvent.click(burger);
    expect(mockOnSidebarToggle).toHaveBeenCalledWith(false);
  });

  it('calls logout when logout button is clicked', () => {
    mockUseAuth(true);
    render(<Navigation />);

    const logoutButton = screen.getByText('Выйти');
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('closes menu when link is clicked', () => {
    mockUseAuth(true);
    render(<Navigation onSidebarToggle={mockOnSidebarToggle} />);

    // Открываем меню
    const burger = screen.getByRole('button');
    fireEvent.click(burger);

    // Кликаем на ссылку
    const mainLink = screen.getByText('Главное');
    fireEvent.click(mainLink);

    expect(mockOnSidebarToggle).toHaveBeenCalledWith(false);
  });

  it('handles Enter key on burger menu', () => {
    render(<Navigation onSidebarToggle={mockOnSidebarToggle} />);

    const burger = screen.getByRole('button');

    fireEvent.keyDown(burger, { key: 'Enter' });

    expect(mockOnSidebarToggle).toHaveBeenCalledWith(true);
  });

  describe('Mobile behavior', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768, // Мобильный
      });

      // Триггерим resize event
      window.dispatchEvent(new Event('resize'));
    });

    it('shows mobile menu when burger is clicked on mobile', () => {
      render(<Navigation />);

      const burger = screen.getByRole('button');

      // Начальное состояние
      expect(burger).not.toHaveClass('active');

      // Кликаем
      fireEvent.click(burger);
      expect(burger).toHaveClass('active');

      // Проверяем, что мобильное меню появилось
      expect(screen.getByText('Главное')).toBeInTheDocument();
    });

    it('closes mobile menu when clicking overlay', () => {
      mockUseAuth(true);
      render(<Navigation />);

      const burger = screen.getByRole('button');

      // Открываем меню
      fireEvent.click(burger);
      expect(burger).toHaveClass('active');

      // Кликаем на ссылку (закрывает меню)
      const mainLink = screen.getByText('Главное');
      fireEvent.click(mainLink);

      expect(burger).not.toHaveClass('active');
    });

    it('handles window resize', async () => {
      render(<Navigation />);

      // Начинаем с мобильного
      const burger = screen.getByRole('button');
      fireEvent.click(burger);
      expect(burger).toHaveClass('active');

      // Меняем на десктоп
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      window.dispatchEvent(new Event('resize'));

      // На мобильном меню должно закрыться
      await waitFor(() => {
        expect(burger).not.toHaveClass('active');
      });
    });
  });

  it('logs authentication state on mount', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    mockUseAuth(true);

    render(<Navigation />);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Navigation: isAuthenticated =',
      true,
    );

    consoleSpy.mockRestore();
  });
});
