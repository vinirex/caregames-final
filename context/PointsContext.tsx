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
  const [points, setPoints] = useState(0);
  const { userEmail } = useAuth();
  const activeEmail = userEmail || '';

  const loadPoints = useCallback(async () => {
    try {
      if (activeEmail) {
        const response = await api.getPoints(activeEmail);
        if (response.success && response.points !== undefined) {
          setPoints(response.points);
        }
      }
    } catch (e) {
      console.error('Failed to load points:', e);
    }
  }, [activeEmail]);

  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  const addPoints = useCallback(async (amount: number) => {
    setPoints(prev => prev + amount);
    await loadPoints();
  }, [loadPoints]);

  const spendPoints = useCallback(async (amount: number) => {
    const res = await api.spendPoints(amount, 'Resgate de benefício');
    if (res.success && res.points !== undefined) {
      setPoints(res.points);
    } else {
      await loadPoints();
    }
  }, [loadPoints]);

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
