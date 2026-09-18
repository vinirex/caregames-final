import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_STORAGE_KEY = '@caregames_wearable_sync_enabled';

export interface HealthContextType {
  steps: number;
  heartRate: number | null;
  isAvailable: boolean;
  syncEnabled: boolean;
  setSyncEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastSyncTime: string;
  refreshHealthData: () => Promise<void>;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const [steps, setSteps] = useState<number>(0);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [syncEnabled, setSyncEnabledState] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Agora mesmo');

  // Load saved sync preference on startup
  useEffect(() => {
    const loadSyncPreference = async () => {
      try {
        const savedSync = await AsyncStorage.getItem(SYNC_STORAGE_KEY);
        if (savedSync !== null) {
          setSyncEnabledState(JSON.parse(savedSync));
        }
      } catch (e) {
        console.error('Error loading wearable sync preference:', e);
      }
    };
    loadSyncPreference();
  }, []);

  // Persistent setSyncEnabled function
  const setSyncEnabled = useCallback((enabled: boolean | ((prev: boolean) => boolean)) => {
    setSyncEnabledState((prev) => {
      const nextValue = typeof enabled === 'function' ? enabled(prev) : enabled;
      AsyncStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(nextValue)).catch((err) =>
        console.error('Error saving wearable sync preference:', err)
      );
      return nextValue;
    });
  }, []);

  const fetchIOSData = useCallback(async () => {
    try {
      let HealthKit: any;
      try {
        const HealthKitModule = require('@kingstinct/react-native-healthkit');
        HealthKit = HealthKitModule.default || HealthKitModule;
      } catch (e) {
        setIsAvailable(false);
        setIsLoading(false);
        return;
      }

      if (!HealthKit || typeof HealthKit.isHealthKitAvailable !== 'function') {
        setIsAvailable(false);
        setIsLoading(false);
        return;
      }

      const available = await HealthKit.isHealthKitAvailable?.();
      if (!available) {
        setIsAvailable(false);
        setIsLoading(false);
        return;
      }

      setIsAvailable(true);

      const stepCountType = HealthKit.HKQuantityTypeIdentifier?.stepCount || 'HKQuantityTypeIdentifierStepCount';
      const heartRateType = HealthKit.HKQuantityTypeIdentifier?.heartRate || 'HKQuantityTypeIdentifierHeartRate';

      if (HealthKit.requestAuthorization) {
        await HealthKit.requestAuthorization([stepCountType, heartRateType], []);
      }

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

      // Query statistics for step count with cumulativeSum for native Apple Health deduplication
      if (HealthKit.queryStatisticsForQuantity) {
        const stats = await HealthKit.queryStatisticsForQuantity(stepCountType, ['cumulativeSum'], {
          from: startOfDay,
          to: now,
        });

        if (stats?.sumQuantity) {
          const stepVal = typeof stats.sumQuantity === 'number'
            ? stats.sumQuantity
            : (stats.sumQuantity.quantity || stats.sumQuantity.value || 0);
          setSteps(Math.round(stepVal));
        }
      } else if (HealthKit.queryQuantitySamples) {
        const stepSamples = await HealthKit.queryQuantitySamples(stepCountType, {
          from: startOfDay,
          to: now,
        });

        if (Array.isArray(stepSamples)) {
          const totalSteps = stepSamples.reduce((acc: number, sample: any) => acc + (sample.quantity || sample.value || 0), 0);
          setSteps(Math.round(totalSteps));
        }
      }

      // Fetch latest heart rate sample
      if (HealthKit.queryQuantitySamples) {
        const hrSamples = await HealthKit.queryQuantitySamples(heartRateType, {
          from: startOfDay,
          to: now,
          limit: 1,
          ascending: false,
        });

        if (Array.isArray(hrSamples) && hrSamples.length > 0) {
          const latestHr = hrSamples[0].quantity || hrSamples[0].value || null;
          if (latestHr) setHeartRate(Math.round(latestHr));
        }
      }

      const syncTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(syncTime);
      setError(null);
    } catch (err: any) {
      setIsAvailable(false);
      setError(err?.message || 'Erro ao carregar dados do HealthKit');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAndroidData = useCallback(async () => {
    try {
      let HealthConnect: any;
      try {
        const HealthConnectModule = require('react-native-health-connect');
        HealthConnect = HealthConnectModule.default || HealthConnectModule;
      } catch (e) {
        setIsAvailable(false);
        setIsLoading(false);
        return;
      }

      if (!HealthConnect || typeof HealthConnect.getSdkStatus !== 'function') {
        setIsAvailable(false);
        setIsLoading(false);
        return;
      }

      const status = await HealthConnect.getSdkStatus();
      if (status !== HealthConnect.SdkAvailabilityStatus.SDK_AVAILABLE) {
        setIsAvailable(false);
        setIsLoading(false);
        return;
      }

      setIsAvailable(true);
      await HealthConnect.initialize();

      await HealthConnect.requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'HeartRate' },
        { accessType: 'read', recordType: 'RestingHeartRate' },
      ]);

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Aggregate step records from startOfDay to now to prevent page-size truncation
      if (HealthConnect.aggregateRecord) {
        const aggregateResult = await HealthConnect.aggregateRecord({
          recordType: 'Steps',
          timeRangeFilter: {
            operator: 'between',
            startTime: startOfDay.toISOString(),
            endTime: now.toISOString(),
          },
        });

        const totalSteps = aggregateResult?.count ?? aggregateResult?.STEPS_COUNT_TOTAL ?? 0;
        setSteps(totalSteps);
      } else if (HealthConnect.readRecords) {
        const stepsResponse = await HealthConnect.readRecords('Steps', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startOfDay.toISOString(),
            endTime: now.toISOString(),
          },
        });

        if (stepsResponse?.records) {
          const totalSteps = stepsResponse.records.reduce((sum: number, record: any) => sum + (record.count || 0), 0);
          setSteps(totalSteps);
        }
      }

      // Fetch latest heart rate sample over 24-hour range, fallback to RestingHeartRate if missing
      let foundBpm: number | null = null;

      if (HealthConnect.readRecords) {
        // 1. Query HeartRate over last 24 hours
        const hrResponse = await HealthConnect.readRecords('HeartRate', {
          timeRangeFilter: {
            operator: 'between',
            startTime: twentyFourHoursAgo.toISOString(),
            endTime: now.toISOString(),
          },
          ascendingOrder: false,
        });

        if (hrResponse?.records && hrResponse.records.length > 0) {
          let allSamples: any[] = [];
          hrResponse.records.forEach((record: any) => {
            if (Array.isArray(record.samples)) {
              allSamples.push(...record.samples);
            }
          });

          if (allSamples.length > 0) {
            allSamples.sort((a, b) => {
              const timeA = new Date(a.time || a.startTime || 0).getTime();
              const timeB = new Date(b.time || b.startTime || 0).getTime();
              return timeB - timeA;
            });

            const latestSample = allSamples[0];
            if (latestSample?.beatsPerMinute) {
              foundBpm = Math.round(latestSample.beatsPerMinute);
            }
          }
        }

        // 2. Fallback to RestingHeartRate if no valid HeartRate sample found
        if (!foundBpm) {
          const rhrResponse = await HealthConnect.readRecords('RestingHeartRate', {
            timeRangeFilter: {
              operator: 'between',
              startTime: twentyFourHoursAgo.toISOString(),
              endTime: now.toISOString(),
            },
            ascendingOrder: false,
          });

          if (rhrResponse?.records && rhrResponse.records.length > 0) {
            const sortedRecords = [...rhrResponse.records].sort((a, b) => {
              const timeA = new Date(a.time || a.startTime || 0).getTime();
              const timeB = new Date(b.time || b.startTime || 0).getTime();
              return timeB - timeA;
            });

            const latestRecord = sortedRecords[0];
            const bpm = latestRecord?.beatsPerMinute ?? latestRecord?.value?.beatsPerMinute ?? latestRecord?.value ?? null;
            if (bpm) {
              foundBpm = Math.round(bpm);
            }
          }
        }
      }

      setHeartRate(foundBpm);

      const syncTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(syncTime);
      setError(null);
    } catch (err: any) {
      setIsAvailable(false);
      setError(err?.message || 'Erro ao carregar dados do Health Connect');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshHealthData = useCallback(async () => {
    setIsLoading(true);
    if (Platform.OS === 'ios') {
      await fetchIOSData();
    } else if (Platform.OS === 'android') {
      await fetchAndroidData();
    } else {
      setIsAvailable(false);
      setIsLoading(false);
    }
  }, [fetchIOSData, fetchAndroidData]);

  useEffect(() => {
    refreshHealthData();
  }, [refreshHealthData]);

  const isConnected = isAvailable && syncEnabled;

  return (
    <HealthContext.Provider
      value={{
        steps: syncEnabled ? steps : 0,
        heartRate: syncEnabled ? heartRate : null,
        isAvailable,
        syncEnabled,
        setSyncEnabled,
        isConnected,
        isLoading,
        error,
        lastSyncTime,
        refreshHealthData,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
}

export function useHealthData(): HealthContextType {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealthData must be used within a HealthProvider');
  }
  return context;
}
