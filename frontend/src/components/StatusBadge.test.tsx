import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { TaskStatus } from '../types/task'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it.each<[TaskStatus, string]>([
    ['ASSIGNED', 'Assigned'],
    ['IN_PROGRESS', 'In Progress'],
    ['SUBMITTED', 'Submitted'],
    ['APPROVED', 'Approved'],
    ['CHANGES_REQUESTED', 'Changes Requested'],
  ])('labels %s in words, never colour alone', (status, label) => {
    render(<StatusBadge status={status} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
