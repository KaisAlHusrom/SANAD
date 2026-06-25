import * as RadixAvatar from '@radix-ui/react-avatar';
import { cn } from '../../lib/cn';

interface AvatarProps {
  name: string;
  src?: string;
  className?: string;
}

/** A gradient initial avatar (design-spec §4) with an optional image. */
export function Avatar({ name, src, className }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <RadixAvatar.Root
      className={cn(
        'inline-flex size-9 items-center justify-center overflow-hidden rounded-pill bg-accent-soft text-accent',
        className,
      )}
    >
      {src ? (
        <RadixAvatar.Image
          src={src}
          alt={name}
          className="size-full object-cover"
        />
      ) : null}
      <RadixAvatar.Fallback className="text-sm font-medium">
        {initial}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}
