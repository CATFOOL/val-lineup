// Composable to manage lineup-related events across pages
// Used to notify pages when a lineup is created, deleted or updated so they can refresh their caches

export function useLineupEvents() {
  // Track deleted lineup IDs - pages can check this to remove from their cache
  const deletedLineupIds = useState<Set<string>>('deleted-lineup-ids', () => new Set())

  // Track updated lineup IDs - pages can check this to refetch or invalidate cache
  const updatedLineupIds = useState<Set<string>>('updated-lineup-ids', () => new Set())

  // Track if a new lineup was created - pages should refetch to include it
  const hasNewLineup = useState<boolean>('has-new-lineup', () => false)

  const markAsDeleted = (lineupId: string) => {
    deletedLineupIds.value.add(lineupId)
  }

  const isDeleted = (lineupId: string) => {
    return deletedLineupIds.value.has(lineupId)
  }

  const clearDeletedIds = () => {
    deletedLineupIds.value.clear()
  }

  const markAsUpdated = (lineupId: string) => {
    updatedLineupIds.value.add(lineupId)
  }

  const isUpdated = (lineupId: string) => {
    return updatedLineupIds.value.has(lineupId)
  }

  const clearUpdatedIds = () => {
    updatedLineupIds.value.clear()
  }

  const markAsCreated = () => {
    hasNewLineup.value = true
  }

  const clearCreatedFlag = () => {
    hasNewLineup.value = false
  }

  // Check if any lineup has been modified (created, deleted or updated)
  const hasModifiedLineups = () => {
    return deletedLineupIds.value.size > 0 || updatedLineupIds.value.size > 0 || hasNewLineup.value
  }

  return {
    deletedLineupIds,
    updatedLineupIds,
    hasNewLineup,
    markAsDeleted,
    isDeleted,
    clearDeletedIds,
    markAsUpdated,
    isUpdated,
    clearUpdatedIds,
    markAsCreated,
    clearCreatedFlag,
    hasModifiedLineups
  }
}
