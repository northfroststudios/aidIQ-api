export interface FieldError {
  field: string | number;
  message: string;
}

export class ValidationError extends Error {
  public readonly fieldErrors: FieldError[];

  constructor(fieldErrors: FieldError[]) {
    super("Validation Error");
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;

    // This is required in TypeScript when extending built-in classes
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
