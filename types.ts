
export interface LibraryItem {
  id: string;
  name: string;
  collectionCode: string;
  imageData: string; // Base64
  createdAt: number;
}

export interface SearchResult {
  matchFound: boolean;
  itemId?: string;
  confidence?: number;
  reason?: string;
}

export enum AppView {
  LIBRARY = 'library',
  CAMERA = 'camera',
  ADD_ITEM = 'add_item'
}
