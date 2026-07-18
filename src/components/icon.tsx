import {
  Cpu, Shirt, Car, Building2, Smartphone, Laptop, Sofa, Refrigerator,
  Sparkles, HeartPulse, Dumbbell, Gamepad2, BookOpen, PawPrint, Baby,
  Wrench, Download, Palette, Gem, Crown, Factory,
  type LucideIcon,
} from "lucide-react";

/** Maps category `icon` strings to concrete lucide components. */
const REGISTRY: Record<string, LucideIcon> = {
  Cpu, Shirt, Car, Building2, Smartphone, Laptop, Sofa, Refrigerator,
  Sparkles, HeartPulse, Dumbbell, Gamepad2, BookOpen, PawPrint, Baby,
  Wrench, Download, Palette, Gem, Crown, Factory,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Cmp = REGISTRY[name] ?? Cpu;
  return <Cmp className={className} aria-hidden="true" />;
}
