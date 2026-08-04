export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type ContentEntryRow = {
  id: string;
  owner_id: string;
  slug: string;
  title: string;
  summary: string;
  entry_type: string;
  status: 'draft' | 'published' | 'archived';
  cover_asset_id: string | null;
  metadata: Json;
  version: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type ContentBlockRow = {
  id: string;
  entry_id: string;
  block_type: string;
  position: number;
  props: Json;
  layout: Json;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      content_entries: {
        Row: ContentEntryRow;
        Insert: Partial<ContentEntryRow> & Pick<ContentEntryRow, 'owner_id' | 'slug' | 'title'>;
        Update: Partial<ContentEntryRow>;
        Relationships: [];
      };
      content_blocks: {
        Row: ContentBlockRow;
        Insert: Partial<ContentBlockRow> & Pick<ContentBlockRow, 'entry_id' | 'block_type' | 'position'>;
        Update: Partial<ContentBlockRow>;
        Relationships: [];
      };
      assets: {
        Row: {
          id: string;
          owner_id: string;
          storage_provider: string;
          bucket: string;
          object_key: string;
          public_url: string | null;
          mime_type: string;
          byte_size: number;
          width: number | null;
          height: number | null;
          alt_text: string;
          metadata: Json;
          is_public: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      entry_versions: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      site_settings: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_owner: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
