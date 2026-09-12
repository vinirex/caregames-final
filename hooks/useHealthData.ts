import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

export interface HealthDataResult {
  steps: number;
  heartRate: number | null;
  isAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  refreshHealthData: () => Promise<void>;
}

export function useHealthData(): HealthDataResult {
  const [steps, setSteps] = useState<number>(0);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIOSData = useCallback(async () => {
    try {
      let HealthKit: any;
      try {
        HealthKit = require('@kingstinct/react-native-healthkit');
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

      // Request read permissions for step count and heart rate
      const stepCountType = HealthKit.HKQuantityTypeIdentifier?.stepCount || 'HKQuantityTypeIdentifierStepCount';
      const heartRateType = HealthKit.HKQuantityTypeIdentifier?.heartRate || 'HKQuantityTypeIdentifierHeartRate';

      if (HealthKit.requestAuthorization) {
        await HealthKit.requestAuthorization([stepCountType, heartRateType], []);
      }

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

      // Fetch today's total steps
      if (HealthKit.queryQuantitySamples) {
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
        HealthConnect = require('react-native-health-connect');
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

      // Request read permissions for Steps and HeartRate
      await HealthConnect.requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'HeartRate' },
      ]);

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

      // Fetch today's total steps
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

      // Fetch latest heart rate sample
      const hrResponse = await HealthConnect.readRecords('HeartRate', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startOfDay.toISOString(),
          endTime: now.toISOString(),
        },
        ascendingOrder: false,
        pageSize: 1,
      });

      if (hrResponse?.records && hrResponse.records.length > 0) {
        const latestRecord = hrResponse.records[0];
        if (latestRecord.samples && latestRecord.samples.length > 0) {
          const bpm = latestRecord.samples[latestRecord.samples.length - 1].beatsPerMinute;
          if (bpm) setHeartRate(Math.round(bpm));
        }
      }

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

  return {
    steps,
    heartRate,
    isAvailable,
    isLoading,
    error,
    refreshHealthData,
  };
}
