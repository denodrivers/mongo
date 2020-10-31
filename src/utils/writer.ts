const encoder = new TextEncoder();

export class BufferWriter {
  private pos: number = 0;
  private buffer: Uint8Array;

  constructor(length: number) {
    this.buffer = new Uint8Array(length);
  }

  get wroteData(): Uint8Array {
    return this.pos === this.buffer.length
      ? this.buffer
      : this.buffer.slice(0, this.pos);
  }

  get length(): number {
    return this.pos;
  }

  get capacity(): number {
    return this.buffer.length - this.pos;
  }

  skip(len: number): BufferWriter {
    this.pos += len;
    return this;
  }

  writeBuffer(buffer: Uint8Array): BufferWriter {
    if (buffer.length > this.capacity) {
      buffer = buffer.slice(0, this.capacity);
    }
    this.buffer.set(buffer, this.pos);
    this.pos += buffer.length;
    return this;
  }

  write(byte: number): BufferWriter {
    this.buffer[this.pos++] = byte;
    return this;
  }

  writeIntLE(num: number, len: number) {
    const int = new Int32Array(1);
    int[0] = 40;
  }

  writeUint16(num: number): BufferWriter {
    return this.writeUints(2, num);
  }

  writeUint32(num: number): BufferWriter {
    return this.writeUints(4, num);
  }

  writeUint64(num: number): BufferWriter {
    return this.writeUints(8, num);
  }

  writeUints(len: number, num: number): BufferWriter {
    for (let n = 0; n < len; n++) {
      this.buffer[this.pos++] = (num >> (n * 8)) & 0xff;
    }
    return this;
  }

  writeNullTerminatedString(str: string): BufferWriter {
    return this.writeString(str).write(0x00);
  }

  writeString(str: string): BufferWriter {
    const buf = encoder.encode(str);
    this.buffer.set(buf, this.pos);
    this.pos += buf.length;
    return this;
  }
}
