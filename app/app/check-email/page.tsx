import { CheckEmailClient } from "./CheckEmailClient"

type CheckEmailPageProps = {
  searchParams?: {
    email?: string | string[]
  }
}

const getEmailFromSearchParams = (
  searchParams: CheckEmailPageProps["searchParams"]
): string | null => {
  const rawEmail = searchParams?.email

  if (Array.isArray(rawEmail)) {
    return rawEmail[0] ?? null
  }

  if (typeof rawEmail === "string" && rawEmail.length > 0) {
    return rawEmail
  }

  return null
}

export default function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const email = getEmailFromSearchParams(searchParams)

  return <CheckEmailClient email={email} />
}
