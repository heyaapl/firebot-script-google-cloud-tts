type ErrData = {
  /** The HTTP status code. */
  code: number;
  /** An optional error message, such as "Request from referer XYZ are blocked". */
  message?: string;
  /** An error identifier, such as "PERMISSION_DENIED". */
  status: string;
};

export class GoogleTtsError extends Error {
  private readonly _errData: ErrData;

  constructor(errData: ErrData) {
    super(`E_${errData.status} (code ${errData.code}): ${errData.message}`);
    this._errData = errData;
    this.name = "GoogleTtsError";
    Object.setPrototypeOf(this, GoogleTtsError.prototype);
  }

  get code() {
    return this._errData.code;
  }

  get data() {
    return this._errData;
  }

  get innerMessage() {
    return this._errData.message;
  }

  get status() {
    return this._errData.status;
  }
};
