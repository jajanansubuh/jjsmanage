import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SupplierEditForm } from "./SupplierForm";

interface SupplierManageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSupplier: any;
  onUpdateSupplier: (data: any) => void;
  onDeleteRequest: () => void;
}

export function SupplierManageDialog({
  isOpen,
  onOpenChange,
  selectedSupplier,
  onUpdateSupplier,
  onDeleteRequest
}: SupplierManageDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-white">Kelola Suplier</DialogTitle>
          <DialogDescription className="text-slate-400 font-medium">Ubah atau hapus data suplier ini.</DialogDescription>
        </DialogHeader>
        {selectedSupplier && (
          <SupplierEditForm
            supplier={selectedSupplier}
            onUpdate={onUpdateSupplier}
            onDelete={onDeleteRequest}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
