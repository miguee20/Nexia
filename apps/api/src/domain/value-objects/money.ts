import { Prisma } from '@prisma/client';
import { InvalidFeeAmountError } from '../errors/fee.errors';

/**
 * Arbitrary-precision decimal (decimal.js, shipped by Prisma).
 * Native JS floats must never be used for monetary calculations.
 */
export const Decimal = Prisma.Decimal;
export type Decimal = Prisma.Decimal;

export type MoneyInput = string | number | Decimal;

/** Parses a monetary input without going through float arithmetic. */
export function parseMoney(value: MoneyInput): Decimal {
  try {
    const parsed = new Decimal(typeof value === 'number' ? String(value) : value);
    if (!parsed.isFinite()) throw new InvalidFeeAmountError();
    return parsed;
  } catch (e) {
    if (e instanceof InvalidFeeAmountError) throw e;
    throw new InvalidFeeAmountError();
  }
}

/** Parses and requires a strictly positive amount, rounded to 2 decimals. */
export function parsePositiveMoney(value: MoneyInput): Decimal {
  const parsed = parseMoney(value);
  if (parsed.lessThanOrEqualTo(0)) throw new InvalidFeeAmountError();
  return parsed.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}
