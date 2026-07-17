/**
 * express.d.ts
 * Global Express namespace augmentation for Stockora.
 *
 * @types/passport declares `Express.User` as an empty interface and merges
 * `req.user: Express.User | undefined` into Request.  We extend that interface
 * here so every middleware and controller gets the correct authenticated user
 * shape — without needing a conflicting property override in AuthenticatedRequest.
 *
 * TypeScript merges this declaration with @types/passport's Express.User,
 * producing a single interface that satisfies both.
 */

declare namespace Express {
  /**
   * Stockora JWT payload — merged into req.user everywhere via @types/passport.
   * Matches the payload signed in AuthService and decoded in authMiddleware.
   */
  interface User {
    id: string;
    username: string;
    roleName: string;
    sessionToken?: string;
  }
}
