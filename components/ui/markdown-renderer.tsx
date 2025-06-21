/* components/ui/markdown-renderer.tsx */
import React, {
  memo,
  Suspense,
  HTMLAttributes,
  ReactNode,
} from "react"
import type { JSX } from "react"          // ① bring JSX into scope
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"

import { cn } from "@/lib/utils"
import { CopyButton } from "@/components/ui/copy-button"

/* -------------------------------------------------------------------------- */
/*                             Public renderer API                            */
/* -------------------------------------------------------------------------- */

interface MarkdownRendererProps {
  children: string
}

export function MarkdownRenderer({ children }: MarkdownRendererProps) {
  return (
    <div className="space-y-3">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </Markdown>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                         Syntax-highlighted <pre>                           */
/* -------------------------------------------------------------------------- */

interface HighlightedPreProps extends HTMLAttributes<HTMLPreElement> {
  children: string
  language: string
}

const HighlightedPre = memo(
  async ({ children, language, ...props }: HighlightedPreProps) => {
    const { codeToTokens, bundledLanguages } = await import("shiki")

    if (!(language in bundledLanguages)) {
      return <pre {...props}>{children}</pre>
    }

    const { tokens } = await codeToTokens(children, {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      lang: language as keyof typeof bundledLanguages,
      defaultColor: false,
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    })

    return (
      <pre {...props}>
        <code>
          {tokens.map((line, lineIndex) => (
            <span key={lineIndex}>
              {line.map((token, tokenIndex) => {
                const style =
                  typeof token.htmlStyle === "string"
                    ? undefined
                    : token.htmlStyle

                return (
                  <span
                    key={tokenIndex}
                    className="text-shiki-light bg-shiki-light-bg dark:text-shiki-dark dark:bg-shiki-dark-bg"
                    style={style}
                  >
                    {token.content}
                  </span>
                )
              })}
              {lineIndex !== tokens.length - 1 && "\n"}
            </span>
          ))}
        </code>
      </pre>
    )
  }
)

HighlightedPre.displayName = "HighlightedPre"

/* -------------------------------------------------------------------------- */
/*                            Code block wrapper                              */
/* -------------------------------------------------------------------------- */

interface CodeBlockProps extends HTMLAttributes<HTMLPreElement> {
  children: ReactNode
  className?: string
  language: string
}

const CodeBlock = ({
  children,
  className,
  language,
  ...restProps
}: CodeBlockProps) => {
  const code =
    typeof children === "string" ? children : extractStrings(children)

  const preClass = cn(
    "overflow-x-scroll rounded-md border bg-background/50 p-4 font-mono text-sm [scrollbar-width:none]",
    className
  )

  return (
    <div className="group/code relative mb-4">
      <Suspense
        fallback={
          <pre className={preClass} {...restProps}>
            {code}
          </pre>
        }
      >
        <HighlightedPre language={language} className={preClass}>
          {code}
        </HighlightedPre>
      </Suspense>

      <div className="invisible absolute right-2 top-2 flex space-x-1 rounded-lg p-1 opacity-0 transition-all duration-200 group-hover/code:visible group-hover/code:opacity-100">
        <CopyButton content={code} copyMessage="Copied code to clipboard" />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                       Utility to flatten React children                     */
/* -------------------------------------------------------------------------- */

function extractStrings(node: ReactNode): string {
  if (typeof node === "string") return node
  if (Array.isArray(node)) return node.map(extractStrings).join("")

  const maybeElement = node as { props?: { children?: ReactNode } }
  return maybeElement?.props?.children
    ? extractStrings(maybeElement.props.children)
    : ""
}

/* -------------------------------------------------------------------------- */
/*                     Helper HOC to inject Tailwind classes                   */
/* -------------------------------------------------------------------------- */

function withClass<Tag extends keyof JSX.IntrinsicElements>(
  Tag: Tag,
  classes: string
) {
  const Component = (props: JSX.IntrinsicElements[Tag]) => {
    const { className, ...rest } = props
    return React.createElement(
      Tag,
      { className: cn(classes, className), ...rest }
    )
  }

  Component.displayName = typeof Tag === "string" ? Tag : String(Tag)
  return Component
}

/* -------------------------------------------------------------------------- */
/*                     react-markdown component mapping                       */
/* -------------------------------------------------------------------------- */

const components: Components = {
  h1: withClass("h1", "text-2xl font-semibold"),
  h2: withClass("h2", "font-semibold text-xl"),
  h3: withClass("h3", "font-semibold text-lg"),
  h4: withClass("h4", "font-semibold text-base"),
  h5: withClass("h5", "font-medium"),
  strong: withClass("strong", "font-semibold"),
  a: withClass("a", "text-primary underline underline-offset-2"),
  blockquote: withClass("blockquote", "border-l-2 border-primary pl-4"),
  /* Inline and fenced code */
  code: ({ children, className, ...rest }) => {
    const match = /language-(\w+)/.exec(className ?? "")
    return match ? (
      <CodeBlock className={className} language={match[1]} {...rest}>
        {children}
      </CodeBlock>
    ) : (
      <code
        className={cn(
          "font-mono [:not(pre)>&]:rounded-md [:not(pre)>&]:bg-background/50 [:not(pre)>&]:px-1 [:not(pre)>&]:py-0.5"
        )}
        {...rest}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }) => <>{children}</>,
  ol: withClass("ol", "list-decimal space-y-2 pl-6"),
  ul: withClass("ul", "list-disc space-y-2 pl-6"),
  li: withClass("li", "my-1.5"),
  table: withClass(
    "table",
    "w-full border-collapse overflow-y-auto rounded-md border border-foreground/20"
  ),
  th: withClass(
    "th",
    "border border-foreground/20 px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right"
  ),
  td: withClass(
    "td",
    "border border-foreground/20 px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"
  ),
  tr: withClass("tr", "m-0 border-t p-0 even:bg-muted"),
  p: withClass("p", "whitespace-pre-wrap"),
  hr: withClass("hr", "border-foreground/20"),
}

export default MarkdownRenderer
