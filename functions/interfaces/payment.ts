export interface ITransactionEvent {
  type: string;
  transaction: ITrasactionBody;
}

interface ITrasactionBody {
  id: string;
  authorization: string;
  operation_type: string;
  status: string;
  description: string;
  order_id: string;
  amount: number;
  payment_method: IPaymentMethod;
  method: string;
}

interface IPaymentMethod {
  type: string;
}
