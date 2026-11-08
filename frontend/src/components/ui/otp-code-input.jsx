import { useRef } from "react"

import { Input } from "@/components/ui/input"

/**
 * Segmented digit input for email OTPs.
 *
 * Supports typing, multi-digit paste, backspace, and arrow-key navigation.
 */
export function OtpCodeInput({
  value,
  onChange,
  length,
  disabled = false,
  invalid = false,
  describedBy,
}) {
  const inputRefs = useRef([])

  const focusAt = (index) => {
    inputRefs.current[index]?.focus()
  }

  const spreadInto = (digits, startIndex) => {
    const next = [...value]
    let cursor = startIndex

    for (const digit of digits) {
      if (cursor >= length) break
      next[cursor] = digit
      cursor += 1
    }

    onChange(next)
    focusAt(Math.min(cursor, length - 1))
  }

  const handleChange = (index, event) => {
    const typed = (event.target.value ?? "").replace(/\D/g, "")

    if (!typed) {
      const next = [...value]
      next[index] = ""
      onChange(next)
      return
    }

    if (value[index] && typed.length > 1) {
      const next = [...value]
      next[index] = typed[typed.length - 1]
      onChange(next)
      focusAt(Math.min(index + 1, length - 1))
      return
    }

    spreadInto(typed, index)
  }

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace") {
      if (value[index]) return

      event.preventDefault()
      const previous = Math.max(0, index - 1)
      const next = [...value]
      next[previous] = ""
      onChange(next)
      focusAt(previous)
      return
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault()
      focusAt(Math.max(0, index - 1))
      return
    }

    if (event.key === "ArrowRight") {
      event.preventDefault()
      focusAt(Math.min(length - 1, index + 1))
    }
  }

  const handlePaste = (index, event) => {
    event.preventDefault()
    const pasted = (event.clipboardData?.getData("text") ?? "").replace(/\D/g, "")
    if (pasted) spreadInto(pasted, index)
  }

  return (
    <div
      role="group"
      aria-label={`${length}-digit verification code`}
      aria-describedby={describedBy}
      className="flex w-full min-w-0 gap-2 overflow-visible px-1 py-1"
    >
      {value.map((digit, index) => (
        <Input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element
          }}
          value={digit}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${index + 1}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          className="h-11 min-w-0 flex-1 px-0 text-center text-lg font-semibold tabular-nums sm:text-xl"
        />
      ))}
    </div>
  )
}
