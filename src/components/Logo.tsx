import { Leaf } from 'lucide-react';
import Link from 'next/link';

export function Logo({ large = false }: { large?: boolean}) {
  return (
    <Link href="/" className="flex items-center gap-2 text-primary hover:text-accent transition-colors">
      <Leaf className={large ? "h-8 w-8" : "h-6 w-6"} />
      <span className={`font-headline ${large ? 'text-2xl' : 'text-xl'} font-bold`}>
        EnglishFamily
      </span>
    </Link>
  );
}
