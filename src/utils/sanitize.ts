/**
 * Input Sanitization Utility
 * Protects against XSS attacks by sanitizing user input
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - The unsanitized HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}

/**
 * Sanitize text input by removing all HTML tags
 * @param input - The unsanitized text
 * @returns Plain text without HTML tags
 */
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize user input for form fields
 * Allows basic formatting but removes dangerous scripts
 * @param input - The user input
 * @returns Sanitized input
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize rich text editor content
 * Allows more tags for rich text but still prevents XSS
 * @param content - Rich text content
 * @returns Sanitized rich text
 */
export function sanitizeRichText(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 'strike',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target'],
  });
}

/**
 * Sanitize URL to prevent javascript: and data: schemes
 * @param url - The URL to sanitize
 * @returns Safe URL or empty string
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmedUrl = url.trim().toLowerCase();

  // Block dangerous protocols
  if (
    trimmedUrl.startsWith('javascript:') ||
    trimmedUrl.startsWith('data:') ||
    trimmedUrl.startsWith('vbscript:')
  ) {
    return '';
  }

  return DOMPurify.sanitize(url);
}

/**
 * Sanitize object properties recursively
 * @param obj - Object with potentially unsafe values
 * @returns Object with sanitized string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized as T;
}

export default {
  sanitizeHtml,
  sanitizeText,
  sanitizeInput,
  sanitizeRichText,
  sanitizeUrl,
  sanitizeObject,
};
