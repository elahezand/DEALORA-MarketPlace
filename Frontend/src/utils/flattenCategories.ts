import { AdminCategory } from "@/types/Category";

export interface FlatCategory extends AdminCategory {
  depth: number;
}
export function flattenCategories(
  tree: AdminCategory[],
  depth = 0
): FlatCategory[] {
  return tree.flatMap((cat) => {
    const { subCategories, ...rest } = cat;
    const node: FlatCategory = { ...rest, depth };

    return [node, ...flattenCategories(subCategories ?? [], depth + 1)];
  });
}