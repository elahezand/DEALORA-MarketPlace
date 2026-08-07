// --- Sub-Schemas Types ---

export interface ICategoryFilterOption {
  label: string;
  value: string;
  metadata?: Record<string, any>;
}

export type CategoryFilterType = 'select' | 'radio' | 'boolean' | 'text';

export interface ICategoryFilter {
  name: string;
  slug: string;
  type: CategoryFilterType;
  options?: ICategoryFilterOption[];
  required?: boolean;
}

export interface ICategoryIcon {
  svgCode?: string;
}

// --- Main Category Interface ---

export interface ICategory {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  parent?: string | ICategory | null;
  description?: string;
  icon?: ICategoryIcon;
  filters: ICategoryFilter[];
  isActive: boolean;
  metadata?: Record<string, any>;
  children?: ICategory[]; // virtual property
  createdAt?: string;
  updatedAt?: string;
}

export type AdminCategory = ICategory;

export interface CategoriesTypeResponse {
  success?: boolean;
  data: ICategory[];
}

export interface ISingleCategoryResponse {
  success: boolean;
  data: ICategory;
}