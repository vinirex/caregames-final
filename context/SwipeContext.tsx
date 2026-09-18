import React, { createContext, useContext, useState } from 'react';
import { View } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { router, usePathname } from 'expo-router';

export const MAIN_TAB_ROUTES = [
  '/home',
  '/desafios',
  '/rankings',
  '/wearables',
  '/beneficios',
] as const;

export type TabRoute = typeof MAIN_TAB_ROUTES[number];

interface SwipeContextType {
  isSwipeEnabled: boolean;
  setSwipeEnabled: (enabled: boolean) => void;
  navigateToNext: () => boolean;
  navigateToPrev: () => boolean;
  currentTabIndex: number;
  totalTabs: number;
  activeRoute: string;
}

const SwipeContext = createContext<SwipeContextType | undefined>(undefined);

export function SwipeProvider({ children }: { children: React.ReactNode }) {
  const [isSwipeEnabled, setSwipeEnabled] = useState<boolean>(true);
  const pathname = usePathname();

  // Determine index of active route in main tabs
  const getActiveIndex = () => {
    return MAIN_TAB_ROUTES.findIndex(
      (route) => pathname === route || (route === '/home' && (pathname === '/' || pathname === '/home'))
    );
  };

  const currentTabIndex = getActiveIndex();
  const isMainTab = currentTabIndex !== -1;

  const navigateToNext = () => {
    if (currentTabIndex >= 0 && currentTabIndex < MAIN_TAB_ROUTES.length - 1) {
      router.push(MAIN_TAB_ROUTES[currentTabIndex + 1]);
      return true;
    }
    return false;
  };

  const navigateToPrev = () => {
    if (currentTabIndex > 0) {
      router.push(MAIN_TAB_ROUTES[currentTabIndex - 1]);
      return true;
    }
    return false;
  };

  const handleGestureStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, translationY, velocityX } = event.nativeEvent;

      // Check that horizontal movement dominates vertical scrolling
      const isHorizontalDrag = Math.abs(translationX) > Math.abs(translationY) * 1.25;

      if (isHorizontalDrag) {
        // Swipe Left (finger moves left, translationX < 0) -> Next Tab
        if (translationX < -50 || velocityX < -400) {
          navigateToNext();
        }
        // Swipe Right (finger moves right, translationX > 0) -> Previous Tab
        else if (translationX > 50 || velocityX > 400) {
          navigateToPrev();
        }
      }
    }
  };

  return (
    <SwipeContext.Provider
      value={{
        isSwipeEnabled,
        setSwipeEnabled,
        navigateToNext,
        navigateToPrev,
        currentTabIndex,
        totalTabs: MAIN_TAB_ROUTES.length,
        activeRoute: pathname,
      }}
    >
      {isSwipeEnabled && isMainTab ? (
        <PanGestureHandler
          onHandlerStateChange={handleGestureStateChange}
          activeOffsetX={[-25, 25]}
          failOffsetY={[-35, 35]}
        >
          <View style={{ flex: 1 }}>{children}</View>
        </PanGestureHandler>
      ) : (
        children
      )}
    </SwipeContext.Provider>
  );
}

export function useSwipe() {
  const context = useContext(SwipeContext);
  if (!context) {
    throw new Error('useSwipe must be used within a SwipeProvider');
  }
  return context;
}
