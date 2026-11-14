import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CriteriaItem } from './CriteriaItem'

describe('CriteriaItem', () => {
  it('shows a todo criterion as plain text, with no checkbox', () => {
    render(
      <ul>
        <CriteriaItem text="Returns 200" />
      </ul>,
    )

    expect(screen.getByRole('listitem')).toHaveTextContent(/^Returns 200$/)
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('tells screen readers a criterion is done', () => {
    render(
      <ul>
        <CriteriaItem text="Returns 200" done />
      </ul>,
    )

    expect(screen.getByRole('listitem')).toHaveTextContent('Returns 200 (done)')
  })
})
