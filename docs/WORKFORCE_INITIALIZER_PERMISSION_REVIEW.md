# Workforce journal initialization permission correction

This is a proposed software correction. It does not authorize deployment,
production initialization, recovery, or worker activation.

## Problem and permission effect

On Linux, a directory created below a setgid parent inherits setgid even when
`mkdir` requests `0700`. The existing initializer can therefore create `2700`
below `/var/data` mode `2775`. Its existing private-directory check rejects
group/other access but permits that inherited special bit. It can continue to
write the marker and encrypted database; it does not stop on the exact-mode
mismatch. No production initialization has been performed for this review.

The proposed correction accepts only a new directory initially `0700` or
`2700`, owned by the effective service user and group. Only `2700` triggers
descriptor-based `chmod(0700)`, clearing inherited setgid without granting
read/write/execute to any additional user. It never changes the parent or
ownership, and never normalizes an existing directory. Other initial modes
fail rather than adding owner permissions removed by a restrictive umask.

## Boundaries and checks

- The explicit `initialize` command uses the configured storage root and fixed
  `workforce-validation-v2` child, and requires a new directory. Existing files,
  directories, symlinks and incomplete journals stop it before repair or reopening.
- The non-recursive `mkdir` must succeed before protection is considered.
  Runtime reads and existing library callers can reopen existing journals as
  before; they never enter the new directory-normalization branch.
- The parent must be a real directory at its canonical resolved path. Parent
  device/inode, owner/group and mode must remain unchanged through the checks.
- The new child must remain canonical and match the captured device/inode,
  owner/group and mode. A no-follow, directory-only descriptor is opened and
  compared to that identity before normalization. The mode operation targets
  the descriptor, not a pathname. The descriptor and pathname are verified again
  afterward, before marker creation, and before SQLite is opened.
- Marker creation remains exclusive. Existing journal formats, encryption,
  recovery logic and execution gates are unchanged. No credential is added.

These are race detection and descriptor binding, not a claim of atomic
path-based initialization against a hostile process with the same service
identity or write access to the parent. Node's `mkdir` does not return an inode
handle: replacement before the first post-mkdir observation, or after the last
path check and before a pathname-based marker/SQLite operation, remains a
residual limitation. Exclusive single-operator execution and trusted parent
writers remain prerequisites. Solving an adversarial same-identity threat would
require a separately designed native directory-relative/no-replace mechanism;
it is outside this narrow correction. Do not approve release based on a claim
that these checks eliminate every filesystem race.

## Failure and recovery

There is no automatic cleanup, chmod retry, reset, overwrite or rollback.
Failure before marker creation may leave an empty directory in its original or
normalized mode. Failure later may leave a marker, database or SQLite sidecar.
Any remaining target blocks a new explicit initialization. Stop, record exact
metadata and preserve it for a separately authorized reconciliation; do not
delete it or treat a failed command as proof that no state was written.

Production remains Business HOLD on, validation off and allowlist absent.
Merge/deployment and the later exact production operation require applicable
authorization separately. If production descriptor normalization is classified
as a security-sensitive permission action at execution time, obtain explicit
confirmation naming only the newly created child, `2700` to `0700`, existing
service ownership and unchanged parent. This software-preparation assignment
does not supply that confirmation. No broader access is granted by the change.

## Verification scope

Tests use temporary, disposable synthetic directories and random test keys only.
They cover exclusive initialization/retry refusal, incomplete/existing targets,
invalid input, symlink redirection, ownership mismatch, parent/directory identity
changes, failed normalization, and replacement during descriptor normalization.
The Linux regression explicitly demonstrates inherited `2700`, then verifies
child `0700`, database/marker `0600`, service ownership and unchanged `2775`
parent. Windows skips POSIX-only cases and cannot establish these Linux facts.
Existing GitHub Quality checks use Linux/Node24 and include this test file.
