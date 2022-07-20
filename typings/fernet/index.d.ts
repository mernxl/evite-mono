declare module 'fernet' {
  /**
   * @see https://www.npmjs.com/package/fernet/v/0.4.0
   */

  class Secret {
    constructor(secret: string);
  }

  class Token {
    constructor(config: { secret: Secret });
    constructor(config: { secret: Secret; token: string; ttl: number });

    encode(data: string): string;
    decode(): string;
  }

  export { Secret, Token };
}
