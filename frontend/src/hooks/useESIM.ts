"use client";

import { useEffect, useState } from "react";
import { esimAccessApi } from "@/services/esimAccess.api";
import { ESimProfile, DataPackage, Location } from "@/types";

export const useESIMProfiles = (enabled = true) => {
  const [profiles, setProfiles] = useState<ESimProfile[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetch = async () => {
      try {
        setLoading(true);
        const result = await esimAccessApi.getAllProfiles();
        setProfiles(result?.esimList || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to fetch profiles");
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [enabled]);

  return { profiles, loading, error, refetch: () => {} };
};

export const useDataPackages = (locationCode?: string, enabled = true) => {
  const [packages, setPackages] = useState<DataPackage[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetch = async () => {
      try {
        setLoading(true);
        const result = await esimAccessApi.getPackages();
        setPackages(result || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to fetch packages");
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [locationCode, enabled]);

  return { packages, loading, error };
};

export const useSupportedCountries = (enabled = true) => {
  const [countries, setCountries] = useState<Location[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetch = async () => {
      try {
        setLoading(true);
        const result = await esimAccessApi.getCountries();
        setCountries(result || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to fetch countries");
        setCountries([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [enabled]);

  return { countries, loading, error };
};

export const useAccountBalance = (enabled = true) => {
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetch = async () => {
      try {
        setLoading(true);
        const result = await esimAccessApi.getBalance();
        setBalance(result);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to fetch balance");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [enabled]);

  return { balance, loading, error };
};
