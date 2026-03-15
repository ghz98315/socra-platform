'use client';

import { Check } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { avatarOptions, type AvatarRole } from '@/lib/avatar-options';
import { cn } from '@/lib/utils';

interface AvatarPickerProps {
  selectedAvatar: string;
  onChange: (avatarUrl: string) => void;
  roleFilter?: AvatarRole | 'all';
  title?: string;
  description?: string;
}

export function AvatarPicker({
  selectedAvatar,
  onChange,
  roleFilter = 'all',
  title = '选择头像',
  description = '先选一个喜欢的卡通头像，后续也可以再改。',
}: AvatarPickerProps) {
  const filteredOptions =
    roleFilter === 'all'
      ? avatarOptions
      : avatarOptions.filter((option) => option.role === roleFilter);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-warm-800">{title}</p>
        <p className="text-xs text-warm-500">{description}</p>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-4">
        {filteredOptions.map((option) => {
          const active = selectedAvatar === option.src;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.src)}
              className={cn(
                'group relative rounded-2xl border p-2 transition-all',
                'hover:-translate-y-0.5 hover:shadow-md',
                active
                  ? 'border-warm-400 bg-white shadow-md shadow-warm-200/60'
                  : 'border-warm-100 bg-warm-50 hover:border-warm-200'
              )}
            >
              <div
                className={cn(
                  'rounded-2xl bg-gradient-to-br p-3',
                  option.accent
                )}
              >
                <Avatar size="lg" className="mx-auto size-16 border-2 border-white/80 shadow-sm">
                  <AvatarImage src={option.src} alt={option.label} />
                  <AvatarFallback>{option.label.slice(0, 2)}</AvatarFallback>
                </Avatar>
              </div>
              <p className="mt-2 line-clamp-2 text-center text-[11px] font-medium leading-4 text-warm-700">
                {option.label}
              </p>
              {active ? (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-warm-500 text-white shadow-sm">
                  <Check className="h-3 w-3" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
