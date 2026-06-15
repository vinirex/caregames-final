import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface PointsContextData {
  points: number;
  addPoints: (amount: number) => void;
  spendPoints: (amount: number) => void;
}

const PointsContext = createContext<PointsContextData | undefined>(undefined);

export const PointsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [points, setPoints] = useState(0);
  const { userEmail } = useAuth();

  useEffect(() => {
    const loadPoints = async () => {
      if (userEmail) {
        const response = await api.getPoints(userEmail);
        if (response.success && response.points !== undefined) {
          setPoints(response.points);
        }
      }
    };
    loadPoints();
  }, [userEmail]);

  const addPoints = useCallback(async (amount: number) => {
    setPoints(prev => {
      const newPoints = prev + amount;
      if (userEmail) api.updatePoints(userEmail, newPoints);
      return newPoints;
    });
  }, [userEmail]);

  const spendPoints = useCallback(async (amount: number) => {
    setPoints(prev => {
      const newPoints = Math.max(0, prev - amount);
      if (userEmail) api.updatePoints(userEmail, newPoints);
      return newPoints;
    });
  }, [userEmail]);

  const value = useMemo(
    () => ({ points, addPoints, spendPoints }),
    [points, addPoints, spendPoints]
  );

  return (
    <PointsContext.Provider value={value}>
      {children}
    </PointsContext.Provider>
  );
};

export const usePoints = () => {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
};
