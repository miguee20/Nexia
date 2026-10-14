import { DomainError } from './index';

export class PaymentNotFoundError extends DomainError {
  constructor(message: string = 'Pago no encontrado') {
    super(message, 404);
  }
}

export class FeeAlreadyPaidError extends DomainError {
  constructor(message: string = 'La cuota ya se encuentra pagada') {
    super(message, 409);
  }
}

export class PaymentAmountMismatchError extends DomainError {
  constructor(message: string = 'El monto del pago excede el saldo pendiente de la cuota') {
    super(message, 422);
  }
}

export class UnauthorizedPaymentActionError extends DomainError {
  constructor(message: string = 'No tienes permiso para realizar esta acción sobre el pago') {
    super(message, 403);
  }
}

export class PaymentNotPendingError extends DomainError {
  constructor(message: string = 'El pago ya fue revisado') {
    super(message, 409);
  }
}

export class PaymentNotApprovedError extends DomainError {
  constructor(message: string = 'Solo se puede generar recibo de pagos aprobados') {
    super(message, 409);
  }
}
