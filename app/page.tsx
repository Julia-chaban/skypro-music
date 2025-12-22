import './page.css';
import './page.mobile.css';
import Bar from './components/Bar/bar';
import Navigation from './components/Navigation/navigation';
import Centerblock from './components/Centerblock/centerblock';
import Sidebar from './components/Sidebar/sidebar';

export default function Home() {
  return (
    <div className="wrapper">
      <div className="container">
        <main className="main">
          <Navigation />
          <Centerblock />
          <Sidebar />
        </main>
        <Bar />
        <footer className="footer"></footer>
      </div>
    </div>
  );
}
