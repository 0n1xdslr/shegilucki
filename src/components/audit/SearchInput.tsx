'use client';

import { Search } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition, useState } from 'react';

export default function SearchInput({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue);

  const handleSearch = (term: string) => {
    setValue(term);
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="relative w-full sm:w-1/2 md:w-1/3">
      <span className="absolute left-4.5 top-1/2 -translate-y-1/2">
        <Search size={18} className="text-slate-500" />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Buscar por acción o entidad..."
        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-10 py-2 font-medium outline-none transition focus:border-red-500 active:border-red-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-red-500"
      />
      {isPending && (
        <span className="absolute right-4.5 top-1/2 -translate-y-1/2">
           <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent"></div>
        </span>
      )}
    </div>
  );
}
