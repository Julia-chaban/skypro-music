import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidebar from './sidebar';
import { useAuth } from '@/app/context/AuthContext';
import { fetchApi } from '@/utils/api';

jest.mock('@/app/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/utils/api', () => ({
  fetchApi: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

describe('Sidebar', () => {
  const mockLogout = jest.fn();
  const mockFetchApi = fetchApi as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { username: 'Test User' },
      logout: mockLogout,
    });
    mockFetchApi.mockResolvedValue({});
  });

  it('отображает имя пользователя', async () => {
    render(<Sidebar />);
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('отображает "Гость" если нет пользователя', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      logout: mockLogout,
    });
    render(<Sidebar />);
    await waitFor(() => {
      expect(screen.getByText('Гость')).toBeInTheDocument();
    });
  });

  it('показывает иконку выхода', async () => {
    render(<Sidebar />);
    await waitFor(() => {
      expect(screen.getByTitle('Выйти')).toBeInTheDocument();
    });
  });

  it('вызывает logout при клике на иконку', async () => {
    render(<Sidebar />);
    await waitFor(() => {
      const logoutIcon = screen.getByTitle('Выйти');
      fireEvent.click(logoutIcon);
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
