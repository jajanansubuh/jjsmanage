import { useCallback } from "react";

export function useKeyboardNav(onAddTransaction: () => void) {
  const handleTableKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, field: string) => {
    const fields = ["revenue", "cost", "barcode"];
    const fieldIndex = fields.indexOf(field);

    if (e.key === "ArrowRight" || e.key === "Enter") {
      e.preventDefault();
      if (fieldIndex < fields.length - 1) {
        const nextInput = e.currentTarget.closest("td")?.nextElementSibling?.querySelector("input");
        nextInput?.focus();
      } else if (e.key === "Enter") {
        const nextRow = e.currentTarget.closest("tr")?.nextElementSibling;
        const targetInput = nextRow?.querySelectorAll("td")[2]?.querySelector("input");

        if (targetInput) {
          (targetInput as HTMLElement).focus();
        } else {
          document.getElementById("supplier-combobox-trigger")?.focus();
        }
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (fieldIndex > 0) {
        const prevInput = e.currentTarget.closest("td")?.previousElementSibling?.querySelector("input");
        prevInput?.focus();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextRow = e.currentTarget.closest("tr")?.nextElementSibling;
      const targetInput = nextRow?.querySelectorAll("td")[fieldIndex + 2]?.querySelector("input");
      if (targetInput) (targetInput as HTMLElement).focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevRow = e.currentTarget.closest("tr")?.previousElementSibling;
      const targetInput = prevRow?.querySelectorAll("td")[fieldIndex + 2]?.querySelector("input");
      if (targetInput) (targetInput as HTMLElement).focus();
    }
  }, []);

  const handleFormKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (field === "supplier") {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        (document.getElementById("revenue-input") as HTMLElement)?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const firstRowInput = document.querySelector("tbody tr:first-child td:nth-child(3) input") as HTMLInputElement;
        firstRowInput?.focus();
      }
    }
  };

  return { handleTableKeyDown, handleFormKeyDown };
}
