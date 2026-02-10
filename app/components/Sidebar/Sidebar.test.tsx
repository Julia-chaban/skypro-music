import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidebar from './sidebar';
import { useAuth } from '@/app/context/AuthContext';
import { fetchApi } from '@/utils/api';

// Мокаем зависимости
jest.mock('@/app/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/utils/api', () => ({
  fetchApi: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href, onClick }: any) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  );
});

describe('Sidebar Component', () => {
  const mockLogout = jest.fn();
  const mockFetchApi = fetchApi as jest.Mock;

  const mockUseAuth = (user = null) => {
    (useAuth as jest.Mock).mockReturnValue({
      user,
      logout: mockLogout,
    });
  };

  const mockApiResponse = {
    '14': {
      '2': {
        _id: 2,
        name: 'Плейлист дня',
        items: [35, 34, 12],
      },
      '3': {
        _id: 3,
        name: '100 танцевальных хитов',
        items: [45, 46, 47],
      },
      '4': {
        _id: 4,
        name: 'Инди-заряд',
        items: [55, 56, 57],
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // Десктоп по умолчанию
    });

    mockUseAuth({ username: 'Test User' });
    mockFetchApi.mockResolvedValue(mockApiResponse);
  });

  it('renders user name correctly', () => {
    render(<Sidebar />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders guest when no user', () => {
    mockUseAuth();
    render(<Sidebar />);

    expect(screen.getByText('Гость')).toBeInTheDocument();
  });

  it('shows logout icon', () => {
    render(<Sidebar />);

    const logoutIcon = screen.getByTitle('Выйти');
    expect(logoutIcon).toBeInTheDocument();
  });

  it('calls logout when icon is clicked', () => {
    render(<Sidebar />);

    const logoutIcon = screen.getByTitle('Выйти');
    fireEvent.click(logoutIcon);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('handles Enter key on logout icon', () => {
    render(<Sidebar />);

    const logoutIcon = screen.getByTitle('Выйти');
    fireEvent.keyDown(logoutIcon, { key: 'Enter' });

    expect(mockLogout).toHaveBeenCalled();
  });

  describe('Selections loading', () => {
    it('shows loading state initially', async () => {
      mockFetchApi.mockImplementation(() => new Promise(() => {})); // Никогда не резолвится

      render(<Sidebar />);

      expect(screen.getByText('Загрузка подборок...')).toBeInTheDocument();
    });

    it('loads and displays selections successfully', async () => {
      render(<Sidebar />);

      // Должны увидеть loading сначала
      expect(screen.getByText('Загрузка подборок...')).toBeInTheDocument();

      // Ждем загрузки
      await waitFor(() => {
        expect(screen.getByAltText('Плейлист дня')).toBeInTheDocument();
        expect(
          screen.getByAltText('100 танцевальных хитов'),
        ).toBeInTheDocument();
        expect(screen.getByAltText('Инди-заряд')).toBeInTheDocument();
      });

      // Проверяем, что API было вызвано правильно
      expect(mockFetchApi).toHaveBeenCalledWith('/catalog/selection/all');
    });

    it('handles API error gracefully', async () => {
      mockFetchApi.mockRejectedValue(new Error('API Error'));

      render(<Sidebar />);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Не удалось загрузить подборки. Используем стандартные.',
          ),
        ).toBeInTheDocument();
      });

      // Должны быть отображены дефолтные подборки
      expect(screen.getByAltText('Плейлист дня')).toBeInTheDocument();
      expect(screen.getByAltText('100 танцевальных хитов')).toBeInTheDocument();
      expect(screen.getByAltText('Инди-заряд')).toBeInTheDocument();
    });

    it('shows retry button on error', async () => {
      mockFetchApi.mockRejectedValue(new Error('API Error'));

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('Повторить')).toBeInTheDocument();
      });

      // Кликаем retry
      const retryButton = screen.getByText('Повторить');
      fireEvent.click(retryButton);

      expect(mockFetchApi).toHaveBeenCalledTimes(2);
    });
  });

  describe('Image handling', () => {
    it('uses default image on error', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        const selectionImage = images.find((img) => img.alt === 'Плейлист дня');

        if (selectionImage) {
          fireEvent.error(selectionImage);
          expect(selectionImage).toHaveAttribute('src', '/img/playlist01.png');
        }
      });
    });
  });

  describe('Mobile behavior', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768, // Мобильный
      });
    });

    it('shows overlay on mobile when open', () => {
      render(<Sidebar isOpen={true} />);

      const overlay = document.querySelector('.sidebar__overlay');
      expect(overlay).toHaveClass('active');
    });

    it('closes sidebar when overlay is clicked', () => {
      render(<Sidebar isOpen={true} />);

      const overlay = document.querySelector('.sidebar__overlay');
      expect(overlay).toHaveClass('active');

      if (overlay) {
        fireEvent.click(overlay);
        expect(overlay).not.toHaveClass('active');
      }
    });

    it('closes sidebar on mobile when selection is clicked', async () => {
      render(<Sidebar isOpen={true} />);

      await waitFor(() => {
        const selectionLink = screen.getByAltText('Плейлист дня').closest('a');

        if (selectionLink) {
          fireEvent.click(selectionLink);
        }
      });

      // Проверяем, что консоль логируется
      expect(console.log).toHaveBeenCalledWith(
        '🎯 Клик по подборке в сайдбаре:',
        expect.objectContaining({
          id: '2',
          name: 'Плейлист дня',
        }),
      );
    });
  });

  describe('Selection links', () => {
    it('generates correct links for selections', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        const links = screen.getAllByRole('link');

        expect(links[1]).toHaveAttribute('href', '/?collection=2');
        expect(links[2]).toHaveAttribute('href', '/?collection=3');
        expect(links[3]).toHaveAttribute('href', '/?collection=4');
      });
    });
  });

  it('handles window resize', async () => {
    render(<Sidebar isOpen={true} />);

    // Начинаем с десктопа
    const sidebar = document.querySelector('.main__sidebar');
    expect(sidebar).toHaveClass('open');

    // Меняем на мобильный
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    window.dispatchEvent(new Event('resize'));

    // Должен остаться открытым на мобильном
    await waitFor(() => {
      expect(sidebar).toHaveClass('open');
    });
  });
});
