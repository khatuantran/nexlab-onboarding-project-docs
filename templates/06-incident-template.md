---
version: 0.1
last-updated: 2026-04-23
target: .specs/incidents/INC-NNN.md
required_sections:
  - Metadata
  - Summary
  - Impact
  - Timeline
  - Detection
  - Root cause
  - Mitigation
  - Resolution
  - Action items
  - Lessons learned
---

# INC-<NNN> — <short title>

<!-- template: 06-incident-template.md@0.1 -->

## Metadata

- **Severity**: SEV1 (full outage / data loss) | SEV2 (major degradation) | SEV3 (minor, isolated)
- **Status**: Detected | Mitigated | Resolved | Closed
- **Detected at**: <YYYY-MM-DD HH:MM UTC>
- **Mitigated at**: <YYYY-MM-DD HH:MM UTC>
- **Resolved at**: <YYYY-MM-DD HH:MM UTC>
- **Duration** (detect → mitigate): <Nh Nm>
- **On-call**: @<handle>
- **Post-mortem due**: <YYYY-MM-DD> (48h sau resolved)

## Summary

<1 đoạn: what happened, when, impact. Write as if onboarding someone cold.>

## Impact

- **Users affected**: <count / role / project>
- **Data**: lost / corrupted / none — <details + backfill plan nếu có>
- **Revenue / SLA breach**: yes (<amount>) | no
- **External comms sent**: yes (<link>) | no

## Timeline

Ghi UTC. Mỗi dòng 1 mốc + action + actor.

| Time (UTC) | Event                   | Actor     |
| ---------- | ----------------------- | --------- |
| <HH:MM>    | Alert / report received | @<handle> |
| <HH:MM>    | <action>                | @<handle> |
| <HH:MM>    | Mitigation applied      | @<handle> |
| <HH:MM>    | Service restored        | @<handle> |

## Detection

- **Source**: alert (Grafana/pager) | user report | self-detect during work | other
- **Lag** (event start → detected): <Nm>
- **Detection improvement needed**: yes (<what>) | no

## Root cause

5-whys:

1. **Why did X happen?** <answer>
2. **Why?** <answer>
3. **Why?** <answer>
4. **Why?** <answer>
5. **Why?** <final root>

**Contributing factors**: <list, nếu có multiple causes>

## Mitigation

**Short-term stop-bleed** (làm gì để service trở lại):

- <action>
- <action>

## Resolution

**Permanent fix** (khác với mitigation nếu mitigation là tạm):

- **Related BUG**: [BUG-NNN](../bugs/BUG-NNN.md) — link tới bug entry nếu tạo
- **Fix commit**: `<hash>`
- **Deployed at**: <YYYY-MM-DD HH:MM UTC>

## Action items

| #   | Action              | Owner     | Due          | Tracking                       |
| --- | ------------------- | --------- | ------------ | ------------------------------ |
| 1   | <Add alert for X>   | @<handle> | <YYYY-MM-DD> | [BL-NNN](../backlog/BL-NNN.md) |
| 2   | <Add runbook for Y> | @<handle> | <YYYY-MM-DD> | —                              |

## Lessons learned

### What went well

- <response speed, tooling, comms, rollback worked, etc>

### What didn't

- <gap in monitoring, unclear runbook, slow detection, etc>

### Prevention

- <structural change needed to prevent repeat — often becomes a BL-NNN or CR-NNN>
