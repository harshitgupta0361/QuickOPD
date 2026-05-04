import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import FloatingChat from './FloatingChat';

const Layout = () => {
    const location = useLocation();
    const hiddenPaths = ['/login', '/signup'];
    const showChat = !hiddenPaths.some((path) => location.pathname.endsWith(path));

    return (
        <>
            <Navbar />
            <Outlet />
            {showChat && <FloatingChat />}
        </>
    );
};

export default Layout;
