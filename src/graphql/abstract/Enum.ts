import { registerEnumType } from 'type-graphql';

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

registerEnumType(SortDirection, {
  name: 'SortDirection',
  description: 'Sort direction',
});

export enum OrderStatus {
  CREATED,
  PAID,
  PLACED,
  SHIPPED,
  FULFILLED,
  PROBLEM,
}

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
  description: 'Order status',
  valuesConfig: {
    CREATED: { description: 'order freshly created.' },
    PAID: { description: 'payment received from customer' },
    PLACED: { description: 'order placed with lab' },
    SHIPPED: { description: 'lab shipped order' },
    FULFILLED: { description: 'order complete' },
    PROBLEM: { description: 'problem with order, see notes' },
  },
});
