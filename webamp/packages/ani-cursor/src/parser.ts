import { RIFFFile } from "riff-file";
import { unpackArray, unpackString } from "byte-data";

type Chunk = {
  format: string;
  chunkId: string;
  chunkData: {
    start: number;
    end: number;
  };
  subChunks: Chunk[];
};

// https://www.informit.com/articles/article.aspx?p=1189080&seqNum=3
type AniMetadata = {
  cbSize: number; // Data structure size (in bytes)
  nFrames: number; // Number of images (also known as frames) stored in the file
  nSteps: number; // Number of frames to be displayed before the animation repeats
  iWidth: number; // Width of frame (in pixels)
  iHeight: number; // Height of frame (in pixels)
  iBitCount: number; // Number of bits per pixel
  nPlanes: number; // Number of color planes
  iDispRate: number; // Default frame display rate (measured in 1/60th-of-a-second units)
  bfAttributes: number; // ANI attribute bit flags
};

type ParsedAni = {
  rate: number[] | null;
  seq: number[] | null;
  images: Uint8Array[];
  metadata: AniMetadata;
  artist: string | null;
  title: string | null;
};

const DWORD = { bits: 32, be: false, signed: false, fp: false };

export function parseAni(arr: Uint8Array): ParsedAni {
  const riff = new RIFFFile();

  riff.setSignature(arr);

  const signature = riff.signature as Chunk;
  if (signature.format !== "ACON") {
    throw new Error(
      `Expected format. Expected "ACON", got "${signature.format}"`
    );
  }

  // Helper function to get a chunk by chunkId and transform it if it's non-null.
  function mapChunk<T>(chunkId: string, mapper: (chunk: Chunk) => T): T | null {
    const chunk = riff.findChunk(chunkId) as Chunk | null;
    return chunk == null ? null : mapper(chunk);
  }

  const metadata = mapChunk("anih", (c) => {
    const words = unpackArray(arr, DWORD, c.chunkData.start, c.chunkData.end);
    return {
      cbSize: words[0],
      nFrames: words[1],
      nSteps: words[2],
      iWidth: words[3],
      iHeight: words[4],
      iBitCount: words[5],
      nPlanes: words[6],
      iDispRate: words[7],
      bfAttributes: words[8],
    };
  });

  if (metadata == null) {
    throw new Error("Did not find anih");
  }

  const rate = mapChunk("rate", (c) => {
    return unpackArray(arr, DWORD, c.chunkData.start, c.chunkData.end);
  });
  // chunkIds are always four chars, hence the trailing space.
  const seq = mapChunk("seq ", (c) => {
    return unpackArray(arr, DWORD, c.chunkData.start, c.chunkData.end);
  });

  const lists = riff.findChunk("LIST", true) as Chunk[] | null;
  const imageChunk = lists?.find((c) => c.format === "fram");
  if (imageChunk == null) {
    throw new Error("Did not find fram LIST");
  }

  const images = imageChunk.subChunks.slice(0, metadata.nFrames).map((c) => {
    if (c.chunkId !== "icon") {
      throw new Error(`Unexpected chunk type in fram: ${c.chunkId}`);
    }
    return arr.slice(c.chunkData.start, c.chunkData.end);
  });

  let title = null;
  let artist = null;

  const infoChunk = lists?.find((c) => c.format === "INFO");
  if (infoChunk != null) {
    infoChunk.subChunks.forEach((c) => {
      switch (c.chunkId) {
        case "INAM":
          title = unpackString(arr, c.chunkData.start, c.chunkData.end);
          break;
        case "IART":
          artist = unpackString(arr, c.chunkData.start, c.chunkData.end);
          break;
        default:
        // Unexpected subchunk
      }
    });
  }

  return { images, rate, seq, metadata, artist, title };
}
