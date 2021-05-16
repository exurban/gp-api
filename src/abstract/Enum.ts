import { registerEnumType } from "type-graphql";

export enum SortDirection {
  ASC = "ASC",
  DESC = "DESC",
}

registerEnumType(SortDirection, {
  name: "SortDirection",
  description: "Sort direction",
});

export enum OrderStatus {
  PAID = "payment received",
  PLACED = "order placed with lab",
  SHIPPED = "lab shipped order",
  FULFILLED = "order complete",
  PROBLEM = "problem with order, see notes",
}

registerEnumType(OrderStatus, {
  name: "OrderStatus",
  description: "Order status",
});
