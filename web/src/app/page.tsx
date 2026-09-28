"use client";

import { useEffect, useState } from "react";

type HealthResponse = {
  status: string;
  database: string;
};

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("API request failed");
        }

        return response.json();
      })
      .then((data: HealthResponse) => {
        setHealth(data);
      })
      .catch(() => {
        setError("Could not connect to the Tareka API.");
      });
  }, []);

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-3xl font-bold">Tareka</h1>

      <p className="mt-4">
        Verified recycling and waste-management information for Kenya.
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">System Status</h2>

        {error && <p className="mt-2">{error}</p>}

        {health && (
          <div className="mt-2">
            <p>API: {health.status}</p>
            <p>Database: {health.database}</p>
          </div>
        )}
      </section>
    </main>
  );
}