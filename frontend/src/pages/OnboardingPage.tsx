import { OnboardingWizard } from '../components/OnboardingWizard'

/**
 * Route-level wrapper for the onboarding wizard.
 * Only reachable when authenticated (wrapped in ProtectedRoute in App.tsx).
 */
export default function OnboardingPage() {
  return <OnboardingWizard />
}
