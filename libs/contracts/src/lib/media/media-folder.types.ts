/**
 * A media library folder (a flat organizational label in the MVP; `parentId` reserves
 * nesting). Pure response shape → `.types` file (U16). `name` is an internal admin
 * label, not website content, so it is not translatable.
 */
export interface MediaFolder {
  id: string;
  parentId: string | null;
  name: string;
  createdAt: string;
  updatedAt: string;
}
