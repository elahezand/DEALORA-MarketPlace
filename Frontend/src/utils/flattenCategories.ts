import { AdminCategory } from "@/types/Category";

export interface FlatCategory extends AdminCategory {
  depth: number;
}
export function flattenCategories(
  tree: AdminCategory[],
  depth = 0
): FlatCategory[] {
  return tree.flatMap((cat) => {
    const rawChildren =
      (cat as any).subCategories ?? cat.children ?? [];

    const { subCategories, children, ...rest } = cat as any;
    const node: FlatCategory = { ...(rest as AdminCategory), depth };

    return [node, ...flattenCategories(rawChildren, depth + 1)];
  });
}