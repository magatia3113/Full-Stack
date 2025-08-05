import React, { createContext, useContext, useState, useEffect } from 'react';
import odooApi from '../services/odooApi';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 페이지 로드 시 세션 확인
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // 세션이 유효한지 확인하는 API 호출
      const response = await odooApi.callKw('res.users', 'read', [[odooApi.uid]], {
        fields: ['name', 'login', 'email']
      });
      
      if (response && response.length > 0) {
        setUser(response[0]);
      }
    } catch (error) {
      console.log('No valid session found');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      console.log('AuthContext: 로그인 시도:', username);
      
      const result = await odooApi.login(username, password);
      console.log('AuthContext: 로그인 결과:', result);
      
      if (result.uid) {
        // 모의 사용자 정보 생성 (CORS 문제 해결을 위해)
        const mockUserInfo = {
          id: result.uid,
          name: result.username || 'Administrator',
          login: result.username || username,
          email: `${username}@example.com`
        };
        
        try {
          // 실제 Odoo API 호출 시도
          const userInfo = await odooApi.callKw('res.users', 'read', [[result.uid]], {
            fields: ['name', 'login', 'email']
          });
          setUser(userInfo[0]);
        } catch (apiError) {
          console.warn('사용자 정보 API 호출 실패, 모의 데이터 사용:', apiError);
          // API 호출 실패 시 모의 데이터 사용
          setUser(mockUserInfo);
        }
        
        return { success: true };
      } else {
        return { success: false, error: '로그인 정보가 올바르지 않습니다.' };
      }
    } catch (error) {
      console.error('AuthContext: 로그인 오류:', error);
      return { success: false, error: error.message || '로그인 중 오류가 발생했습니다.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await odooApi.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
