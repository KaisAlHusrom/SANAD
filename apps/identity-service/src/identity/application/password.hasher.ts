import { Injectable } from '@nestjs/common';
// argon2 is CJS — default-import the module object (named exports aren't reliably
// exposed to Node's ESM loader).
import argon2 from 'argon2';

/** Argon2 password hashing, wrapped as an injectable seam so it's easy to fake. */
@Injectable()
export class PasswordHasher {
  hash(plain: string): Promise<string> {
    return argon2.hash(plain);
  }

  /** True when `plain` matches the stored argon2 `digest`. */
  verify(digest: string, plain: string): Promise<boolean> {
    return argon2.verify(digest, plain);
  }
}
