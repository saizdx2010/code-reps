/** React escapes every text segment, including code and unmatched backticks. */
export function InlineCode({ text }: { text: string }) {
  return <>{text.split(/(`[^`\n]+`)/g).map((part, index) =>
    part.startsWith('`') && part.endsWith('`') && part.length > 2
      ? <code key={index}>{part.slice(1, -1)}</code>
      : part,
  )}</>
}
