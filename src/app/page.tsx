import type { BrandId } from '@/config';
import { isValidBrandParam } from '@/lib/brand-filter';
import StatusPageClient from '@/components/StatusPageClient';

/** `?brand=` is read on the server so SSR and hydration agree. */
function parseBrand(value: string | string[] | undefined): BrandId {
  const brand = Array.isArray(value) ? value[0] : value;
  if (typeof brand === 'string' && isValidBrandParam(brand)) return brand;
  return 'byteside';
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  return <StatusPageClient initialBrand={parseBrand(params.brand)} />;
}
