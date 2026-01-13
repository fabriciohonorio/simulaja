import { cn } from "@/lib/utils";

interface SegmentCardProps {
  icon: React.ReactNode;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const SegmentCard = ({ icon, label, isSelected, onClick }: SegmentCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 min-w-[100px]",
        "hover:scale-105 hover:shadow-lg",
        isSelected
          ? "border-secondary bg-secondary/10 shadow-md"
          : "border-border bg-card hover:border-secondary/50"
      )}
    >
      <div className={cn(
        "w-16 h-16 flex items-center justify-center mb-2 transition-transform",
        isSelected && "scale-110"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-sm font-medium text-center transition-colors",
        isSelected ? "text-secondary" : "text-foreground"
      )}>
        {label}
      </span>
    </button>
  );
};

export default SegmentCard;
