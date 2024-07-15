import clsx from 'clsx'
import { ReactNode } from 'react'
import {
  Platform,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
} from 'react-native'

import { colors } from '@/styles/colors'

type Variants = 'primary' | 'secondary' | 'tertiary'

type InputProps = {
  children: ReactNode
  variant?: Variants
} & ViewProps

// funciona como um container
function Input({
  children,
  variant = 'primary',
  className,
  ...props
}: InputProps) {
  return (
    <View
      className={clsx(
        'h-16 max-h-16 min-h-16 flex-row items-center gap-2',
        {
          'h-14 rounded-lg border border-zinc-800 px-4': variant !== 'primary',
          'bg-zinc-950': variant === 'secondary',
          'bg-zinc-900': variant === 'tertiary',
        },
        className,
      )}
      {...props}
    >
      {children}
    </View>
  )
}

function Field({ ...props }: TextInputProps) {
  return (
    <TextInput
      className="flex-1 font-regular text-lg text-zinc-100"
      placeholderTextColor={colors.zinc[400]}
      cursorColor={colors.zinc[100]}
      selectionColor={Platform.OS === 'ios' ? colors.zinc[100] : undefined}
      {...props}
    />
  )
}

Input.Field = Field

export { Input }
