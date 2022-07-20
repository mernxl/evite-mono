import { StatusCodes } from 'http-status-codes';

export interface IErrorResponse<T = string> {
  status: number;
  message: string;
  details: ValidationFieldErrors<T>;
}

/**
 * General Error Object, gets other props from Error which include
 *
 * name, message, stack
 */
export class ErrorResponse extends Error {
  constructor(
    public message = 'Internal Server Error',
    public status = StatusCodes.INTERNAL_SERVER_ERROR,
    public details?: ValidationFieldErrors<string> | unknown,
  ) {
    super(message);
    this.status = status || this.status;
  }
}

export type ValidationFieldErrors<T> = {
  [K in keyof T]?: string | ValidationFieldErrors<any>;
};

export class ValidationError<T> extends ErrorResponse {
  constructor(public fields: ValidationFieldErrors<T>, message = 'Input Validation Error') {
    super(message, StatusCodes.BAD_REQUEST, fields);
  }
}

export class AuthorizationError extends ErrorResponse {
  name = 'AuthorizationError';
  status = StatusCodes.UNAUTHORIZED;

  constructor(public message: string, public details?: unknown) {
    super(message, undefined, details);
  }
}

export class ForbiddenError extends ErrorResponse {
  name = 'ForbiddenError';
  status = StatusCodes.FORBIDDEN;

  constructor(public message: string, public details?: unknown) {
    super(message, undefined, details);
  }
}

/**
 * Since null is not allowed on OpenAPI, use this to represent null values on Spec
 */
export type NullValue = null;

export type InferMongooseProps<T> = {
  [K in keyof T]: T[K];
};

export function enumObjectValues(enumObject: Record<string, any>): string[] {
  const valueArray: string[] = [];
  if (!enumObject) {
    return valueArray;
  }

  for (const key in enumObject) {
    valueArray.push(enumObject[key]);
  }

  return valueArray;
}

export const capitalizeStr = (str: string, separator = ' '): string =>
  str
    .split(separator)
    .map((s) => s[0].toUpperCase() + s.slice(1).toLowerCase())
    .join(separator);
