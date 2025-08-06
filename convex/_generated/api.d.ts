/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as PdfStorage from "../PdfStorage.js";
import type * as action from "../action.js";
import type * as editordata from "../editordata.js";
import type * as helper_functions_retrieveTopKChunks from "../helper_functions/retrieveTopKChunks.js";
import type * as internal_ from "../internal.js";
import type * as langchain_db from "../langchain/db.js";
import type * as user from "../user.js";
import type * as youtube from "../youtube.js";
import type * as youtubeEmbeddings from "../youtubeEmbeddings.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  PdfStorage: typeof PdfStorage;
  action: typeof action;
  editordata: typeof editordata;
  "helper_functions/retrieveTopKChunks": typeof helper_functions_retrieveTopKChunks;
  internal: typeof internal_;
  "langchain/db": typeof langchain_db;
  user: typeof user;
  youtube: typeof youtube;
  youtubeEmbeddings: typeof youtubeEmbeddings;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
