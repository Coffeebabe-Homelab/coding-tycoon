import { useAuth0 } from '@auth0/auth0-react'
import loginRoom from '../assets/login-room.svg'
import { Button } from '../components/Button'

/** Public login page (Figma 11:3): pitch and Auth0 login on the left, the player's room on the right. */
export default function LoginPage() {
  const { loginWithRedirect } = useAuth0()

  return (
    <div className="flex min-h-screen bg-bg-base">
      <main className="flex w-full shrink-0 flex-col justify-center gap-6 border-r border-border bg-bg-surface px-8 lg:w-160 lg:pr-16 lg:pl-30">
        {/* w-min puts each word on its own line, as in Figma, without breaking the heading's text. */}
        <h1 className="w-min font-display text-display-xl text-accent uppercase">Coding Tycoon</h1>
        <p className="text-h1 text-text-primary">
          Learn real developer skills.
          <br />
          One day at a time.
        </p>
        <p className="max-w-105 text-body-l text-text-muted">
          Pick up a ticket, ship the code, get reviewed by an AI senior dev. 15 minutes a day.
        </p>
        <div className="flex flex-col items-start gap-3">
          <Button onClick={() => loginWithRedirect()}>Log in</Button>
          <p className="text-label-s text-text-muted">
            Secure sign-in with Auth0 · new players get an account automatically
          </p>
        </div>
      </main>
      <div className="hidden min-w-0 flex-1 flex-col items-center justify-center gap-4 bg-(image:--gradient-login-glow) lg:flex">
        <img src={loginRoom} alt="" className="w-full max-w-[714px]" />
        <p className="text-body-m text-text-muted">Your desk is waiting.</p>
      </div>
    </div>
  )
}
