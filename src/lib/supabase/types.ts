/**
 * Database types for the Supabase client. Hand-maintained to match
 * supabase/schema.sql. If you change the schema, update this too (or regenerate
 * with: npx supabase gen types typescript --project-id <ref>).
 */

export type UserRole = "customer" | "seller" | "admin";
export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
export type FulfillmentStatus = "unfulfilled" | "shipped" | "delivered";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          avatar_url: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          slug: string;
          name: string;
          icon: string;
          accent: string | null;
          product_count: number | null;
        };
        Insert: Database["public"]["Tables"]["categories"]["Row"];
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Relationships: [];
      };
      sellers: {
        Row: {
          id: string;
          owner_id: string | null;
          handle: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          location: string | null;
          rating: number | null;
          rating_count: number | null;
          response_rate: number | null;
          joined_at: string;
          is_verified: boolean;
          is_featured: boolean;
          is_active: boolean;
          total_sales: number | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["sellers"]["Row"],
          "id" | "joined_at" | "owner_id" | "is_active"
        > & {
          id?: string;
          joined_at?: string;
          owner_id?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["sellers"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          category_slug: string | null;
          kind: "physical" | "digital";
          listing_type: "fixed" | "auction" | "offer";
          condition: "new" | "like-new" | "good" | "fair" | "for-parts";
          currency: string;
          price: number;
          original_price: number | null;
          auction: { currentBid: number; bidCount: number; endsAt: string } | null;
          video_url: string | null;
          specs: Record<string, string>;
          variants: { name: string; values: string[] }[] | null;
          stock: number;
          seller_id: string | null;
          rating: number | null;
          rating_count: number | null;
          tags: string[];
          is_sponsored: boolean;
          is_featured: boolean;
          free_shipping: boolean;
          location: string | null;
          status: "draft" | "published" | "archived";
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["products"]["Row"],
          // columns with DB defaults or nullable — optional on insert
          | "id"
          | "created_at"
          | "status"
          | "kind"
          | "listing_type"
          | "condition"
          | "currency"
          | "original_price"
          | "auction"
          | "video_url"
          | "specs"
          | "variants"
          | "stock"
          | "rating"
          | "rating_count"
          | "tags"
          | "is_sponsored"
          | "is_featured"
          | "free_shipping"
          | "location"
        > &
          Partial<
            Pick<
              Database["public"]["Tables"]["products"]["Row"],
              | "id"
              | "created_at"
              | "status"
              | "kind"
              | "listing_type"
              | "condition"
              | "currency"
              | "original_price"
              | "auction"
              | "video_url"
              | "specs"
              | "variants"
              | "stock"
              | "rating"
              | "rating_count"
              | "tags"
              | "is_sponsored"
              | "is_featured"
              | "free_shipping"
              | "location"
            >
          >;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string | null;
          url: string;
          alt: string | null;
          spin: boolean | null;
          position: number | null;
        };
        Insert: Omit<Database["public"]["Tables"]["product_images"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          product_id: string | null;
          author_id: string | null;
          author_name: string;
          avatar_url: string | null;
          rating: number;
          title: string | null;
          body: string;
          verified_purchase: boolean | null;
          helpful_count: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reviews"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          buyer_id: string | null;
          status: OrderStatus;
          currency: string;
          subtotal: number;
          total: number;
          shipping_name: string | null;
          shipping_email: string | null;
          shipping_phone: string | null;
          shipping_addr: string | null;
          payment_ref: string | null;
          stock_committed: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["orders"]["Row"],
          | "id"
          | "created_at"
          | "stock_committed"
          | "shipping_name"
          | "shipping_email"
          | "shipping_phone"
          | "shipping_addr"
          | "payment_ref"
        > & {
          id?: string;
          created_at?: string;
          stock_committed?: boolean;
          shipping_name?: string | null;
          shipping_email?: string | null;
          shipping_phone?: string | null;
          shipping_addr?: string | null;
          payment_ref?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string | null;
          product_id: string | null;
          seller_id: string | null;
          title: string;
          unit_price: number;
          quantity: number;
          variant: Record<string, string> | null;
          fulfillment: FulfillmentStatus;
        };
        Insert: Omit<
          Database["public"]["Tables"]["order_items"]["Row"],
          "id" | "fulfillment"
        > & { id?: string; fulfillment?: FulfillmentStatus };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [];
      };
      wishlists: {
        Row: { user_id: string; product_id: string; created_at: string };
        Insert: { user_id: string; product_id: string; created_at?: string };
        Update: Partial<{ user_id: string; product_id: string; created_at: string }>;
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          quantity: number;
          variant: Record<string, string> | null;
          variant_key: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["cart_items"]["Row"],
          "id" | "created_at" | "variant_key"
        > & { id?: string; created_at?: string; variant_key?: string };
        Update: Partial<Database["public"]["Tables"]["cart_items"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      current_seller_id: { Args: Record<string, never>; Returns: string | null };
      become_seller: {
        Args: {
          p_handle: string;
          p_display_name: string;
          p_bio?: string | null;
          p_location?: string | null;
        };
        Returns: Database["public"]["Tables"]["sellers"]["Row"];
      };
      commit_order_stock: { Args: { p_order_id: string }; Returns: undefined };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      fulfillment_status: FulfillmentStatus;
    };
  };
}
