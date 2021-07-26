import { Page, Pager } from "./memory_pager.ts";

/** Is the given number a power of two? */
function powerOfTwo(x: number): boolean {
  return !(x & (x - 1));
}

/** Bitfield constructor options. */
export interface BitfieldOptions {
  pageOffset?: number;
  pageSize?: number;
  pages?: Pager;
  trackUpdates?: boolean;
  buffer?: Uint8Array;
}

/** A class representation of a bitfield. */
export class Bitfield {
  readonly pageOffset: number;
  readonly pageSize: number;
  readonly pages: Pager;

  byteLength: number;
  length: number;

  private _trackUpdates: boolean;
  private _pageMask: number;

  /** Creates a bitfield instance. */
  constructor(opts: Uint8Array | BitfieldOptions = {}) {
    if (opts instanceof Uint8Array) {
      opts = { buffer: opts };
    }

    this.pageOffset = opts.pageOffset || 0;
    this.pageSize = opts.pageSize || 1024;
    this.pages = opts.pages || new Pager(this.pageSize);

    this.byteLength = this.pages.length * this.pageSize;
    this.length = 8 * this.byteLength;

    if (!powerOfTwo(this.pageSize)) {
      throw new Error("The page size should be a power of two");
    }

    this._trackUpdates = !!opts.trackUpdates;
    this._pageMask = this.pageSize - 1;

    if (opts.buffer) {
      for (let i = 0; i < opts.buffer.length; i += this.pageSize) {
        this.pages.set(
          i / this.pageSize,
          opts.buffer.slice(i, i + this.pageSize),
        );
      }

      this.byteLength = opts.buffer.length;
      this.length = 8 * this.byteLength;
    }
  }

  /** Gets a byte. */
  getByte(i: number): number {
    const o: number = i & this._pageMask;
    const j: number = (i - o) / this.pageSize;
    const page: Page = this.pages.get(j, true);

    return page ? page.buffer[o + this.pageOffset] : 0;
  }

  /** Sets a byte. */
  setByte(i: number, b: number): boolean {
    const o: number = (i & this._pageMask) + this.pageOffset;
    const j: number = (i - o) / this.pageSize;
    const page: Page = this.pages.get(j, false);

    if (page.buffer[o] === b) {
      return false;
    }

    page.buffer[o] = b;

    if (i >= this.byteLength) {
      this.byteLength = i + 1;
      this.length = this.byteLength * 8;
    }

    if (this._trackUpdates) {
      this.pages.updated(page);
    }

    return true;
  }

  /** Gets a bit. */
  get(i: number): boolean {
    const o: number = i & 7;
    const j: number = (i - o) / 8;

    return !!(this.getByte(j) & (128 >> o));
  }

  /** Sets a bit. */
  set(i: number, v: boolean): boolean {
    const o: number = i & 7;
    const j: number = (i - o) / 8;
    const b: number = this.getByte(j);

    return this.setByte(j, v ? b | (128 >> o) : b & (255 ^ (128 >> o)));
  }

  /** Gets a single buffer representing the entire bitfield. */
  toBuffer(): Uint8Array {
    const all: Uint8Array = new Uint8Array(this.pages.length * this.pageSize);

    for (let i = 0; i < this.pages.length; i++) {
      const next: Page = this.pages.get(i, true);

      if (next) {
        all
          .subarray(i * this.pageSize)
          .set(
            next.buffer.subarray(
              this.pageOffset,
              this.pageOffset + this.pageSize,
            ),
          );
      }
    }

    return all;
  }
}
