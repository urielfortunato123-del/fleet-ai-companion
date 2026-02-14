import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export interface FileAttachment {
  name: string;
  type: "image" | "excel" | "pdf";
  url?: string;
  extractedText?: string;
  previewUrl?: string;
  rawRows?: Record<string, any>[];
  headers?: string[];
}

export function useChatFileUpload() {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): FileAttachment["type"] | null => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext || "")) return "image";
    if (["xlsx", "xls", "csv"].includes(ext || "")) return "excel";
    if (ext === "pdf") return "pdf";
    return null;
  };

  const parseExcel = (file: File): Promise<{ text: string; rows: Record<string, any>[]; headers: string[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          let text = "";
          let allRows: Record<string, any>[] = [];
          let allHeaders: string[] = [];

          workbook.SheetNames.forEach((name) => {
            const sheet = workbook.Sheets[name];
            const csv = XLSX.utils.sheet_to_csv(sheet);
            text += `\n--- Aba: ${name} ---\n${csv}`;
            const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);
            if (rows.length > 0 && allRows.length === 0) {
              allRows = rows;
              allHeaders = Object.keys(rows[0]);
            }
          });

          resolve({ text: text.slice(0, 4000), rows: allRows, headers: allHeaders });
        } catch {
          reject(new Error("Erro ao ler planilha"));
        }
      };
      reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
      reader.readAsArrayBuffer(file);
    });
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      toast.error("Faça login para enviar arquivos.");
      return null;
    }
    const filePath = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("chat-attachments").upload(filePath, file);
    if (error) {
      toast.error("Erro ao fazer upload da imagem.");
      console.error("Upload error:", error);
      return null;
    }
    const { data } = supabase.storage.from("chat-attachments").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleFiles = async (files: FileList) => {
    setIsUploading(true);
    const newAttachments: FileAttachment[] = [];

    const fileArray = Array.from(files);
    if (fileArray.length + attachments.length > 10) {
      toast.error("Máximo de 10 arquivos por vez.");
      setIsUploading(false);
      return;
    }

    for (const file of fileArray) {
      const type = getFileType(file);
      if (!type) { toast.error(`Tipo não suportado: ${file.name}`); continue; }
      if (file.size > 400 * 1024 * 1024) { toast.error(`Arquivo muito grande: ${file.name} (máx 400MB)`); continue; }

      try {
        if (type === "image") {
          const url = await uploadImage(file);
          if (url) {
            newAttachments.push({ name: file.name, type: "image", url, previewUrl: URL.createObjectURL(file) });
          }
        } else if (type === "excel") {
          const { text, rows, headers } = await parseExcel(file);
          newAttachments.push({ name: file.name, type: "excel", extractedText: text, rawRows: rows, headers });
        } else if (type === "pdf") {
          newAttachments.push({ name: file.name, type: "pdf", extractedText: `[Arquivo PDF enviado: ${file.name}]` });
        }
      } catch (err) {
        console.error("File processing error:", err);
        toast.error(`Erro ao processar: ${file.name}`);
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    setIsUploading(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const removed = prev[index];
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearAttachments = () => {
    attachments.forEach((a) => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); });
    setAttachments([]);
  };

  const buildMessageContent = (text: string): string => {
    let content = text;
    const textAttachments = attachments.filter((a) => a.extractedText);
    if (textAttachments.length > 0) {
      content += "\n\n--- Dados dos arquivos anexados ---";
      textAttachments.forEach((a) => { content += `\n\n📎 ${a.name}:\n${a.extractedText}`; });
    }
    return content;
  };

  const getImageUrls = (): string[] => {
    return attachments.filter((a) => a.type === "image" && a.url).map((a) => a.url!);
  };

  const getExcelAttachments = (): FileAttachment[] => {
    return attachments.filter((a) => a.type === "excel" && a.rawRows && a.rawRows.length > 0);
  };

  return {
    attachments, isUploading, fileInputRef,
    handleFiles, removeAttachment, clearAttachments,
    buildMessageContent, getImageUrls, getExcelAttachments,
  };
}
