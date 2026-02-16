import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navigation from './navigation';
import { useAuth } from '@/app/context/AuthContext';

jest.mock('@/app/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

describe('Navigation', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      logout: mockLogout,
    });
  });

  it('рендерит логотип', () => {
    render(<Navigation />);
    expect(screen.getByAltText('logo')).toBeInTheDocument();
  });

  it('показывает "Войти" для неавторизованного', () => {
    render(<Navigation />);
    expect(screen.getByText('Войти')).toBeInTheDocument();
    expect(screen.queryByText('Выйти')).not.toBeInTheDocument();
  });

  it('показывает "Выйти" для авторизованного', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      logout: mockLogout,
    });
    render(<Navigation />);
    expect(screen.getByText('Выйти')).toBeInTheDocument();
    expect(screen.queryByText('Войти')).not.toBeInTheDocument();
  });

  it('вызывает logout при клике', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      logout: mockLogout,
    });
    render(<Navigation />);
    fireEvent.click(screen.getByText('Выйти'));
    expect(mockLogout).toHaveBeenCalled();
  });
});
