import { useState } from "react";
import { X } from "lucide-react";

interface Field {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}

interface CrudDialogProps {
  title: string;
  fields: Field[];
  initialValues?: Record<string, any>;
  onSave: (values: Record<string, any>) => void;
  onClose: () => void;
}

export default function CrudDialog({ title, fields, initialValues = {}, onSave, onClose }: CrudDialogProps) {
  const [values, setValues] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    for (const f of fields) {
      init[f.name] = initialValues[f.name] ?? "";
    }
    return init;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-card-foreground">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {fields.map(f => (
            <div key={f.name}>
              <label className="block text-xs font-medium text-foreground mb-1.5">{f.label}</label>
              {f.type === "select" ? (
                <select
                  value={values[f.name]}
                  onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}
                  required={f.required}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Selecione...</option>
                  {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input
                  type={f.type || "text"}
                  value={values[f.name]}
                  onChange={e => setValues(v => ({ ...v, [f.name]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                  required={f.required}
                  placeholder={f.placeholder}
                  step={f.type === "number" ? "any" : undefined}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Delete confirmation */
export function DeleteDialog({ title, message, onConfirm, onClose }: {
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="p-5 space-y-4">
          <h2 className="text-sm font-bold text-card-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{message}</p>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button onClick={onConfirm}
              className="flex-1 rounded-lg bg-critical px-4 py-2.5 text-sm font-medium text-critical-foreground hover:opacity-90 transition-opacity">
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
