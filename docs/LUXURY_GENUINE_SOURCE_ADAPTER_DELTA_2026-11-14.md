# Existing canonical source adapter

`createExistingLuxuryGenuineSource()` binds the configured JSONL source using the
existing storage adapter. It calls no storage mutation method and accesses no
journal, key or provider. `runLuxuryGenuineInquiryFromExistingSource()` connects
this reader to the bounded runtime; no route, schedule or startup hook is added.

## Identity and snapshot checks

The reader requires explicit storage configuration, an existing canonical
directory, a regular non-symlink source file and a bound no-follow descriptor.
POSIX file permissions and ownership must be private. Inode, size, timestamps
and directory identity must remain stable across the normalized read. The source
is bounded in size and every persisted ID/time, unique identity and exact
thirteen-field payload must agree with the existing normalizer. Returned records
and payloads are frozen.

The general legacy reader can synthesize an ID for a record whose persisted ID is
missing. That fallback cannot become genuine server-persisted identity here.
Missing identity, malformed/partial data, duplicate IDs, changing files and
unsupported payload extensions withhold the whole snapshot. Consent fields are
never silently stripped to fit an older fingerprint contract.

## Deliberately denied admission

The current canonical payload and stored-record schema do not contain a typed
event-bound internal-handling review, authoritative identity suppression/DND
decision, or release/revocation record. Existing notes, status, arbitrary tags,
analytics consent and subscriber state cannot fill those contracts.

Consequently `readAdmission()` returns null with
`PERMISSION_REVIEW_FIELD_AND_SUPPRESSION_IDENTITY_SOURCE_ABSENT`. The concrete
wrapper stops before journal/provider access. A valid persisted inquiry is source
evidence, not an invented permission verdict or a commercial-readiness claim.

To enable a positive admission later, ground and review the existing authoritative
policy source and mapping, then replace this explicit denied reader. Keep the
original runtime owner and existing managed journal/release lifecycle. No new
policy store, subscription, mailbox trigger, paid plan or production action is
authorized by this adapter.

## Validation

Synthetic temporary-file tests cover unchanged bytes and modes, legacy missing-ID
rejection, duplicate/partial holds, private-file and symlink checks, refusal to
derive permission from arbitrary fields, unstripped payload extensions, changed
event bindings and the wrapper's stop before journal/provider access. Actual
production source files, customers and provider records are not used.
