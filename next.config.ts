/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Явно указываем использовать webpack (или настраиваем turbopack)
  // Вариант A: Отключаем turbopack, используем webpack
  // Вариант B: Настраиваем turbopack

  // Для начала отключим turbopack
  experimental: {
    turbo: {
      // Конфигурация turbopack
    },
  },

  images: {
    unoptimized: true,
  },

  async headers() {
    return [
      {
        source: '/icon/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/img/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Webpack конфиг для SVG
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgo: false,
          },
        },
      ],
    });

    return config;
  },
};

module.exports = nextConfig;
