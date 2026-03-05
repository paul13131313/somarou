export async function loadBGM(
  audioCtx: AudioContext,
  url: string
): Promise<AudioBufferSourceNode> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const decoded = await audioCtx.decodeAudioData(buf);
  const source = audioCtx.createBufferSource();
  source.buffer = decoded;
  source.loop = true;
  return source;
}

export async function loadBGMFromFile(
  audioCtx: AudioContext,
  file: File
): Promise<AudioBufferSourceNode> {
  const buf = await file.arrayBuffer();
  const decoded = await audioCtx.decodeAudioData(buf);
  const source = audioCtx.createBufferSource();
  source.buffer = decoded;
  source.loop = true;
  return source;
}
