import { HTMLAttributes, forwardRef } from "react";

import { useInView } from "@/hooks/common/useInView.ts";

import { cn } from "@/lib/utils";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const Section = forwardRef<HTMLElement, SectionProps>(({ children, className, ...props }) => {
  const { ref, isInView } = useInView<HTMLElement>({ once: true });

  return (
    <section
      ref={ref}
      className={cn(
        "transition-all duration-1000",
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
});

Section.displayName = "Section";
