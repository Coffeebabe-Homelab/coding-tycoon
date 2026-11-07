import { useLocation } from 'react-router-dom'

/** Exposes the current URL, so tests assert where the player ended up rather than mocking navigate. */
export function LocationProbe() {
  const { pathname, search } = useLocation()
  return <output data-testid="location">{`${pathname}${search}`}</output>
}
