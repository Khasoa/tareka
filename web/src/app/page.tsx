import { Suspense } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import DirectoryHome from "@/components/DirectoryHome";
import { getBusinesses, getCounties, getMaterials } from "@/lib/api";

export default async function HomePage() {
  const [businessData, counties, materials] = await Promise.all([
    getBusinesses(new URLSearchParams({ page: "1", page_size: "12" })),
    getCounties(),
    getMaterials(),
  ]);

  return (
    <>
      <Header />
      <Hero
        total={businessData.total}
        countiesCount={counties.length}
      />
      <Suspense fallback={null}>
        <DirectoryHome
          initialBusinesses={businessData.items}
          initialTotal={businessData.total}
          counties={counties}
          materials={materials}
        />
      </Suspense>
    </>
  );
}