export const supportedLocales = ["en", "nl", "fr"] as const

export type Locale = (typeof supportedLocales)[number]

export const localeLabels: Record<Locale, string> = {
  en: "English",
  nl: "Nederlands",
  fr: "Francais"
}

const en = {
  "common.backToHome": "Back to home",
  "common.goToLogin": "Go to login",
  "common.backToRegister": "Back to register",
  "common.apiConfigured": "Configured through `NEXT_PUBLIC_API_URL`.",
  "common.unreachableApi":
    "Unable to reach the API. Check that the backend is running.",
  "common.language": "Language",
  "home.loadingKicker": "Loading Session",
  "home.loadingTitle": "Checking your local auth state.",
  "home.loadingLead":
    "The frontend is restoring the client session before deciding which surface to show.",
  "home.guestKicker": "Next.js Frontend",
  "home.guestTitle": "Auth Template now has a frontend shell ready to grow.",
  "home.guestLead":
    "This app is set up with the Next.js App Router, TypeScript, and ESLint. It is ready to connect to the Nest API and become the main client surface for authentication, onboarding, and account flows.",
  "home.apiTargetLabel": "API Target",
  "home.coreStackLabel": "Core Stack",
  "home.coreStackValue": "Next.js App Router",
  "home.coreStackDesc":
    "Server-first rendering with client components where needed.",
  "home.openLogin": "Open login",
  "home.openRegister": "Open register",
  "home.nextDocs": "Next.js Docs",
  "home.reactDocs": "React Docs",
  "home.authKicker": "Authenticated",
  "home.authTitle": "Main page",
  "home.authLead":
    "The client auth context is active. This is where the actual application shell should live next.",
  "home.signOut": "Sign out",
  "home.sessionStateLabel": "Session State",
  "home.sessionStateValue": "Access token stored",
  "home.sessionStateDesc":
    "The browser restored the session from local storage.",
  "home.apiTargetDesc":
    "The frontend is still configured to call your Nest backend.",
  "home.tokenPreviewLabel": "Access Token Preview",
  "login.brand": "Auth Template",
  "login.title": "Sign in to continue working inside your account.",
  "login.lead":
    "This page talks directly to the Nest auth API, sends cookies with the request, and gives you a clean place to wire the next part of the app.",
  "login.flowLabel": "Flow",
  "login.flowValue": "POST /auth/token",
  "login.flowDesc":
    "Expects the same email and password pair your backend accepts.",
  "login.headerTag": "Authentication",
  "login.headerTitle": "Login",
  "login.headerDesc": "Use a valid account from the Auth Template backend.",
  "login.email": "Email",
  "login.password": "Password",
  "login.passwordPlaceholder": "Enter your password",
  "login.submit": "Sign in",
  "login.submitting": "Signing in...",
  "login.createAccount": "Create an account",
  "login.errorDefault": "Unable to sign in right now. Try again.",
  "login.errorNoToken": "Login succeeded but no access token was returned.",
  "register.brand": "Auth Template",
  "register.title": "Create an account and verify your email address.",
  "register.lead":
    "Registration creates an inactive account, sends a verification email, and lets the user sign in only after the email address has been confirmed.",
  "register.flowLabel": "Flow",
  "register.flowValue": "POST /auth/register",
  "register.flowDesc":
    "The backend sends a verification mail instead of logging the user in immediately.",
  "register.headerTag": "Registration",
  "register.headerTitle": "Create account",
  "register.headerDesc":
    "After registration, the user must verify the email address.",
  "register.firstName": "First name",
  "register.lastName": "Last name",
  "register.password": "Password",
  "register.confirmPassword": "Confirm password",
  "register.passwordPlaceholder": "Create a password",
  "register.confirmPasswordPlaceholder": "Repeat your password",
  "register.submit": "Create account",
  "register.submitting": "Creating account...",
  "register.alreadyAccount": "Already have an account?",
  "register.verifyInfo":
    "Verification link opens the frontend verify-email page.",
  "register.errorDefault":
    "Unable to create your account right now. Try again.",
  "register.passwordMismatch": "Password confirmation does not match.",
  "checkEmail.kicker": "Registration complete",
  "checkEmail.title": "Check your email",
  "checkEmail.lead":
    "We sent a verification link to your inbox. Open the email and click the link to activate your account.",
  "checkEmail.sentTo": "Sent to:",
  "checkEmail.step1": "Open your inbox.",
  "checkEmail.step2": "Check spam or junk if you do not see it in a minute.",
  "checkEmail.step3": "Click the verification link, then sign in.",
  "checkEmail.resend": "Resend verification email",
  "checkEmail.resending": "Resending...",
  "checkEmail.resendSuccess":
    "If your account is still unverified, a new verification email has been sent.",
  "checkEmail.resendError":
    "Unable to resend verification email right now.",
  "verify.kicker": "Email Verification",
  "verify.missingTitle": "This verification link could not be completed.",
  "verify.missingToken": "Verification token is missing.",
  "verify.loadingTitle": "Checking your verification link.",
  "verify.successTitle": "Your account is ready.",
  "verify.errorTitle": "This verification link could not be completed.",
  "verify.loadingMessage": "Verifying your email address...",
  "verify.successMessage": "Your email has been verified.",
  "verify.errorDefault": "Unable to verify your email right now."
} as const

type TranslationKey = keyof typeof en

type TranslationMap = Record<Locale, Record<TranslationKey, string>>

export const translations: TranslationMap = {
  en,
  nl: {
    ...en,
    "common.backToHome": "Terug naar start",
    "common.goToLogin": "Ga naar login",
    "common.backToRegister": "Terug naar registratie",
    "common.language": "Taal",
    "home.loadingTitle": "Je lokale sessiestatus wordt gecontroleerd.",
    "home.guestTitle": "Auth Template heeft nu een frontend klaar om uit te breiden.",
    "home.openLogin": "Open login",
    "home.openRegister": "Open registratie",
    "home.signOut": "Uitloggen",
    "login.title": "Meld je aan om verder te werken in je account.",
    "login.headerTitle": "Aanmelden",
    "login.submit": "Aanmelden",
    "login.submitting": "Bezig met aanmelden...",
    "register.title": "Maak een account aan en verifieer je e-mailadres.",
    "register.headerTitle": "Account aanmaken",
    "register.submit": "Account aanmaken",
    "register.submitting": "Account wordt aangemaakt...",
    "checkEmail.title": "Controleer je e-mail",
    "checkEmail.resend": "Stuur verificatie e-mail opnieuw",
    "checkEmail.resending": "Opnieuw verzenden...",
    "verify.kicker": "E-mailverificatie",
    "verify.successTitle": "Je account is klaar."
  },
  fr: {
    ...en,
    "common.backToHome": "Retour a l'accueil",
    "common.goToLogin": "Aller a la connexion",
    "common.backToRegister": "Retour a l'inscription",
    "common.language": "Langue",
    "home.loadingTitle": "Verification de votre session locale.",
    "home.guestTitle":
      "Auth Template dispose maintenant d'une base frontend prete a evoluer.",
    "home.openLogin": "Ouvrir la connexion",
    "home.openRegister": "Ouvrir l'inscription",
    "home.signOut": "Se deconnecter",
    "login.title": "Connectez-vous pour continuer dans votre compte.",
    "login.headerTitle": "Connexion",
    "login.submit": "Se connecter",
    "login.submitting": "Connexion en cours...",
    "register.title": "Creez un compte et verifiez votre adresse e-mail.",
    "register.headerTitle": "Creer un compte",
    "register.submit": "Creer un compte",
    "register.submitting": "Creation du compte...",
    "checkEmail.title": "Verifiez votre e-mail",
    "checkEmail.resend": "Renvoyer l'e-mail de verification",
    "checkEmail.resending": "Renvoi en cours...",
    "verify.kicker": "Verification e-mail",
    "verify.successTitle": "Votre compte est pret."
  }
}

export const defaultLocale: Locale = "en"
