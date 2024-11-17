export interface FieldError {
  field: string | number;
  message: string;
}
export class ValidationError extends Error {
  public readonly fieldErrors: FieldError[];

  constructor(fieldErrors: FieldError[]) {
    const errorMessage = fieldErrors.map((err) => `${err.message}`).join(", ");
    super(errorMessage);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;

    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
