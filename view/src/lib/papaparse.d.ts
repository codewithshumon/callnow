declare module "papaparse" {
  export interface ParseResult<T = any> {
    data: T[];
    errors: Array<{ type: string; code: string; message: string; row: number }>;
    meta: {
      delimiter: string;
      linebreak: string;
      aborted: boolean;
      truncated: boolean;
      cursor: number;
      fields?: string[];
    };
  }

  export interface ParseConfig<T = any> {
    delimiter?: string;
    newline?: string;
    quoteChar?: string;
    escapeChar?: string;
    header?: boolean;
    dynamicTyping?: boolean;
    preview?: number;
    encoding?: string;
    worker?: boolean;
    comments?: boolean | string;
    download?: boolean;
    skipEmptyLines?: boolean | "greedy";
    fastMode?: boolean;
    beforeFirstChunk?: (chunk: string) => string | void;
    withCredentials?: boolean;
    transform?: (value: string, field: string | number) => any;
    transformHeader?: (header: string, index: number) => string;
    complete?: (results: ParseResult<T>, file?: File) => void;
    error?: (error: { type: string; code: string; message: string; row: number }, file?: File) => void;
    chunk?: (results: ParseResult<T>, parser: { pause: () => void; resume: () => void; abort: () => void }) => void;
  }

  export function parse<T = any>(input: string | File, config?: ParseConfig<T>): ParseResult<T>;
  export function unparse(data: any[], config?: any): string;

  const Papa: {
    parse: typeof parse;
    unparse: typeof unparse;
  };

  export default Papa;
}
