export type LocalizedName = {
  en: string;
  ar: string;
};

export const localizedQueryConfig: any = {
  sortableColumns: ['localizedName.ar', 'localizedName.en'],
  filterableColumns: {
    'localizedName.en': ['ILIKE', 'EQ'],
    'localizedName.ar': ['ILIKE', 'EQ'],
  },
  searchableColumns: ['localizedName.en', 'localizedName.ar'],
};

// export function localizedQueryConfig<T>() {
//   return {
//     sortableColumns: ['localizedName.(ar)', 'localizedName.(en)'],
//     filterableColumns: {
//       'localizedName.en': ['ILIKE', 'EQ'],
//       'localizedName.ar': ['ILIKE', 'EQ'],
//     } as Record<keyof T, string[]>
//   };
// }