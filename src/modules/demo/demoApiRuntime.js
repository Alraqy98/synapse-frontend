// src/modules/demo/demoApiRuntime.js
// Runtime flag + single interception entry point for Demo Mode.
// API wrappers can import demoApiIntercept without depending on React.

import { getDemoResponse } from "./demoApiAdapter";

let demoActive = false;

export function setDemoActive(active) {
  demoActive = !!active;
}

/**
 * @param {{ method: string, url: string, body?: any }} req
 * @returns {{ handled: boolean, data?: any }}
 */
export function demoApiIntercept(req) {
  if (!demoActive) {
    return { handled: false };
  }
  return getDemoResponse(req);
}


