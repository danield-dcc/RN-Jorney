import clsx from 'clsx'
import { createContext, useContext } from 'react'
import {
  ActivityIndicator,
  Text,
  TextProps,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native'

type Variants = 'primary' | 'secondary'

type ButtonProps = TouchableOpacityProps & {
  variant?: Variants
  isLoading?: boolean
}

const ThemeContext = createContext<{ variant?: Variants }>({})

function Button({
  children,
  variant = 'primary',
  isLoading,
  className,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={clsx(
        'h-11 flex-row items-center justify-center gap-2 rounded-lg px-2',
        {
          'bg-lime-300': variant === 'primary',
          'bg-zinc-800': variant === 'secondary',
        },
        className,
      )}
      disabled={isLoading}
      activeOpacity={0.7}
      {...props}
    >
      <ThemeContext.Provider value={{ variant }}>
        {isLoading ? <ActivityIndicator className="text-lime-950" /> : children}
      </ThemeContext.Provider>
    </TouchableOpacity>
  )
}

function Title({ children }: TextProps) {
  const { variant } = useContext(ThemeContext)
  return (
    <Text
      className={clsx('font-semibold text-base', {
        'text-lime-950': variant === 'primary',
        'text-zinc-200': variant === 'secondary',
      })}
    >
      {children}
    </Text>
  )
}

Button.Title = Title

export { Button }
