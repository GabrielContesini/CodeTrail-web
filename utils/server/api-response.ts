import { NextResponse } from "next/server";

export const PRIVATE_NO_STORE_CACHE_CONTROL =
  "private, no-store, max-age=0, must-revalidate";
export const PUBLIC_CONFIG_CACHE_CONTROL =
  "public, max-age=300, s-maxage=300, stale-while-revalidate=1800";
export const PUBLIC_DOWNLOAD_CACHE_CONTROL =
  "public, max-age=300, s-maxage=300, stale-while-revalidate=900";

interface ApiResponseOptions {
  status?: number;
  cacheControl?: string;
  requestId?: string;
  headers?: HeadersInit;
}

export function jsonApiResponse(
  body: unknown,
  {
    status = 200,
    cacheControl = PRIVATE_NO_STORE_CACHE_CONTROL,
    requestId,
    headers,
  }: ApiResponseOptions = {},
) {
  const response = NextResponse.json(body, {
    status,
    headers,
  });

  response.headers.set("Cache-Control", cacheControl);
  if (requestId) {
    response.headers.set("x-request-id", requestId);
  }

  return response;
}

export function redirectApiResponse(
  location: string,
  {
    status = 307,
    cacheControl = PUBLIC_DOWNLOAD_CACHE_CONTROL,
    requestId,
    headers,
  }: ApiResponseOptions = {},
) {
  const response = NextResponse.redirect(location, {
    status,
    headers,
  });

  response.headers.set("Cache-Control", cacheControl);
  if (requestId) {
    response.headers.set("x-request-id", requestId);
  }

  return response;
}
