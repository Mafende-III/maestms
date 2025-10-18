import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, required, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="input-group">
        {label && (
          <label
            htmlFor={inputId}
            className={cn("input-label", required && "input-required")}
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "input-base",
            error && "border-error focus:ring-error",
            className
          )}
          ref={ref}
          required={required}
          {...props}
        />
        {error && (
          <p className="input-error">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }