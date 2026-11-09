export function uploadTask<T>(
  body: FormData,
  user: string,
  onUploaded: () => void,
): Promise<T>;
