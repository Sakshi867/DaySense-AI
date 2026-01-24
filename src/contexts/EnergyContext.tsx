import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EnergyState, getEnergyState } from '@/constants/mockData';

interface EnergyContextType {
  energyLevel: number;
  setEnergyLevel: (level: number) => void;
  energyState: EnergyState;
  northStar: string;
  setNorthStar: (goal: string) => void;
  checkInCompleted: boolean;
  setCheckInCompleted: (completed: boolean) => void;
}

const EnergyContext = createContext<EnergyContextType | undefined>(undefined);

export const EnergyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Local state for immediate UI feedback (the BioOrb glowing)
  const [energyLevel, setEnergyLevel] = useState(3);
  const [northStar, setNorthStar] = useState('');
  const [checkInCompleted, setCheckInCompleted] = useState(false);
  
  const energyState = getEnergyState(energyLevel);
  
  // Sync UI with Auth Profile only when the user first loads
  // This ensures the BioOrb matches the database on login/refresh
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.energy_level !== undefined && user.energy_level !== null) {
        setEnergyLevel(user.energy_level);
      }
      if (user.north_star) {
        setNorthStar(user.north_star);
      }
      // Use the explicit onboarding flag from the database
      setCheckInCompleted(!!user.onboarding_completed);
    }
  }, [isAuthenticated, user?.id]); // Only re-run if the User ID changes

  // Apply data-energy attribute to document for CSS theming (Shared logic)
  useEffect(() => {
    document.documentElement.setAttribute('data-energy', energyState);
    return () => {
      document.documentElement.removeAttribute('data-energy');
    };
  }, [energyState]);
  
  return (
    <EnergyContext.Provider
      value={{
        energyLevel,
        setEnergyLevel,
        energyState,
        northStar,
        setNorthStar,
        checkInCompleted,
        setCheckInCompleted,
      }}
    >
      {children}
    </EnergyContext.Provider>
  );
};

export const useEnergy = (): EnergyContextType => {
  const context = useContext(EnergyContext);
  if (!context) {
    throw new Error('useEnergy must be used within an EnergyProvider');
  }
  return context;
};