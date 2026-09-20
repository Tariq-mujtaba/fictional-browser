import { BadRequestException, Injectable } from '@nestjs/common';
import { Parser } from 'htmlparser2';
import sanitizeHtml, { type IOptions } from 'sanitize-html';
import {
  isValidFictionalAddress,
  normalizeFictionalAddress,
} from '../common/fictional-address.js';

const NON_TEXT_TAGS = [
  'script',
  'style',
  'textarea',
  'option',
  'xmp',
  'iframe',
  'object',
  'embed',
  'svg',
  'math',
  'template',
  'noscript',
];

const SANITIZE_OPTIONS: IOptions = {
  allowedTags: [
    'a',
    'abbr',
    'article',
    'aside',
    'b',
    'blockquote',
    'br',
    'caption',
    'code',
    'col',
    'colgroup',
    'dd',
    'del',
    'details',
    'div',
    'dl',
    'dt',
    'em',
    'figcaption',
    'figure',
    'footer',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'header',
    'hr',
    'i',
    'li',
    'main',
    'mark',
    'nav',
    'ol',
    'p',
    'pre',
    'section',
    'small',
    'span',
    'strong',
    'sub',
    'summary',
    'sup',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'tr',
    'u',
    'ul',
  ],
  allowedAttributes: {
    '*': ['style'],
    a: ['href', 'title', 'style'],
    abbr: ['title', 'style'],
    col: ['span', 'style'],
    colgroup: ['span', 'style'],
    ol: ['start', 'style'],
    li: ['value', 'style'],
    td: ['colspan', 'rowspan', 'style'],
    th: ['colspan', 'rowspan', 'scope', 'style'],
  },
  allowedSchemes: [],
  allowProtocolRelative: false,
  allowedStyles: {
    '*': {
      color: [
        /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i,
        /^(?:black|blue|gray|green|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow)$/,
      ],
      'background-color': [
        /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i,
        /^(?:black|blue|gray|green|maroon|navy|olive|orange|purple|red|silver|teal|transparent|white|yellow)$/,
      ],
      'font-style': [/^(?:italic|normal)$/],
      'font-weight': [/^(?:normal|bold|[1-9]00)$/],
      'text-align': [/^(?:center|justify|left|right)$/],
      'text-decoration': [/^(?:line-through|none|underline)$/],
      width: [/^(?:100|[1-9]?\d)%$/, /^\d{1,4}px$/],
    },
    table: {
      'border-collapse': [/^(?:collapse|separate)$/],
    },
  },
  nestingLimit: 50,
  nonTextTags: NON_TEXT_TAGS,
  transformTags: {
    a: (tagName, attributes) => {
      const href = attributes.href;

      if (typeof href !== 'string' || !isValidFictionalAddress(href)) {
        const attribs: Record<string, string> = {};

        if (attributes.style !== undefined) {
          attribs.style = attributes.style;
        }

        return {
          tagName: 'span',
          attribs,
        };
      }

      return {
        tagName,
        attribs: {
          ...attributes,
          href: normalizeFictionalAddress(href),
        },
      };
    },
  },
};

export interface PreparedSiteContent {
  html: string;
  searchText: string;
}

@Injectable()
export class SiteContentService {
  prepare(rawHtml: string): PreparedSiteContent {
    const html = sanitizeHtml(rawHtml, SANITIZE_OPTIONS);
    const searchText = extractVisibleText(html);

    if (searchText === '') {
      throw new BadRequestException('HTML must contain visible text');
    }

    return { html, searchText };
  }

  toPlainText(value: string): string {
    const html = sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
      nonTextTags: NON_TEXT_TAGS,
    });

    return extractVisibleText(html);
  }
}

function extractVisibleText(html: string): string {
  const chunks: string[] = [];
  const parser = new Parser(
    {
      onopentag: () => chunks.push(' '),
      ontext: (text) => chunks.push(text),
      onclosetag: () => chunks.push(' '),
    },
    { decodeEntities: true },
  );

  parser.end(html);

  return chunks.join(' ').replace(/\s+/g, ' ').trim();
}
