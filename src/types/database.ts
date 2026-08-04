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

type AssetRow = {
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

type EntryVersionRow = {
  id: string;
  entry_id: string;
  version: number;
  snapshot: Json;
  reason: string;
  created_by: string;
  created_at: string;
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
        Row: AssetRow;
        Insert: Partial<AssetRow> & Pick<AssetRow, 'owner_id' | 'bucket' | 'object_key' | 'mime_type'>;
        Update: Partial<AssetRow>;
        Relationships: [];
      };
      entry_versions: {
        Row: EntryVersionRow;
        Insert: Partial<EntryVersionRow> & Pick<EntryVersionRow, 'entry_id' | 'version' | 'snapshot' | 'created_by'>;
        Update: Partial<EntryVersionRow>;
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
      save_content_entry: {
        Args: {
          p_entry_id: string;
          p_expected_version: number;
          p_entry: Json;
          p_blocks: Json;
          p_reason?: string;
        };
        Returns: Json;
      };
      soft_delete_content_entry: {
        Args: { p_entry_id: string; p_expected_version: number };
        Returns: boolean;
      };
      restore_content_entry_version: {
        Args: { p_entry_id: string; p_version: number; p_expected_version: number };
        Returns: Json;
      };
      restore_deleted_content_entry: {
        Args: { p_entry_id: string; p_expected_version: number };
        Returns: Json;
      };
      register_uploaded_asset: {
        Args: {
          p_bucket: string;
          p_object_key: string;
          p_public_url: string;
          p_mime_type: string;
          p_byte_size: number;
          p_alt_text?: string;
        };
        Returns: AssetRow;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
