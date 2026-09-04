import { NextRequest, NextResponse } from 'next/server';

/**
 * Standard Body Size Limits for Basita Platform
 */
export const BODY_LIMITS = {
  AUTH: 64 * 1024, // 64 KB (for login, register, forgot-password, reset-password)
  STANDARD_JSON: 1 * 1024 * 1024, // 1 MB (standard API JSON payloads)
  SUPPORT_TICKET: 2 * 1024 * 1024, // 2 MB (support tickets with text/meta)
  EXCEL_IMPORT: 5 * 1024 * 1024, // 5 MB (student roster import, supports thousands of records)
  BACKUP_IMPORT: 15 * 1024 * 1024, // 15 MB (full school-year multi-entity backup restore)
} as const;

export type BodyLimitType = keyof typeof BODY_LIMITS;

export interface ParseBodyResult<T> {
  data: T | null;
  errorResponse: NextResponse | null;
}

/**
 * Safely validates request size and parses JSON body with dual-layer server-side enforcement:
 * 1. Early-Check: Inspects Content-Length header for fast rejection before reading body.
 * 2. Incremental Stream Reader: Measures byte length chunk-by-chunk on the incoming ReadableStream,
 *    aborting immediately if the threshold is breached (guards against chunked, missing, or spoofed Content-Length).
 *
 * @param request NextRequest incoming HTTP request
 * @param limit Predefined limit key or raw byte limit number
 * @returns { data, errorResponse } - if errorResponse is non-null, route must return it immediately.
 */
export async function parseJsonWithLimit<T = any>(
  request: NextRequest,
  limit: number | BodyLimitType = 'STANDARD_JSON'
): Promise<ParseBodyResult<T>> {
  const maxBytes = typeof limit === 'number' ? limit : (BODY_LIMITS[limit] || BODY_LIMITS.STANDARD_JSON);
  const maxMb = (maxBytes / (1024 * 1024)).toFixed(1).replace('.0', '');
  const limitLabel = maxBytes >= 1024 * 1024 ? `${maxMb} ميجابايت` : `${Math.round(maxBytes / 1024)} كيلوبايت`;

  // -------------------------------------------------------------
  // Layer 1: Fast Early Check via Content-Length Header
  // -------------------------------------------------------------
  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader) {
    const declaredLength = parseInt(contentLengthHeader, 10);
    if (!isNaN(declaredLength) && declaredLength > maxBytes) {
      return {
        data: null,
        errorResponse: NextResponse.json(
          {
            error: `حجم البيانات المرفوعة يتجاوز الحد المسموح به (${limitLabel})`,
            code: 'PAYLOAD_TOO_LARGE',
          },
          { status: 413 }
        ),
      };
    }
  }

  // -------------------------------------------------------------
  // Layer 2: Incremental Stream-based Chunk Reader with Hard Cap
  // -------------------------------------------------------------
  if (!request.body) {
    return { data: {} as T, errorResponse: null };
  }

  // Fallback if ReadableStream reader is not available
  if (typeof request.body.getReader !== 'function') {
    try {
      const text = await request.text();
      if (Buffer.byteLength(text, 'utf-8') > maxBytes) {
        return {
          data: null,
          errorResponse: NextResponse.json(
            {
              error: `حجم البيانات المرفوعة يتجاوز الحد المسموح به (${limitLabel})`,
              code: 'PAYLOAD_TOO_LARGE',
            },
            { status: 413 }
          ),
        };
      }
      const parsed = text.trim() ? JSON.parse(text) : {};
      return { data: parsed as T, errorResponse: null };
    } catch {
      return {
        data: null,
        errorResponse: NextResponse.json(
          {
            error: 'البيانات المرسلة غير صالحة أو غير متوافقة مع صيغة JSON',
            code: 'INVALID_JSON',
          },
          { status: 400 }
        ),
      };
    }
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        totalBytes += value.byteLength;

        // Immediate stream abort if limit is exceeded during transmission
        if (totalBytes > maxBytes) {
          try {
            await reader.cancel('PAYLOAD_TOO_LARGE');
          } catch {}

          return {
            data: null,
            errorResponse: NextResponse.json(
              {
                error: `حجم البيانات المرفوعة يتجاوز الحد المسموح به (${limitLabel})`,
                code: 'PAYLOAD_TOO_LARGE',
              },
              { status: 413 }
            ),
          };
        }

        chunks.push(value);
      }
    }
  } catch (streamErr: any) {
    if (totalBytes > maxBytes) {
      return {
        data: null,
        errorResponse: NextResponse.json(
          {
            error: `حجم البيانات المرفوعة يتجاوز الحد المسموح به (${limitLabel})`,
            code: 'PAYLOAD_TOO_LARGE',
          },
          { status: 413 }
        ),
      };
    }
    return {
      data: null,
      errorResponse: NextResponse.json(
        {
          error: 'فشل استقبال البيانات من العميل أثناء النقل',
          code: 'CLIENT_STREAM_ERROR',
        },
        { status: 400 }
      ),
    };
  }

  // -------------------------------------------------------------
  // Layer 3: Payload Parsing & Validation
  // -------------------------------------------------------------
  if (chunks.length === 0) {
    return { data: {} as T, errorResponse: null };
  }

  try {
    const totalBuffer = Buffer.concat(chunks);
    const text = totalBuffer.toString('utf-8');
    if (!text.trim()) {
      return { data: {} as T, errorResponse: null };
    }
    const data = JSON.parse(text);
    return { data: data as T, errorResponse: null };
  } catch (parseErr) {
    return {
      data: null,
      errorResponse: NextResponse.json(
        {
          error: 'البيانات المرسلة غير صالحة أو غير متوافقة مع صيغة JSON',
          code: 'INVALID_JSON',
        },
        { status: 400 }
      ),
    };
  }
}
