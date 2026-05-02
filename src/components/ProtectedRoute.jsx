import React, { useEffect, useRef } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowGuest = false }) => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAuthenticated = allowGuest ? !!user : (user && !user.isGuest);
    const navigate = useNavigate();
    const alertShown = useRef(false);

    useEffect(() => {
        if (!isAuthenticated && !alertShown.current) {
            alertShown.current = true;
            alert("Please login to use this feature.");
            navigate("/login", { replace: true });
        }
    }, [isAuthenticated, navigate]);

    if (!isAuthenticated) {
        return null;
    }

    return <Outlet />;
};

export default ProtectedRoute;
