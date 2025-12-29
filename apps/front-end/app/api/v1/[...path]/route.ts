import type { NextRequest } from "next/server";

const DEFAULT_BACKEND_URL = "http://localhost:4000/api/v1";
const BACKEND_BASE_URL = sanitizeBaseUrl(
  process.env.API_BASE_URL ??
    process.env.BACKEND_API_URL ??
    DEFAULT_BACKEND_URL,
);

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    path?: string[];
  };
};

const PASSTHROUGH_METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"] as const;
type SupportedMethod = (typeof PASSTHROUGH_METHODS)[number];

function sanitizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function buildTargetUrl(pathSegments: string[], search: string): string {
  const normalizedPath = pathSegments.filter(Boolean).join("/");
  const suffix = normalizedPath ? `/${normalizedPath}` : "";
  return `${BACKEND_BASE_URL}${suffix}${search ?? ""}`;
}

function cloneHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  headers.delete("content-length");
  headers.delete("connection");
  headers.delete("keep-alive");
  headers.delete("transfer-encoding");

  const originalForwardedFor = headers.get("x-forwarded-for");
  if (request.ip) {
    headers.set(
      "x-forwarded-for",
      originalForwardedFor ? `${originalForwardedFor}, ${request.ip}` : request.ip,
    );
  }

  const forwardedProto = request.nextUrl?.protocol?.replace(/:$/, "");
  if (forwardedProto) {
    headers.set("x-forwarded-proto", forwardedProto);
  }

  if (request.headers.get("host")) {
    headers.set("x-forwarded-host", request.headers.get("host") as string);
  }

  return headers;
}

async function proxyRequest(
  request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  const method = (request.method ?? "GET").toUpperCase() as SupportedMethod;

  if (!PASSTHROUGH_METHODS.includes(method)) {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: PASSTHROUGH_METHODS.join(", ") },
    });
  }

  const targetUrl = buildTargetUrl(context.params?.path ?? [], request.nextUrl.search);
  const headers = cloneHeaders(request);

  const init: RequestInit = {
    method,
    headers,
    redirect: "manual",
  };

  if (method !== "GET" && method !== "HEAD") {
    const body = await request.arrayBuffer();
    if (body.byteLength) {
      init.body = body;
    }
  }

  try {
    const backendResponse = await fetch(targetUrl, init);
    const responseHeaders = new Headers(backendResponse.headers);

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[api proxy] failed request", {
      path: context.params?.path,
      message: error instanceof Error ? error.message : error,
    });

    return new Response("Bad Gateway", { status: 502 });
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
