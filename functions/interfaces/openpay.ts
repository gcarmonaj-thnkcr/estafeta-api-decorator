export interface Transaction {
  id: string;
  authorization: string;
  operation_type: 'in' | 'out';
  transaction_type: 'charge' | 'payout' | string;
  status: 'completed' | 'failed' | 'pending' | string;
  conciliated: boolean;
  creation_date: string; // ISO format
  operation_date: string; // ISO format
  description: string;
  error_message: string | null;
  order_id: string | null;
  card: {
    type: 'credit' | 'debit';
    brand: string;
    address: string | null;
    card_number: string;
    holder_name: string;
    expiration_year: string;
    expiration_month: string;
    allows_charges: boolean;
    allows_payouts: boolean;
    bank_name: string;
    card_business_type: string | null;
    dcc: string | null;
    bank_code: string;
  };
  fee: {
    amount: number;
    tax: number;
    surcharge: number | null;
    base_commission: number | null;
    currency: string;
  };
  amount: number;
  customer: {
    name: string;
    last_name: string;
    email: string;
    phone_number: string;
    address: string | null;
    creation_date: string;
    external_id: string | null;
    clabe: string | null;
  };
  payment_method: {
    type: string;
    url: string;
  };
  currency: string;
  method: string;
}
