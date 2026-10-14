import { DomainError } from './index';

export class FeeNotFoundError extends DomainError {
  constructor(message: string = 'Cuota no encontrada') {
    super(message, 404);
  }
}

export class InvalidFeeAmountError extends DomainError {
  constructor(message: string = 'El monto de la cuota debe ser un valor positivo válido') {
    super(message, 400);
  }
}

export class DuplicateFeePeriodError extends DomainError {
  constructor(message: string = 'Ya existe una cuota emitida para este periodo y concepto') {
    super(message, 409);
  }
}

export class TenantConfigMissingError extends DomainError {
  constructor(message: string = 'Configuración financiera del condominio incompleta') {
    super(message, 422);
  }
}
