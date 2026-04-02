"use client"

import Link, { LinkProps } from "next/link"
import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react"
import styles from "./Button.module.css"

type ButtonVariant = "primary" | "secondary"

type SharedProps = {
  children: ReactNode
  className?: string
  variant: ButtonVariant
}

type LinkButtonProps = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  Omit<LinkProps, "href"> & {
    href: string
  }

type NativeButtonProps = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined
  }

type ButtonProps = LinkButtonProps | NativeButtonProps

const buildClassName = (variant: ButtonVariant, className?: string): string => {
  const classes = [styles.button, styles[variant]]
  if (className) {
    classes.push(className)
  }
  return classes.join(" ")
}

export const Button = (props: ButtonProps) => {
  if ("href" in props && typeof props.href === "string") {
    const { href, children, className, variant, ...rest } = props
    return (
      <Link href={href} className={buildClassName(variant, className)} {...rest}>
        {children}
      </Link>
    )
  }

  const { children, className, variant, type = "button", ...rest } = props
  return (
    <button
      type={type}
      className={buildClassName(variant, className)}
      {...rest}
    >
      {children}
    </button>
  )
}
