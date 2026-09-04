import { NextResponse } from 'next/server';

export interface ApiSuccessOptions {
  status?: number;
  message?: string;
  meta?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface ApiErrorOptions {
  status?: number;
  code?: string;
  details?: any;
  errors?: Record<string, string[]> | string[];
  headers?: Record<string, string>;
}

export function apiSuccess<T extends Record<string, any>>(
  data: T,
  options?: ApiSuccessOptions
): NextResponse {
  const status = options?.status || 200;
  const payload: Record<string, any> = {
    ...data,
  };

  if (options?.message) {
    payload.message = options.message;
  }
  if (options?.meta) {
    payload.meta = options.meta;
  }

  return NextResponse.json(payload, {
    status,
    headers: options?.headers,
  });
}

export function apiError(
  message: string,
  options?: ApiErrorOptions
): NextResponse {
  const status = options?.status || 400;
  const payload: Record<string, any> = {
    error: message,
    code: options?.code || null,
    details: options?.details || null,
  };

  if (options?.errors) {
    payload.errors = options.errors;
  }

  return NextResponse.json(payload, {
    status,
    headers: options?.headers,
  });
}

export function apiUnauthorized(message = 'يرجى تسجيل الدخول أولاً'): NextResponse {
  return apiError(message, { status: 401, code: 'UNAUTHORIZED' });
}

export function apiForbidden(message = 'غير مصرح لك بإجراء هذه العملية'): NextResponse {
  return apiError(message, { status: 403, code: 'FORBIDDEN' });
}

export function apiNotFound(message = 'العنصر المطلوب غير موجود'): NextResponse {
  return apiError(message, { status: 404, code: 'NOT_FOUND' });
}

export function apiBadRequest(
  message = 'البيانات المدخلة غير صحيحة أو ناقصة',
  errors?: any
): NextResponse {
  return apiError(message, { status: 400, code: 'BAD_REQUEST', errors });
}

export function apiPayloadTooLarge(
  message = 'حجم البيانات المرفوعة يتجاوز الحد المسموح به',
  options?: ApiErrorOptions
): NextResponse {
  return apiError(message, { status: 413, code: 'PAYLOAD_TOO_LARGE', ...options });
}

export function apiServerError(
  message = 'حدث خطأ غير متوقع في الخادم',
  errorDetails?: any
): NextResponse {
  if (errorDetails) {
    console.error('Server Internal Error:', errorDetails?.message || errorDetails);
  }
  return apiError(message, { status: 500, code: 'INTERNAL_SERVER_ERROR' });
}
