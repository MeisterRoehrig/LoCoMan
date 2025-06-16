import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import MessageLoading from "@/components/message-loading";
import { Button, ButtonProps } from "@/components/ui/button";


/* -------------------------------------------------------------------------- */
/* ChatBubble (outer flex item)                                               */
/* -------------------------------------------------------------------------- */

const chatBubbleVariant = cva(
  // row, allow shrink, cap width
  "flex min-w-0 gap-2 items-end relative group " +
    "max-w-[85%] sm:max-w-[70%] md:max-w-[60%]",
  {
    variants: {
      variant: {
        received: "self-start",
        sent: "self-end flex-row-reverse",
      },
      layout: {
        default: "",
        ai: "max-w-full w-full items-center",
      },
    },
    defaultVariants: {
      variant: "received",
      layout: "default",
    },
  },
);

export interface ChatBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "sent" | "received";
  layout?: "default" | "ai";
  className?: string;
  children?: React.ReactNode;
}

export const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  ({ className, variant, layout, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(chatBubbleVariant({ variant, layout, className }))}
      {...props}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child) && typeof child.type !== "string"
          ? React.cloneElement(child, { variant, layout } as React.ComponentProps<typeof child.type>)
          : child,
      )}
    </div>
  ),
);
ChatBubble.displayName = "ChatBubble";

/* -------------------------------------------------------------------------- */
/* ChatBubbleAvatar                                                           */
/* -------------------------------------------------------------------------- */

export interface ChatBubbleAvatarProps {
  src?: string;
  fallback?: string;
  className?: string;
}

export const ChatBubbleAvatar: React.FC<ChatBubbleAvatarProps> = ({
  src,
  fallback,
  className,
}) => (
  <Avatar className={className}>
    <AvatarImage src={src} alt="Avatar" />
    <AvatarFallback>{fallback}</AvatarFallback>
  </Avatar>
);

/* -------------------------------------------------------------------------- */
/* ChatBubbleMessage                                                          */
/* -------------------------------------------------------------------------- */


const chatBubbleMessageVariants = cva("p-4", {
  variants: {
    variant: {
      received: "bg-secondary text-secondary-foreground rounded-r-lg rounded-tl-lg",
      sent: "bg-secondary text-secondary-foreground rounded-l-lg rounded-tr-lg py-2 px-4",
    },
    layout: {
      default: "",
      ai: "border-t rounded-none bg-transparent text-secondary-foreground",
    },
  },
  defaultVariants: { variant: "received", layout: "default" },
});

export interface ChatBubbleMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "sent" | "received";
  layout?: "default" | "ai";
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const ChatBubbleMessage = React.forwardRef<
  HTMLDivElement,
  ChatBubbleMessageProps
>(({ className, variant, layout, isLoading = false, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      chatBubbleMessageVariants({ variant, layout, className }),
      // CORE FIX: let the column grow and shrink with the bubble
      "flex-1 min-w-0 w-full break-words whitespace-pre-wrap",
    )}
    {...props}
  >
    {isLoading ? (
      <div className="flex items-center space-x-2">
        <MessageLoading />
      </div>
    ) : (
      <div className="break-words whitespace-pre-wrap overflow-wrap-anywhere">
        {children}
      </div>
    )}
  </div>
));
ChatBubbleMessage.displayName = "ChatBubbleMessage";

/* -------------------------------------------------------------------------- */
/* ChatBubbleTimestamp                                                        */
/* -------------------------------------------------------------------------- */

export interface ChatBubbleTimestampProps extends React.HTMLAttributes<HTMLDivElement> {
  timestamp: string;
}

export const ChatBubbleTimestamp: React.FC<ChatBubbleTimestampProps> = ({
  timestamp,
  className,
  ...props
}) => (
  <div className={cn("text-xs mt-2 text-right", className)} {...props}>
    {timestamp}
  </div>
);

/* -------------------------------------------------------------------------- */
/* ChatBubbleAction + wrapper                                                 */
/* -------------------------------------------------------------------------- */

export type ChatBubbleActionProps = ButtonProps & { icon: React.ReactNode };

export const ChatBubbleAction: React.FC<ChatBubbleActionProps> = ({
  icon,
  onClick,
  className,
  variant = "ghost",
  size = "icon",
  ...props
}) => (
  <Button variant={variant} size={size} className={className} onClick={onClick} {...props}>
    {icon}
  </Button>
);

export interface ChatBubbleActionWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "sent" | "received";
  className?: string;
}

export const ChatBubbleActionWrapper = React.forwardRef<
  HTMLDivElement,
  ChatBubbleActionWrapperProps
>(({ variant, className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute top-1/2 -translate-y-1/2 flex opacity-0 group-hover:opacity-100 " +
        "transition-opacity duration-200",
      variant === "sent"
        ? "-left-1 -translate-x-full flex-row-reverse"
        : "-right-1 translate-x-full",
      className,
    )}
    {...props}
  >
    {children}
  </div>
));
ChatBubbleActionWrapper.displayName = "ChatBubbleActionWrapper";

/* -------------------------------------------------------------------------- */
/* Exports                                                                    */
/* -------------------------------------------------------------------------- */

export {
  chatBubbleVariant,
  chatBubbleMessageVariants,
};
