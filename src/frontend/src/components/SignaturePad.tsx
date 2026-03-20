import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

export interface SignaturePadHandle {
  getDataURL: () => string;
  isEmpty: () => boolean;
  clear: () => void;
}

const SignaturePad = forwardRef<SignaturePadHandle>((_, ref) => {
  const [dataURL, setDataURL] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    getDataURL: () => dataURL,
    isEmpty: () => !dataURL,
    clear: () => {
      setDataURL("");
      if (inputRef.current) inputRef.current.value = "";
    },
  }));

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDataURL((ev.target?.result as string) ?? "");
    };
    reader.readAsDataURL(file);
  }

  function handleClear() {
    setDataURL("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      {dataURL ? (
        <div
          className="border border-input rounded-md bg-white p-2 flex items-center justify-center"
          style={{ minHeight: 120 }}
        >
          <img
            src={dataURL}
            alt="Tanda Tangan"
            className="max-h-28 max-w-full object-contain"
          />
        </div>
      ) : (
        <label
          htmlFor="sig-upload"
          className="border-2 border-dashed border-input rounded-md bg-muted/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
          style={{ minHeight: 120 }}
        >
          <Upload size={24} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Klik untuk upload tanda tangan
          </span>
          <span className="text-xs text-muted-foreground/70">
            JPG, PNG, GIF (maks. 5 MB)
          </span>
        </label>
      )}
      <input
        ref={inputRef}
        id="sig-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="gap-1.5 text-xs"
        >
          <Upload size={13} />
          Upload Tanda Tangan
        </Button>
        {dataURL && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="gap-1.5 text-xs text-destructive hover:text-destructive"
          >
            <X size={13} />
            Hapus
          </Button>
        )}
      </div>
    </div>
  );
});

SignaturePad.displayName = "SignaturePad";

export default SignaturePad;
