export interface Sale {
  _id?: string;
  customerId: string;
  items: { itemId: string; quantity: number }[];
  total: number;
  date: string;
}
