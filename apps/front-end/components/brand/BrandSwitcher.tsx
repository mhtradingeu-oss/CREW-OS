import React from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function BrandSwitcher() {
  const { brands, currentBrandId, refetch, isLoading } = useAuth();
  const [selected, setSelected] = React.useState(currentBrandId);

  React.useEffect(() => {
    setSelected(currentBrandId);
  }, [currentBrandId]);

  if (isLoading || !brands.length) return null;
  if (brands.length === 1) {
    const brand = brands[0];
    return (
      <div className="flex items-center gap-2">
        {brand.logoUrl && <img src={brand.logoUrl} alt={brand.name} className="h-6 w-6 rounded" />}
        <span className="font-semibold text-gray-700">{brand.name}</span>
      </div>
    );
  }

  return (
    <select
      className="w-full border rounded px-2 py-1"
      value={selected}
      onChange={e => {
        setSelected(e.target.value);
        // Store context (cookie/localStorage/header as needed)
        document.cookie = `brandId=${e.target.value}; path=/`;
        refetch();
      }}
    >
      {brands.map(brand => (
        <option key={brand.id} value={brand.id}>
          {brand.name}
        </option>
      ))}
    </select>
  );
}
