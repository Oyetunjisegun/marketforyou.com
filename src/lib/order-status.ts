import type { FulfillmentStatus, OrderStatus } from "./types";

type Tone = "primary" | "success" | "warning" | "danger" | "neutral" | "accent";

const ORDER_TONE: Record<OrderStatus, Tone> = {
  pending: "warning",
  paid: "primary",
  shipped: "accent",
  delivered: "success",
  cancelled: "neutral",
  refunded: "danger",
};

const ORDER_LABEL: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function orderStatusTone(status: OrderStatus): Tone {
  return ORDER_TONE[status];
}

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_LABEL[status];
}

const FULFILL_TONE: Record<FulfillmentStatus, Tone> = {
  unfulfilled: "warning",
  shipped: "accent",
  delivered: "success",
};

const FULFILL_LABEL: Record<FulfillmentStatus, string> = {
  unfulfilled: "Unfulfilled",
  shipped: "Shipped",
  delivered: "Delivered",
};

export function fulfillmentTone(status: FulfillmentStatus): Tone {
  return FULFILL_TONE[status];
}

export function fulfillmentLabel(status: FulfillmentStatus): string {
  return FULFILL_LABEL[status];
}
