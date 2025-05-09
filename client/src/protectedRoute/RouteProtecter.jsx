import { useEffect } from 'react';

const RouteProtector =  ({ children }) => {

  const token = localStorage.getItem('userToken');
  useEffect(() => {

    if (token === 'null' || !token) {
      window.location.href = '/login';
    }
  }, [token]);


  return children;
};

export default RouteProtector;
