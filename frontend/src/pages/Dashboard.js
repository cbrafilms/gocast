import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import DashboardTalento from '@/components/DashboardTalento';
import DashboardProductora from '@/components/DashboardProductora';

const Dashboard = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="gocast-page">
        <div className="gocast-container">
          <div className="loading-container">
            <p>Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="gocast-page">
      {user.tipo_usuario === 'talento' ? (
        <DashboardTalento user={user} />
      ) : (
        <DashboardProductora user={user} />
      )}
    </div>
  );
};

export default Dashboard;