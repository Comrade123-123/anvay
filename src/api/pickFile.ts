import * as DocumentPicker from 'expo-document-picker';

export type PickedFile = { name: string; type: string; base64: string; size: number };

const MAX_BYTES = 2 * 1024 * 1024;

// Lets the student choose a photo or PDF and returns it as base64 for the upload endpoint. Returns null if they
// cancel. Throws a readable Error for files we would refuse anyway (too big), so the screen can show the message.
export async function pickFile(): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png', 'application/pdf'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  if (asset.size != null && asset.size > MAX_BYTES) throw new Error('File is larger than 2 MB. Choose a smaller photo or PDF.');

  const blob = await (await fetch(asset.uri)).blob();
  if (blob.size > MAX_BYTES) throw new Error('File is larger than 2 MB. Choose a smaller photo or PDF.');
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onloadend = () => {
      const out = String(reader.result ?? '');
      resolve(out.slice(out.indexOf(',') + 1));
    };
    reader.readAsDataURL(blob);
  });
  return { name: asset.name, type: asset.mimeType ?? blob.type ?? 'application/octet-stream', base64, size: blob.size };
}
