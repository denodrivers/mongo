const encoder = new TextEncoder();

export interface Serializer {
  serialize(requestId: number): Uint8Array | Uint8Array[];
}

export class SequenceWriter {
  #buffer: Uint8Array;
  #view: DataView;
  #pos: number = 0;

  constructor(length: number) {
    this.#buffer = new Uint8Array(length);
    this.#view = new DataView(this.#buffer.buffer);
  }

  writeUint32(num: number): this {
    this.#view.setUint32(this.#pos, num, true);
    this.#pos += 4;
    return this;
  }

  writeBuffer(buffer: Uint8Array): this {
    this.#buffer.set(buffer, this.#pos);
    this.#pos += buffer.byteLength;
    return this;
  }

  get buffer() {
    return this.#buffer;
  }
}
