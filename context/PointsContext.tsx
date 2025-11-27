import React, { createContext, useState, useContext, ReactNode } from 'react';

interface PointsContextData {
  points: number;
  addPoints: (amount: number) => void;
  spendPoints: (amount: number) => void;
}

const PointsContext = createContext<PointsContextData | undefined>(undefined);

export const PointsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [points, setPoints] = useState(0);

  const addPoints = (amount: number) => {
    setPoints(prevPoints => prevPoints + amount);
  };

  const spendPoints = (amount: number) => {
    setPoints(prevPoints => Math.max(0, prevPoints - amount));
  };

  return (
    <PointsContext.Provider value={{ points, addPoints, spendPoints }}>
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
