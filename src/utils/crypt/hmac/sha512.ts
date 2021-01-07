//ORIGINAL PROJECT AND LICENSE IN: https://github.com/chiefbiiko/sha512
import { decode, encode } from "./deps.ts";

/** Byte length of a SHA512 hash. */
export const BYTES: number = 64;

/** A class representation of the SHA2-512 algorithm. */
export class SHA512 {
  readonly hashSize: number = BYTES;

  private _buffer: Uint8Array = new Uint8Array(128);
  private _bufferIndex!: number;
  private _count!: Uint32Array;
  private _K: Uint32Array;
  private _H!: Uint32Array;
  private _finalized!: boolean;

  /** Creates a SHA512 instance. */
  constructor() {
    // prettier-ignore
    this._K = new Uint32Array([
      0x428a2f98,
      0xd728ae22,
      0x71374491,
      0x23ef65cd,
      0xb5c0fbcf,
      0xec4d3b2f,
      0xe9b5dba5,
      0x8189dbbc,
      0x3956c25b,
      0xf348b538,
      0x59f111f1,
      0xb605d019,
      0x923f82a4,
      0xaf194f9b,
      0xab1c5ed5,
      0xda6d8118,
      0xd807aa98,
      0xa3030242,
      0x12835b01,
      0x45706fbe,
      0x243185be,
      0x4ee4b28c,
      0x550c7dc3,
      0xd5ffb4e2,
      0x72be5d74,
      0xf27b896f,
      0x80deb1fe,
      0x3b1696b1,
      0x9bdc06a7,
      0x25c71235,
      0xc19bf174,
      0xcf692694,
      0xe49b69c1,
      0x9ef14ad2,
      0xefbe4786,
      0x384f25e3,
      0x0fc19dc6,
      0x8b8cd5b5,
      0x240ca1cc,
      0x77ac9c65,
      0x2de92c6f,
      0x592b0275,
      0x4a7484aa,
      0x6ea6e483,
      0x5cb0a9dc,
      0xbd41fbd4,
      0x76f988da,
      0x831153b5,
      0x983e5152,
      0xee66dfab,
      0xa831c66d,
      0x2db43210,
      0xb00327c8,
      0x98fb213f,
      0xbf597fc7,
      0xbeef0ee4,
      0xc6e00bf3,
      0x3da88fc2,
      0xd5a79147,
      0x930aa725,
      0x06ca6351,
      0xe003826f,
      0x14292967,
      0x0a0e6e70,
      0x27b70a85,
      0x46d22ffc,
      0x2e1b2138,
      0x5c26c926,
      0x4d2c6dfc,
      0x5ac42aed,
      0x53380d13,
      0x9d95b3df,
      0x650a7354,
      0x8baf63de,
      0x766a0abb,
      0x3c77b2a8,
      0x81c2c92e,
      0x47edaee6,
      0x92722c85,
      0x1482353b,
      0xa2bfe8a1,
      0x4cf10364,
      0xa81a664b,
      0xbc423001,
      0xc24b8b70,
      0xd0f89791,
      0xc76c51a3,
      0x0654be30,
      0xd192e819,
      0xd6ef5218,
      0xd6990624,
      0x5565a910,
      0xf40e3585,
      0x5771202a,
      0x106aa070,
      0x32bbd1b8,
      0x19a4c116,
      0xb8d2d0c8,
      0x1e376c08,
      0x5141ab53,
      0x2748774c,
      0xdf8eeb99,
      0x34b0bcb5,
      0xe19b48a8,
      0x391c0cb3,
      0xc5c95a63,
      0x4ed8aa4a,
      0xe3418acb,
      0x5b9cca4f,
      0x7763e373,
      0x682e6ff3,
      0xd6b2b8a3,
      0x748f82ee,
      0x5defb2fc,
      0x78a5636f,
      0x43172f60,
      0x84c87814,
      0xa1f0ab72,
      0x8cc70208,
      0x1a6439ec,
      0x90befffa,
      0x23631e28,
      0xa4506ceb,
      0xde82bde9,
      0xbef9a3f7,
      0xb2c67915,
      0xc67178f2,
      0xe372532b,
      0xca273ece,
      0xea26619c,
      0xd186b8c7,
      0x21c0c207,
      0xeada7dd6,
      0xcde0eb1e,
      0xf57d4f7f,
      0xee6ed178,
      0x06f067aa,
      0x72176fba,
      0x0a637dc5,
      0xa2c898a6,
      0x113f9804,
      0xbef90dae,
      0x1b710b35,
      0x131c471b,
      0x28db77f5,
      0x23047d84,
      0x32caab7b,
      0x40c72493,
      0x3c9ebe0a,
      0x15c9bebc,
      0x431d67c4,
      0x9c100d4c,
      0x4cc5d4be,
      0xcb3e42b6,
      0x597f299c,
      0xfc657e2a,
      0x5fcb6fab,
      0x3ad6faec,
      0x6c44198c,
      0x4a475817,
    ]);

    this.init();
  }

  /** Initializes a SHA512 instance. */
  init(): SHA512 {
    // prettier-ignore
    this._H = new Uint32Array([
      0x6a09e667,
      0xf3bcc908,
      0xbb67ae85,
      0x84caa73b,
      0x3c6ef372,
      0xfe94f82b,
      0xa54ff53a,
      0x5f1d36f1,
      0x510e527f,
      0xade682d1,
      0x9b05688c,
      0x2b3e6c1f,
      0x1f83d9ab,
      0xfb41bd6b,
      0x5be0cd19,
      0x137e2179,
    ]);

    this._bufferIndex = 0;
    this._count = new Uint32Array(2);
    this._buffer.fill(0);
    this._finalized = false;

    return this;
  }

  /** Updates the hash with additional message data. */
  update(msg: string | Uint8Array, inputEncoding?: string): SHA512 {
    if (msg === null) {
      throw new TypeError("msg must be a string or Uint8Array.");
    } else if (typeof msg === "string") {
      msg = encode(msg, inputEncoding) as Uint8Array;
    }

    // process the msg as many times as possible, the rest is stored in the
    // buffer; message is processed in 1024 bit (128 byte chunks)
    for (let i = 0; i < msg.length; i++) {
      this._buffer[this._bufferIndex++] = msg[i];
      if (this._bufferIndex === 128) {
        this.transform();
        this._bufferIndex = 0;
      }
    }

    // counter update (number of message bits)
    let c = this._count;

    if ((c[0] += msg.length << 3) < msg.length << 3) {
      c[1]++;
    }

    c[1] += msg.length >>> 29;

    return this;
  }

  /** Finalizes the hash with additional message data. */
  digest(outputEncoding?: string): string | Uint8Array {
    if (this._finalized) {
      throw new Error("digest has already been called.");
    }

    this._finalized = true;

    // append '1'
    var b = this._buffer,
      idx = this._bufferIndex;
    b[idx++] = 0x80;

    // zeropad up to byte pos 112
    while (idx !== 112) {
      if (idx === 128) {
        this.transform();
        idx = 0;
      }
      b[idx++] = 0;
    }

    // append length in bits
    let c = this._count;

    b[112] = b[113] = b[114] = b[115] = b[116] = b[117] = b[118] = b[119] = 0;
    b[120] = (c[1] >>> 24) & 0xff;
    b[121] = (c[1] >>> 16) & 0xff;
    b[122] = (c[1] >>> 8) & 0xff;
    b[123] = (c[1] >>> 0) & 0xff;
    b[124] = (c[0] >>> 24) & 0xff;
    b[125] = (c[0] >>> 16) & 0xff;
    b[126] = (c[0] >>> 8) & 0xff;
    b[127] = (c[0] >>> 0) & 0xff;

    this.transform();

    // return the hash as byte array
    let i,
      hash = new Uint8Array(64);

    for (i = 0; i < 16; i++) {
      hash[(i << 2) + 0] = (this._H[i] >>> 24) & 0xff;
      hash[(i << 2) + 1] = (this._H[i] >>> 16) & 0xff;
      hash[(i << 2) + 2] = (this._H[i] >>> 8) & 0xff;
      hash[(i << 2) + 3] = this._H[i] & 0xff;
    }

    // clear internal states and prepare for new hash
    this.init();

    return outputEncoding ? decode(hash, outputEncoding) : hash;
  }

  /** Performs one transformation cycle. */
  private transform(): void {
    let h = this._H,
      h0h = h[0],
      h0l = h[1],
      h1h = h[2],
      h1l = h[3],
      h2h = h[4],
      h2l = h[5],
      h3h = h[6],
      h3l = h[7],
      h4h = h[8],
      h4l = h[9],
      h5h = h[10],
      h5l = h[11],
      h6h = h[12],
      h6l = h[13],
      h7h = h[14],
      h7l = h[15];

    let ah = h0h,
      al = h0l,
      bh = h1h,
      bl = h1l,
      ch = h2h,
      cl = h2l,
      dh = h3h,
      dl = h3l,
      eh = h4h,
      el = h4l,
      fh = h5h,
      fl = h5l,
      gh = h6h,
      gl = h6l,
      hh = h7h,
      hl = h7l;

    // convert byte buffer into w[0..31]
    let i,
      w = new Uint32Array(160);

    for (i = 0; i < 32; i++) {
      w[i] = this._buffer[(i << 2) + 3] |
        (this._buffer[(i << 2) + 2] << 8) |
        (this._buffer[(i << 2) + 1] << 16) |
        (this._buffer[i << 2] << 24);
    }

    // fill w[32..159]
    let gamma0xl,
      gamma0xh,
      gamma0l,
      gamma0h,
      gamma1xl,
      gamma1xh,
      gamma1l,
      gamma1h,
      wrl,
      wrh,
      wr7l,
      wr7h,
      wr16l,
      wr16h;

    for (i = 16; i < 80; i++) {
      // Gamma0
      gamma0xh = w[(i - 15) * 2];
      gamma0xl = w[(i - 15) * 2 + 1];
      gamma0h = ((gamma0xl << 31) | (gamma0xh >>> 1)) ^
        ((gamma0xl << 24) | (gamma0xh >>> 8)) ^
        (gamma0xh >>> 7);
      gamma0l = ((gamma0xh << 31) | (gamma0xl >>> 1)) ^
        ((gamma0xh << 24) | (gamma0xl >>> 8)) ^
        ((gamma0xh << 25) | (gamma0xl >>> 7));

      // Gamma1
      gamma1xh = w[(i - 2) * 2];
      gamma1xl = w[(i - 2) * 2 + 1];
      gamma1h = ((gamma1xl << 13) | (gamma1xh >>> 19)) ^
        ((gamma1xh << 3) | (gamma1xl >>> 29)) ^
        (gamma1xh >>> 6);
      gamma1l = ((gamma1xh << 13) | (gamma1xl >>> 19)) ^
        ((gamma1xl << 3) | (gamma1xh >>> 29)) ^
        ((gamma1xh << 26) | (gamma1xl >>> 6));

      // shortcuts
      (wr7h = w[(i - 7) * 2]),
        (wr7l = w[(i - 7) * 2 + 1]),
        (wr16h = w[(i - 16) * 2]),
        (wr16l = w[(i - 16) * 2 + 1]);

      // W(round) = gamma0 + W(round - 7) + gamma1 + W(round - 16)
      wrl = gamma0l + wr7l;
      wrh = gamma0h + wr7h + (wrl >>> 0 < gamma0l >>> 0 ? 1 : 0);
      wrl += gamma1l;
      wrh += gamma1h + (wrl >>> 0 < gamma1l >>> 0 ? 1 : 0);
      wrl += wr16l;
      wrh += wr16h + (wrl >>> 0 < wr16l >>> 0 ? 1 : 0);

      // store
      w[i * 2] = wrh;
      w[i * 2 + 1] = wrl;
    }

    // compress
    let chl,
      chh,
      majl,
      majh,
      sig0l,
      sig0h,
      sig1l,
      sig1h,
      krl,
      krh,
      t1l,
      t1h,
      t2l,
      t2h;

    for (i = 0; i < 80; i++) {
      // Ch
      chh = (eh & fh) ^ (~eh & gh);
      chl = (el & fl) ^ (~el & gl);

      // Maj
      majh = (ah & bh) ^ (ah & ch) ^ (bh & ch);
      majl = (al & bl) ^ (al & cl) ^ (bl & cl);

      // Sigma0
      sig0h = ((al << 4) | (ah >>> 28)) ^
        ((ah << 30) | (al >>> 2)) ^
        ((ah << 25) | (al >>> 7));
      sig0l = ((ah << 4) | (al >>> 28)) ^
        ((al << 30) | (ah >>> 2)) ^
        ((al << 25) | (ah >>> 7));

      // Sigma1
      sig1h = ((el << 18) | (eh >>> 14)) ^
        ((el << 14) | (eh >>> 18)) ^
        ((eh << 23) | (el >>> 9));
      sig1l = ((eh << 18) | (el >>> 14)) ^
        ((eh << 14) | (el >>> 18)) ^
        ((el << 23) | (eh >>> 9));

      // K(round)
      krh = this._K[i * 2];
      krl = this._K[i * 2 + 1];

      // t1 = h + sigma1 + ch + K(round) + W(round)
      t1l = hl + sig1l;
      t1h = hh + sig1h + (t1l >>> 0 < hl >>> 0 ? 1 : 0);
      t1l += chl;
      t1h += chh + (t1l >>> 0 < chl >>> 0 ? 1 : 0);
      t1l += krl;
      t1h += krh + (t1l >>> 0 < krl >>> 0 ? 1 : 0);
      t1l = t1l + w[i * 2 + 1];
      t1h += w[i * 2] + (t1l >>> 0 < w[i * 2 + 1] >>> 0 ? 1 : 0);

      // t2 = sigma0 + maj
      t2l = sig0l + majl;
      t2h = sig0h + majh + (t2l >>> 0 < sig0l >>> 0 ? 1 : 0);

      // update working variables
      hh = gh;
      hl = gl;
      gh = fh;
      gl = fl;
      fh = eh;
      fl = el;
      el = (dl + t1l) | 0;
      eh = (dh + t1h + (el >>> 0 < dl >>> 0 ? 1 : 0)) | 0;
      dh = ch;
      dl = cl;
      ch = bh;
      cl = bl;
      bh = ah;
      bl = al;
      al = (t1l + t2l) | 0;
      ah = (t1h + t2h + (al >>> 0 < t1l >>> 0 ? 1 : 0)) | 0;
    }

    // intermediate hash
    h0l = h[1] = (h0l + al) | 0;
    h[0] = (h0h + ah + (h0l >>> 0 < al >>> 0 ? 1 : 0)) | 0;
    h1l = h[3] = (h1l + bl) | 0;
    h[2] = (h1h + bh + (h1l >>> 0 < bl >>> 0 ? 1 : 0)) | 0;
    h2l = h[5] = (h2l + cl) | 0;
    h[4] = (h2h + ch + (h2l >>> 0 < cl >>> 0 ? 1 : 0)) | 0;
    h3l = h[7] = (h3l + dl) | 0;
    h[6] = (h3h + dh + (h3l >>> 0 < dl >>> 0 ? 1 : 0)) | 0;
    h4l = h[9] = (h4l + el) | 0;
    h[8] = (h4h + eh + (h4l >>> 0 < el >>> 0 ? 1 : 0)) | 0;
    h5l = h[11] = (h5l + fl) | 0;
    h[10] = (h5h + fh + (h5l >>> 0 < fl >>> 0 ? 1 : 0)) | 0;
    h6l = h[13] = (h6l + gl) | 0;
    h[12] = (h6h + gh + (h6l >>> 0 < gl >>> 0 ? 1 : 0)) | 0;
    h7l = h[15] = (h7l + hl) | 0;
    h[14] = (h7h + hh + (h7l >>> 0 < hl >>> 0 ? 1 : 0)) | 0;
  }
}

/** Obtain a SHA512 hash of an utf8 encoded string or an Uint8Array. */
export function sha512(
  msg: string | Uint8Array,
  inputEncoding?: string,
  outputEncoding?: string,
): string | Uint8Array {
  return new SHA512()
    .init()
    .update(msg, inputEncoding)
    .digest(outputEncoding);
}
