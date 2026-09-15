/**
 * Type-safe Result<T, E> envelope.
 * Core error handling foundation.
 */

export type Ok<T> = {
  readonly ok: true;
  readonly data: T;
};

export type Err<E> = {
  readonly ok: false;
  readonly error: E;
};

export type Result<T, E = Error> = Ok<T> | Err<E>;

export const ok = <T>(data: T): Ok<T> => ({
  ok: true,
  data,
});

export const err = <E>(error: E): Err<E> => ({
  ok: false,
  error,
});

export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result.ok;

export const isErr = <T, E>(result: Result<T, E>): result is Err<E> => !result.ok;

export const mapResult = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> => {
  if (result.ok) {
    return ok(fn(result.data));
  }
  return result;
};

export const mapErrResult = <T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> => {
  if (!result.ok) {
    return err(fn(result.error));
  }
  return result;
};
