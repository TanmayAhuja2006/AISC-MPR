import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import './Layout.css';

export default function Layout({ children, hideFooter = false }) {
  return (
    <div className="layout">
      <Navbar />
      <main className="layout__main">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}
