
import Link from 'next/link';

export default function NotFound() {
  return (
    <div>
      <h1>404 - Страница не найдена</h1>
      <Link href="/">Вернуться на главную</Link>
    </div>
  );
}
