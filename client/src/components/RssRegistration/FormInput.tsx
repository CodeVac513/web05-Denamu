import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormInputProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  onChange: (value: string) => void;
}

export default function FormInput({ id, label, value, placeholder, type = "text", onChange }: FormInputProps) {
  return (
    <div className="flex items-center gap-4">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="flex-grow w-auto border-input focus:border-primary focus-visible:ring-primary placeholder:text-muted-foreground placeholder:text-sm"
        type={type}
      />
    </div>
  );
}
