# Lineup & Results Validation System

## Overview
Comprehensive validation system ensures data integrity across all lineup and results operations. Prevents duplicate assignments, enforces single JV/Varsity assignment per athlete per gender, and maintains consistency between lineups and results.

## Key Components

### 1. Validation Utility (`lib/lineupValidation.js`)

**Core Functions:**

- **`deduplicateLineup(records)`** - Ensures only one lineup record per athlete per meet
  - Keeps the latest record by ID
  - Removes duplicate assignments automatically
  
- **`deduplicateResults(results)`** - Ensures only one result per athlete per meet
  - Keeps the latest record by ID
  - Prevents duplicate result entries

- **`validateNoDualAssignment(email, lineupRecords)`** - Validates athlete not in both JV and Varsity
  - Checks within same gender (boys or girls)
  - Returns error message if violation found
  
- **`getAssignmentMap(lineup)`** - Builds clean assignment map from deduplicated lineup
  - Returns object: `{ athlete_email -> team_group }`
  - Filters out invalid groups automatically

- **`separateResultsBySections(results, lineup)`** - Groups results into sections with fallback
  - Sections: `varsity_boys`, `jv_boys`, `varsity_girls`, `jv_girls`, `unassigned`
  - Unassigned fallback: results with no lineup match go to `unassigned`

- **`validateLineupIntegrity(assignments, athletes)`** - Pre-save validation
  - Checks for multiple assignments per athlete
  - Validates all group keys are valid

### 2. MeetLineupBuilder (`components/seasons/MeetLineupBuilder.jsx`)

**Enforcement:**
- Loads lineup with deduplication on mount
- Prevents dual assignment: toggling one level auto-removes opposite level for same gender
- Pre-save validation: deletes conflicting records before creating new ones
- Safe save: handles duplicate detection and cleanup in single transaction

**Data Flow:**
```
Load lineup (deduplicated)
  ↓
User toggles assignment
  ↓
Opposite level auto-removed (same gender)
  ↓
User clicks Save
  ↓
Scan for conflicts → delete opposites
  ↓
Create/update/delete operations
  ↓
Reload (deduplicated)
```

### 3. MeetResultsPanel (`components/seasons/MeetResultsPanel.jsx`)

**Enforcement:**
- Fetches results with deduplication
- Fetches lineup with deduplication
- Organizes athletes by lineup assignment
- Handles unassigned athletes gracefully

**Safe Fallback:**
- If athlete has result but no lineup → shown in "Unassigned" section
- If athlete has lineup but no result → shown in their section (empty row)
- Deduplication ensures at most one result per athlete

### 4. PacketMeetResults (`components/packet/sections/PacketMeetResults.jsx`)

**Enforcement:**
- Deduplicates results and lineup on load
- Groups by section based on lineup assignment
- Safe fallback: shows flat view if no lineup data
- Omits unassigned athletes from printed packet (intentional)

**Data Flow:**
```
Load meets with results
  ↓
Deduplicate all results
  ↓
Deduplicate all lineups
  ↓
For each meet:
  If has lineup → Group by section
  Else → Flat view
```

### 5. MeetSummary (`components/seasons/MeetSummary.jsx`)

**Enforcement:**
- Deduplicates results and lineup
- Maps results to sections via assignment map
- Shows unassigned athletes separately

## Data Integrity Guarantees

### ✅ No Duplicate Assignments
- **Load**: Deduplicate on fetch
- **Save**: Validate and clean before commit
- **Result**: Max 1 lineup record per athlete per meet

### ✅ No Dual JV/Varsity
- **Boys**: Athlete either in `varsity_boys` OR `jv_boys`, never both
- **Girls**: Athlete either in `varsity_girls` OR `jv_girls`, never both
- **Enforcement**: 
  - UI blocks dual assignment (opposite level auto-removed on toggle)
  - Pre-save validation deletes conflicts

### ✅ Results Match Lineup
- **Deduplication**: Each athlete has max 1 result per meet
- **Grouping**: Results grouped by lineup assignment
- **Fallback**: Unassigned results go to "Unassigned" section (never lost)

### ✅ Safe Fallback
- **Missing Lineup**: Results shown in "Unassigned" section
- **Missing Result**: Athlete shown in section with empty row
- **Missing Athlete Data**: Display falls back to email prefix (safe)
- **Empty Data**: Graceful empty states throughout

## Testing Checklist

```
[ ] Load lineup with duplicates → deduplicates correctly
[ ] Assign athlete to Varsity → can't also assign to JV (same gender)
[ ] Save lineup with conflicts → cleans before commit
[ ] Create result for unassigned athlete → shows in Unassigned section
[ ] Delete lineup assignment → athlete moves to Unassigned
[ ] Load packet with missing lineup → falls back to flat view
[ ] Multiple results per athlete → keeps latest, discards others
[ ] Edit result → updates in place, no duplicates
[ ] Export packet → no duplicate athletes per section
```

## Implementation Notes

1. **Deduplication Strategy**: Keep records by highest ID (latest created/updated)
2. **Safe Deletion**: Pre-save scan removes conflicts before new inserts
3. **Fallback Priority**: Unassigned → Flat View → Empty State
4. **Gender Grouping**: Prevent JV/Varsity conflict within same gender only
5. **No Lost Data**: Unassigned results always visible (never hidden)

## Future Enhancements

- Log all validation conflicts for audit trail
- Batch deduplication on background sync
- Validation dashboard showing integrity stats
- Auto-cleanup on schedule (remove orphaned records)