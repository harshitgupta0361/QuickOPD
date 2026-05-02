import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import FloatingChat from './FloatingChat';

const Layout = () => {
    return (
        <>
            <Navbar />
            <Outlet />
            <FloatingChat />
        </>
    );
};

export default Layout;
