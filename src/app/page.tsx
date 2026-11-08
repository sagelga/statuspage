import type { BrandId } from '@/config';
import StatusPageClient from '@/components/StatusPageClient';

/** `?brand=` is read on the server so SSR and hydration agree. */
function parseBrand(value: string | string[] | undefined): BrandId {
  const brand = Array.isArray(value) ? value[0] : value;
  return brand === 'sagelga' ? 'sagelga' : 'byteside';
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  return <StatusPageClient initialBrand={parseBrand(params.brand)} />;
}
