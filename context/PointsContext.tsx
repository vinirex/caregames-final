import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface PointsContextData {
  points: number;
  addPoints: (amount: number) => Promise<void>;
  spendPoints: (amount: number) => Promise<void>;
  refreshPoints: () => Promise<void>;
}

const PointsContext = createContext<PointsContextData | undefined>(undefined);

export const PointsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [points, setPoints] = useState(1250);
  const { userEmail } = useAuth();
  const activeEmail = userEmail || 'test@test.com';

  const loadPoints = useCallback(async () => {
    try {
      const response = await api.getPoints(activeEmail);
      if (response.success && response.points !== undefined) {
        setPoints(response.points);
      }
    } catch (e) {
      console.error('Failed to load points:', e);
    }
  }, [activeEmail]);

  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  const addPoints = useCallback(async (amount: number) => {
    setPoints(prev => {
      const newPoints = prev + amount;
      api.updatePoints(activeEmail, newPoints);
      return newPoints;
    });
  }, [activeEmail]);

  const spendPoints = useCallback(async (amount: number) => {
    setPoints(prev => {
      const newPoints = Math.max(0, prev - amount);
      api.updatePoints(activeEmail, newPoints);
      return newPoints;
    });
  }, [activeEmail]);

  const value = useMemo(
    () => ({ points, addPoints, spendPoints, refreshPoints: loadPoints }),
    [points, addPoints, spendPoints, loadPoints]
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
