import { HttpAgent } from "@icp-sdk/core/agent";
import { useEffect, useRef, useState } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";

let clientPromise: Promise<StorageClient> | null = null;

async function getStorageClient(): Promise<StorageClient> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const config = await loadConfig();
      const agent = new HttpAgent({ host: config.backend_host });
      if (config.backend_host?.includes("localhost")) {
        await agent.fetchRootKey().catch(console.error);
      }
      return new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
    })();
  }
  return clientPromise;
}

export interface UploadedFile {
  file: File;
  hash: string;
  directURL: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export function useFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const clientRef = useRef<StorageClient | null>(null);

  useEffect(() => {
    getStorageClient().then((c) => {
      clientRef.current = c;
    });
  }, []);

  const addFiles = async (newFiles: File[]) => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const toAdd: UploadedFile[] = newFiles
      .filter((f) => f.size <= MAX_SIZE)
      .map((f) => ({
        file: f,
        hash: "",
        directURL: "",
        progress: 0,
        status: "pending" as const,
      }));

    const oversized = newFiles.filter((f) => f.size > MAX_SIZE);

    setFiles((prev) => [...prev, ...toAdd]);

    // Upload each file
    for (const item of toAdd) {
      setFiles((prev) =>
        prev.map((x) =>
          x.file === item.file ? { ...x, status: "uploading" } : x,
        ),
      );

      try {
        const bytes = new Uint8Array(await item.file.arrayBuffer());
        const client = clientRef.current || (await getStorageClient());
        const { hash } = await client.putFile(bytes, (pct) => {
          setFiles((prev) =>
            prev.map((x) =>
              x.file === item.file ? { ...x, progress: pct } : x,
            ),
          );
        });
        const directURL = await client.getDirectURL(hash);
        setFiles((prev) =>
          prev.map((x) =>
            x.file === item.file
              ? { ...x, hash, directURL, progress: 100, status: "done" }
              : x,
          ),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload gagal";
        setFiles((prev) =>
          prev.map((x) =>
            x.file === item.file ? { ...x, status: "error", error: msg } : x,
          ),
        );
      }
    }

    return oversized;
  };

  const removeFile = (file: File) => {
    setFiles((prev) => prev.filter((x) => x.file !== file));
  };

  const reset = () => setFiles([]);

  const uploadedHashes = files
    .filter((f) => f.status === "done")
    .map((f) => f.hash);

  const isUploading = files.some((f) => f.status === "uploading");

  return { files, addFiles, removeFile, reset, uploadedHashes, isUploading };
}

export async function getDirectURLForHash(hash: string): Promise<string> {
  const client = await getStorageClient();
  return client.getDirectURL(hash);
}
