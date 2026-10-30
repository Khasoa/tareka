import { Suspense } from "react";
import Header from "@/components/Header";
import MaterialsExhibition from "@/components/MaterialsExhibition";
import DirectoryIntro from "@/components/DirectoryIntro";
import DirectoryHome from "@/components/DirectoryHome";
import {
  getBusinesses,
  getCounties,
  getMaterials,
  type BusinessListResponse,
} from "@/lib/api";
import { businessTypeQueryForApi } from "@/lib/directorySearchParams";

export const dynamic = "force-dynamic";

const EMPTY_BUSINESSES: BusinessListResponse = {
  items: [],
  page: 1,
  page_size: 12,
  total: 0,
  total_pages: 0,
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  let directoryTotal = 0;
  let countiesCount = 0;
  let businessData: BusinessListResponse = EMPTY_BUSINESSES;
  let counties: string[] = [];
  let materials: Awaited<ReturnType<typeof getMaterials>> = [];
  let listKey = "directory";

  try {
    const sp = await searchParams;
    const query = first(sp.q).trim();
    const county = first(sp.county).trim();
    const dropoff = first(sp.accepts_public_dropoff).trim();
    const pickup = first(sp.offers_pickup).trim();
    const businessType = businessTypeQueryForApi(first(sp.business_type));
    const materialSlug = first(sp.material).trim();
    const materialId = first(sp.material_id).trim();

    const [unfiltered, countyList, materialList] = await Promise.all([
      getBusinesses(new URLSearchParams({ page: "1", page_size: "12" })),
      getCounties(),
      getMaterials(),
    ]);

    counties = countyList;
    materials = materialList;
    directoryTotal = unfiltered.total;
    countiesCount = countyList.length;
    businessData = unfiltered;

    const selectedMaterial =
      materialList.find((material) => material.slug === materialSlug) ??
      materialList.find((material) => String(material.id) === materialId);

    listKey = [
      query,
      county,
      dropoff,
      pickup,
      businessType,
      selectedMaterial?.slug ?? "",
    ].join("|");

    if (query || county || dropoff || pickup || businessType || selectedMaterial) {
      const filtered = new URLSearchParams({
        page: "1",
        page_size: "12",
      });
      if (query) filtered.set("q", query);
      if (county) filtered.set("county", county);
      if (dropoff) filtered.set("accepts_public_dropoff", dropoff);
      if (pickup) filtered.set("offers_pickup", pickup);
      if (businessType) filtered.set("business_type", businessType);
      if (selectedMaterial) {
        filtered.set("material_id", String(selectedMaterial.id));
      }
      businessData = await getBusinesses(filtered);
    }
  } catch {
    // Keep the homepage renderable when the API is unreachable (CI builds,
    // cold starts). DirectoryHome retries in the browser.
  }

  return (
    <>
      <Header />
      <div className="directory-page">
        <section className="directory-hero">
          <DirectoryIntro total={directoryTotal} countiesCount={countiesCount} />
          <Suspense fallback={null}>
            <MaterialsExhibition materials={materials} />
          </Suspense>
        </section>

        <Suspense fallback={null}>
          <DirectoryHome
            key={listKey}
            initialBusinesses={businessData.items}
            initialTotal={businessData.total}
            counties={counties}
            materials={materials}
          />
        </Suspense>
      </div>
    </>
  );
}
