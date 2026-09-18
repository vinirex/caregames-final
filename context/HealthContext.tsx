import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform, AppState } from 'react-native';
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
  requestPermissions: () => Promise<boolean>;
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

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

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

      try {
        await HealthConnect.initialize();
      } catch (initErr) {
        console.warn('Health Connect initialize warning:', initErr);
      }

      // Check permissions before querying records
      const grantedPermissions = await HealthConnect.getGrantedPermissions();
      const hasPermissions = Array.isArray(grantedPermissions) && grantedPermissions.length > 0;

      if (!hasPermissions) {
        setIsLoading(false);
        return;
      }

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // --- 1. FETCH STEPS ---
      let fetchedSteps = 0;
      let stepSuccess = false;

      if (HealthConnect.aggregateRecord) {
        try {
          const aggregateResult = await HealthConnect.aggregateRecord({
            recordType: 'Steps',
            timeRangeFilter: {
              operator: 'between',
              startTime: startOfDay.toISOString(),
              endTime: now.toISOString(),
            },
          });

          if (aggregateResult) {
            const aggregatedCount =
              aggregateResult.COUNT_TOTAL ??
              aggregateResult.STEPS_COUNT_TOTAL ??
              aggregateResult.count ??
              aggregateResult.STEPS ??
              (typeof aggregateResult.result === 'number' ? aggregateResult.result : aggregateResult.result?.count) ??
              null;

            if (aggregatedCount !== null && aggregatedCount !== undefined) {
              fetchedSteps = Math.round(Number(aggregatedCount) || 0);
              stepSuccess = true;
            }
          }
        } catch (aggErr) {
          console.warn('HealthConnect aggregateRecord warning, falling back to readRecords:', aggErr);
        }
      }

      if (!stepSuccess && HealthConnect.readRecords) {
        try {
          const stepsResponse = await HealthConnect.readRecords('Steps', {
            timeRangeFilter: {
              operator: 'between',
              startTime: startOfDay.toISOString(),
              endTime: now.toISOString(),
            },
          });

          if (stepsResponse?.records && Array.isArray(stepsResponse.records)) {
            const totalSteps = stepsResponse.records.reduce((sum: number, record: any) => {
              const val = record.count ?? record.steps ?? record.value ?? 0;
              return sum + (typeof val === 'number' ? val : 0);
            }, 0);
            fetchedSteps = Math.round(totalSteps);
          }
        } catch (readStepsErr) {
          console.warn('HealthConnect readRecords Steps error:', readStepsErr);
        }
      }

      setSteps(fetchedSteps);

      // --- 2. FETCH HEART RATE ---
      let foundBpm: number | null = null;

      if (HealthConnect.readRecords) {
        try {
          const hrResponse = await HealthConnect.readRecords('HeartRate', {
            timeRangeFilter: {
              operator: 'between',
              startTime: twentyFourHoursAgo.toISOString(),
              endTime: now.toISOString(),
            },
            ascendingOrder: false,
          });

          if (hrResponse?.records && Array.isArray(hrResponse.records) && hrResponse.records.length > 0) {
            let allSamples: any[] = [];
            hrResponse.records.forEach((record: any) => {
              if (Array.isArray(record.samples) && record.samples.length > 0) {
                allSamples.push(...record.samples);
              } else if (record.beatsPerMinute || record.value) {
                allSamples.push(record);
              }
            });

            if (allSamples.length > 0) {
              allSamples.sort((a, b) => {
                const timeA = new Date(a.time || a.startTime || a.endTime || 0).getTime();
                const timeB = new Date(b.time || b.startTime || b.endTime || 0).getTime();
                return timeB - timeA;
              });

              const latestSample = allSamples[0];
              const rawBpm = latestSample?.beatsPerMinute ?? latestSample?.value?.beatsPerMinute ?? latestSample?.value;
              if (rawBpm && !isNaN(rawBpm)) {
                foundBpm = Math.round(Number(rawBpm));
              }
            }
          }
        } catch (hrErr) {
          console.warn('HealthConnect readRecords HeartRate warning:', hrErr);
        }

        if (!foundBpm) {
          try {
            const rhrResponse = await HealthConnect.readRecords('RestingHeartRate', {
              timeRangeFilter: {
                operator: 'between',
                startTime: twentyFourHoursAgo.toISOString(),
                endTime: now.toISOString(),
              },
              ascendingOrder: false,
            });

            if (rhrResponse?.records && Array.isArray(rhrResponse.records) && rhrResponse.records.length > 0) {
              const sortedRecords = [...rhrResponse.records].sort((a, b) => {
                const timeA = new Date(a.time || a.startTime || a.endTime || 0).getTime();
                const timeB = new Date(b.time || b.startTime || b.endTime || 0).getTime();
                return timeB - timeA;
              });

              const latestRecord = sortedRecords[0];
              const bpm = latestRecord?.beatsPerMinute ?? latestRecord?.value?.beatsPerMinute ?? latestRecord?.value ?? null;
              if (bpm && !isNaN(bpm)) {
                foundBpm = Math.round(Number(bpm));
              }
            }
          } catch (rhrErr) {
            console.warn('HealthConnect readRecords RestingHeartRate warning:', rhrErr);
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

  // Explicit user-triggered permissions flow
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);

      if (Platform.OS === 'ios') {
        const HealthKitModule = require('@kingstinct/react-native-healthkit');
        const HealthKit = HealthKitModule.default || HealthKitModule;
        const stepCountType = HealthKit.HKQuantityTypeIdentifier?.stepCount || 'HKQuantityTypeIdentifierStepCount';
        const heartRateType = HealthKit.HKQuantityTypeIdentifier?.heartRate || 'HKQuantityTypeIdentifierHeartRate';

        if (HealthKit.requestAuthorization) {
          await HealthKit.requestAuthorization([stepCountType, heartRateType], []);
          await fetchIOSData();
          return true;
        }
      } else if (Platform.OS === 'android') {
        const HealthConnectModule = require('react-native-health-connect');
        const HealthConnect = HealthConnectModule.default || HealthConnectModule;

        const granted = await HealthConnect.requestPermission([
          { accessType: 'read', recordType: 'Steps' },
          { accessType: 'read', recordType: 'HeartRate' },
          { accessType: 'read', recordType: 'RestingHeartRate' },
        ]);

        if (Array.isArray(granted) && granted.length > 0) {
          await fetchAndroidData();
          return true;
        }
      }
      return false;
    } catch (err: any) {
      console.warn('Error requesting health permissions:', err);
      setError(err?.message || 'Erro ao solicitar permissões');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchIOSData, fetchAndroidData]);

  useEffect(() => {
    refreshHealthData();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refreshHealthData();
      }
    });

    return () => {
      subscription.remove();
    };
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
        requestPermissions,
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
