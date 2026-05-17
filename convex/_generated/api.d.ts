/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as calls from "../calls.js";
import type * as emails from "../emails.js";
import type * as http from "../http.js";
import type * as leads from "../leads.js";
import type * as stats from "../stats.js";
import type * as telegram from "../telegram.js";
import type * as telegramWebhook from "../telegramWebhook.js";
import type * as vapiWebhook from "../vapiWebhook.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  calls: typeof calls;
  emails: typeof emails;
  http: typeof http;
  leads: typeof leads;
  stats: typeof stats;
  telegram: typeof telegram;
  telegramWebhook: typeof telegramWebhook;
  vapiWebhook: typeof vapiWebhook;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
