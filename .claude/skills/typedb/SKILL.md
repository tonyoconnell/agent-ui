# TypeDB 3.0 Complete Reference Skill

> **Version**: TypeDB 3.x (3.0+)
> **Last Updated**: 2026-01-16
> **Purpose**: Comprehensive TypeDB/TypeQL knowledge for Claude Code

---

## Table of Contents

1. [Overview](#overview)
2. [Critical Syntax Rules](#critical-syntax-rules)
3. [Schema Definition](#schema-definition)
4. [Data Pipelines](#data-pipelines)
5. [Query Operations](#query-operations)
6. [Functions](#functions)
7. [Patterns](#patterns)
8. [Annotations](#annotations)
9. [Value Types](#value-types)
10. [Python Driver](#python-driver)
11. [Transaction Management](#transaction-management)
12. [Best Practices](#best-practices)
13. [Query Optimization](#query-optimization)
14. [Complete Keyword Reference](#complete-keyword-reference)
15. [Project-Specific Patterns](#project-specific-patterns)

---

## Overview

TypeDB is a strongly-typed, polymorphic, transactional database using the **Polymorphic Entity-Relation-Attribute (PERA)** data model. TypeQL is its declarative query language.

### Core Concepts

- **Entity Types**: Independent objects that exist without dependencies
- **Relation Types**: Connect entities through roles
- **Attribute Types**: Store primitive values, identified by their value
- **Roles**: Interfaces that types implement to participate in relations
- **Ownership**: Types declare what attributes they own
- **Type Hierarchies**: Single-inheritance subtyping with `sub`

### Connection Details (TypeDB Cloud)

```python
from typedb.driver import TypeDB, Credentials, DriverOptions, TransactionType

# Connect to TypeDB Cloud
credentials = Credentials("admin", os.environ["TYPEDB_PASSWORD"])
options = DriverOptions(is_tls_enabled=True)
driver = TypeDB.driver("https://server.cluster.typedb.com:80", credentials, options)

# Open transaction (no sessions in 3.0!)
with driver.transaction("database-name", TransactionType.READ) as tx:
    result = tx.query("match $e isa entity; select $e; limit 10;").resolve()
```

---

## Critical Syntax Rules

### MUST-KNOW RULES

| Feature | Correct TypeDB 3.0 |
|---------|-------------------|
| Sessions | **NO SESSIONS** - transactions directly on driver |
| Query syntax | `match ... select` |
| Delete syntax | `delete $attr;` (NOT `delete $e has attr $attr;`) |
| Value type: integer | `integer` (NOT `long`) |
| Value type: float | `double` |
| Type declaration | `entity person` (root types) or `entity employee sub person` (subtypes) |
| Variables | All use `$` |
| Functions | `fun name() -> type:` (replaces rules) |

### Transaction Pattern (No Sessions!)

```python
# CORRECT - Direct transaction on driver
with driver.transaction("database", TransactionType.READ) as tx:
    result = tx.query("match $p isa person; select $p;").resolve()
```

### Delete Syntax (CRITICAL!)

```typeql
# CORRECT: Delete the attribute itself
match $p isa person, has name $n;
delete $n;

# CORRECT: Delete ownership (keep attribute, remove from owner)
delete has $n of $p;
```

### Schema Declaration

```typeql
# Root type declaration
entity person;
relation friendship;
attribute name, value string;

# Subtype declaration (uses sub)
entity employee sub person;
```

---

## Schema Definition

### Entity Types

```typeql
define

# Basic entity
entity person;

# Entity with ownership
entity user,
    owns username @key,
    owns email @unique,
    owns age;

# Abstract entity (cannot be instantiated)
entity content @abstract;

# Entity with role playing
entity company,
    plays employment:employer,
    plays ownership:owner;

# Subtype inheritance
entity employee sub person,
    owns employee-id @key,
    plays employment:employee;
```

### Relation Types

```typeql
define

# Basic relation with roles
relation friendship,
    relates friend @card(2);  # Exactly 2 friends

# Relation with different roles
relation employment,
    relates employer @card(1),     # One employer
    relates employee @card(1..);   # One or more employees

# Relation with attributes
relation transaction,
    relates buyer,
    relates seller,
    owns amount,
    owns timestamp;

# Abstract relation
relation interaction @abstract,
    relates subject,
    relates content;

# Relation with role specialization
relation content-engagement sub interaction,
    relates author as subject;  # 'author' specializes 'subject'
```

### Attribute Types

```typeql
define

# Basic attributes with value types
attribute name, value string;
attribute age, value integer;          # NOT 'long'
attribute score, value double;         # NOT 'float'
attribute balance, value decimal;
attribute active, value boolean;
attribute birth-date, value date;
attribute created-at, value datetime;
attribute created-with-tz, value datetime-tz;
attribute duration, value duration;

# Attribute with regex constraint
attribute email, value string @regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

# Attribute with value constraint
attribute status, value string @values("pending", "active", "completed", "cancelled");

# Attribute with range constraint
attribute percentage, value double @range(0.0..100.0);

# Independent attribute (survives without owner)
attribute log-entry, value string @independent;

# Attribute subtype
attribute full-name sub name;
```

### Ownership Declarations

```typeql
define

entity person,
    owns name @card(1..3),      # 1 to 3 names
    owns email @key,            # Unique identifier
    owns phone @unique,         # Unique but optional
    owns nickname @card(0..);   # Any number

# Ownership with ordering
entity playlist,
    owns song @card(0..) @distinct;  # Unique songs only
```

### Complete Schema Example

```typeql
define

# Attributes
attribute id, value string;
attribute name, value string;
attribute email, value string @regex("^.*@.*\\..*$");
attribute age, value integer @range(0..150);
attribute balance, value decimal;
attribute timestamp, value datetime-tz;
attribute status, value string @values("active", "inactive", "pending");

# Entities
entity person @abstract,
    owns id @key,
    owns name @card(1),
    owns email @unique,
    owns age;

entity user sub person,
    owns balance,
    plays friendship:friend,
    plays employment:employee;

entity company,
    owns id @key,
    owns name,
    plays employment:employer;

# Relations
relation friendship,
    relates friend @card(2);

relation employment,
    relates employer @card(1),
    relates employee @card(1..),
    owns timestamp,
    owns status;
```

### Undefine (Remove Schema Elements)

```typeql
# Remove a type
undefine user;

# Remove ownership from a type
undefine owns email from user;

# Remove role playing from a type
undefine plays friendship:friend from user;

# Remove a role from a relation
undefine relates employee from employment;

# Remove an annotation
undefine @unique from user owns email;

# Remove a function
undefine fun calculate_score;
```

### Redefine (Modify Schema Elements)

```typeql
# Redefine type hierarchy (one change per query)
redefine user sub page;

# Redefine attribute value type
redefine karma value integer;

# Redefine annotation
redefine email value string @regex("^.*@typedb\\.com$");

# Redefine role specialization
redefine fathership relates father as parent;
```

---

## Data Pipelines

TypeQL queries are **pipelines** of stages. Each stage accepts a stream of answers and outputs a stream.

### Pipeline Categories

- **Write Pipelines**: Contain insert, delete, update, or put stages
- **Read Pipelines**: Only retrieve data (match, fetch, select)

### Pipeline Stages

| Stage | Purpose | Transaction Type |
|-------|---------|------------------|
| `match` | Find existing data | READ, WRITE, SCHEMA |
| `insert` | Create new data | WRITE |
| `delete` | Remove data | WRITE |
| `update` | Modify single-cardinality data | WRITE |
| `put` | Insert if not exists | WRITE |
| `fetch` | Format output as JSON | READ |
| `select` | Keep specified variables | READ |
| `reduce` | Aggregate results | READ |
| `sort` | Order results | READ |
| `limit` | Restrict result count | READ |
| `offset` | Skip initial results | READ |
| `distinct` | Remove duplicates | READ |
| `require` | Filter elements with variables | READ |
| `with` | Define ad-hoc functions | READ |

---

## Query Operations

### Match (Read Data)

```typeql
# Basic match
match $u isa user;
select $u;

# Match with attributes
match
    $u isa user,
        has name $n,
        has age $a;
select $u, $n, $a;

# Match with conditions
match
    $u isa user, has age $a;
    $a >= 18;
select $u;

# Match relations
match
    $f isa friendship,
        links (friend: $u1, friend: $u2);
    $u1 has name "Alice";
select $u2;

# Match with negation
match
    $u isa user;
    not { $u has status "inactive"; };
select $u;

# Match with disjunction (OR)
match
    $u isa user;
    { $u has status "active"; } or { $u has status "pending"; };
select $u;

# Match with optional
match
    $u isa user, has name $n;
    try { $u has email $e; };  # Optional email
select $n, $e;
```

### Insert (Create Data)

```typeql
# Insert entity with attributes
insert $u isa user,
    has id "user-001",
    has name "Alice",
    has age 30;

# Insert multiple entities
insert
    $u1 isa user, has id "u1", has name "Alice";
    $u2 isa user, has id "u2", has name "Bob";

# Match-Insert (create based on existing data)
match
    $u1 isa user, has name "Alice";
    $u2 isa user, has name "Bob";
insert
    $f isa friendship, links (friend: $u1, friend: $u2);

# Insert relation with attributes
insert
    $e isa employment,
        links (employer: $company, employee: $person),
        has timestamp 2025-01-15T10:00:00,
        has status "active";
```

### Delete (Remove Data)

```typeql
# Delete an entity (cascades to relations and owned attributes)
match $u isa user, has id "user-001";
delete $u;

# Delete an attribute (the attribute value itself)
match
    $u isa user, has id "user-001";
    $u has email $e;
delete $e;

# Delete ownership (keep attribute, remove from owner)
match
    $u isa user, has id "user-001";
    $u has nickname $n;
delete has $n of $u;

# Delete role player from relation
match
    $f isa friendship, links (friend: $u);
    $u has id "user-001";
delete links (friend: $u) of $f;

# Delete relation
match $f isa friendship;
delete $f;
```

### Update (Modify Single-Cardinality Data)

```typeql
# Update works ONLY for @card(0..1) or @card(1)
match $u isa user, has id "user-001";
update $u has status "inactive";

# Update replaces the value or adds if none exists
match $u isa user, has name "Alice";
update $u has age 31;
```

### Put (Upsert - Insert if Not Exists)

```typeql
# Put entire pattern
put $u isa user, has id "user-001", has name "Alice";

# Put is all-or-nothing
# If ANY part doesn't match, entire pattern is inserted
put
    $u isa user, has id "user-001";
    $u has status "active";
```

### Select (Project Variables)

```typeql
# Select specific variables
match $u isa user, has name $n, has age $a;
select $n, $a;

# Select with expressions
match
    $u isa user, has age $a;
    let $next_year = $a + 1;
select $u, $next_year;
```

### Fetch (JSON Output)

```typeql
# Basic fetch
match $u isa user;
fetch {
    "name": $u.name,
    "email": $u.email
};

# Fetch with subquery
match $u isa user;
fetch {
    "user": $u.name,
    "friends": [
        match ($u, $friend) isa friendship;
        fetch { "friend_name": $friend.name };
    ]
};

# Fetch all attributes
match $u isa user;
fetch {
    "user_data": { $u.* }
};
```

### Reduce (Aggregations)

```typeql
# Count
match $u isa user;
reduce $count = count;

# Multiple aggregations
match $u isa user, has age $a;
reduce
    $count = count,
    $avg_age = mean($a),
    $max_age = max($a),
    $min_age = min($a),
    $total_age = sum($a);

# Group by
match
    $u isa user, has status $s, has age $a;
reduce $count = count, $avg = mean($a) groupby $s;

# Available aggregation functions:
# count, sum, mean, median, min, max, std, list
```

### Sort, Limit, Offset

```typeql
# Sort ascending (default)
match $u isa user, has age $a;
select $u, $a;
sort $a;

# Sort descending
match $u isa user, has score $s;
select $u, $s;
sort $s desc;

# Multiple sort keys
match $u isa user, has name $n, has age $a;
select $n, $a;
sort $a desc, $n asc;

# Pagination
match $u isa user;
select $u;
sort $u;
offset 20;
limit 10;
```

### Distinct

```typeql
# Remove duplicate results
match
    $f isa friendship, links (friend: $u);
select $u;
distinct;
```

---

## Functions

Functions replace rules from TypeDB 2.x. They are **read-only** query abstractions.

### Function Syntax

```typeql
define

# Scalar function (returns single value)
fun user_age($user: user) -> integer:
    match $user has age $a;
    return first $a;

# Stream function (returns multiple values)
fun user_friends($user: user) -> { user }:
    match ($user, $friend) isa friendship;
    return { $friend };

# Tuple function (returns multiple values per row)
fun user_info($user: user) -> string, integer:
    match $user has name $n, has age $a;
    return first $n, $a;

# Aggregation function
fun friend_count($user: user) -> integer:
    match ($user, $friend) isa friendship;
    return count($friend);

# Recursive function (transitive closure)
fun reachable($from: node) -> { node }:
    match
        { $_ isa edge, links (from: $from, to: $to); }
        or {
            let $mid in reachable($from);
            $_ isa edge, links (from: $mid, to: $to);
        };
    return { $to };
```

### Using Functions in Queries

```typeql
# Using scalar function
match
    $u isa user;
    let $age = user_age($u);
    $age > 18;
select $u;

# Using stream function
match
    $u isa user, has name "Alice";
    let $friend in user_friends($u);
select $friend;

# Using tuple function
match
    $u isa user;
    let $name, $age = user_info($u);
select $name, $age;
```

### Ad-hoc Functions with `with`

```typeql
with
    fun is_adult($u: user) -> boolean:
        match $u has age $a; $a >= 18;
        return first true;
match
    $u isa user;
    let $adult = is_adult($u);
    $adult == true;
select $u;
```

---

## Inference Rules (Emergence Patterns)

TypeDB inference rules derive NEW facts automatically from existing data. This is the foundation for emergent intelligence.

### Basic Classification Rule

```typeql
define

rule elite-pattern:
    when {
        $e isa signal-edge,
            has win-rate $wr,
            has trail-pheromone $tp,
            has traversal-count $tc;
        $wr >= 0.75;
        $tp >= 70.0;
        $tc >= 50;
    } then {
        $e has tier "elite";
    };
```

### Danger Detection

```typeql
define

rule danger-zone:
    when {
        $e isa signal-edge,
            has win-rate $wr,
            has alarm-pheromone $ap;
        $wr < 0.40;
        $ap >= 25.0;
    } then {
        $e has tier "danger";
    };
```

### Chained Rules (Crystallization)

```typeql
define

# This rule depends on elite-pattern rule firing first
rule crystallization-candidate:
    when {
        $e isa signal-edge,
            has tier "elite",         # DERIVED from elite-pattern rule
            has traversal-count $tc,
            has trail-pheromone $tp;
        $tc >= 100;
        $tp >= 80.0;
    } then {
        $e has crystallization-ready true;
    };
```

### Rule with Disjunction (OR)

```typeql
define

rule high-funding-opportunity:
    when {
        $f isa funding-snapshot, has funding-rate $rate;
        { $rate > 0.001; } or { $rate < -0.001; };
    } then {
        $f has severity "high";
    };
```

### Rule with Computed Value

```typeql
define

rule reliable-detector:
    when {
        $d isa detector,
            has total-predictions $tp,
            has correct-predictions $cp;
        $tp >= 20;
        ?acc = $cp / $tp;
        ?acc >= 0.60;
    } then {
        $d has pheromone-level ?acc;
    };
```

### Superhighway Detection

```typeql
define

rule superhighway-edge:
    when {
        $e isa signal-edge,
            has trail-pheromone $tp,
            has traversal-count $tc;
        $tp >= 85.0;
        $tc >= 100;
    } then {
        $e has is-superhighway true;
    };
```

### Querying Derived Facts

```typeql
# tier = "elite" is DERIVED by inference rule, not inserted
match $e isa signal-edge, has tier "elite";
select $e;

# Find crystallization candidates (derived from chained rules)
match $e isa signal-edge, has crystallization-ready true;
select $e;
```

---

## Patterns

### Conjunctions (AND)

```typeql
# Statements separated by semicolons form conjunctions
match
    $u isa user;
    $u has name "Alice";
    $u has age $a;
    $a > 18;
select $u;
```

### Disjunctions (OR)

```typeql
match
    $u isa user;
    { $u has status "active"; } or { $u has status "pending"; };
select $u;

# Multiple branches
match
    $u isa user;
    { $u has role "admin"; }
    or { $u has role "moderator"; }
    or { $u has role "editor"; };
select $u;
```

### Negations (NOT)

```typeql
match
    $u isa user;
    not { $u has status "deleted"; };
select $u;

# Negation with relations
match
    $u isa user;
    not { ($u) isa ban; };
select $u;
```

### Optionals (TRY)

```typeql
# Optional attribute
match
    $u isa user, has name $n;
    try { $u has email $e; };
select $n, $e;  # $e may be null

# Optional relation
match
    $u isa user;
    try { ($u, $manager) isa management; };
select $u, $manager;
```

### Variable Scope

- Variables have scope within their block `{ ... }` or the entire pattern
- Variables in ALL branches of a disjunction are in parent scope
- Variables in negations are scoped to the negation block

---

## Annotations

### Cardinality Annotations

```typeql
# Exact count
relates friend @card(2);        # Exactly 2

# Range
owns email @card(0..1);         # 0 or 1
owns phone @card(1..);          # 1 or more
owns nickname @card(0..);       # Any number (default for owns)

# Unlimited
plays role @card(0..);          # Default for plays
```

### Uniqueness Annotations

```typeql
# @key: Every owner has exactly one, unique across all owners
owns username @key;

# @unique: Unique across owners, but optional
owns email @unique;

# @subkey: Composite key from multiple attributes
owns first_name @subkey("full_name");
owns last_name @subkey("full_name");
```

### Value Constraint Annotations

```typeql
# @values: Enumerated values
attribute status, value string @values("active", "inactive", "pending");

# @range: Numeric/date range
attribute age, value integer @range(0..150);
attribute score, value double @range(0.0..100.0);

# @regex: String pattern
attribute email, value string @regex("^[^@]+@[^@]+\\.[^@]+$");

# @distinct: Unique values in owned list
owns tag @card(0..) @distinct;
```

### Behavioral Annotations

```typeql
# @abstract: Cannot be instantiated
entity content @abstract;

# @independent: Attribute survives without owners
attribute log_entry, value string @independent;

# @cascade: Delete behavior for relations
relation ownership,
    relates owner @cascade,      # Delete relation when owner deleted
    relates owned;
```

---

## Value Types

| Type | Description | Example |
|------|-------------|---------|
| `boolean` | true/false | `true`, `false` |
| `integer` | 64-bit signed | `42`, `-100` |
| `double` | IEEE 754 double | `3.14`, `1e-10` |
| `decimal` | Fixed-point | `123.456` |
| `string` | UTF-8 text | `"Hello"` |
| `date` | ISO 8601 date | `2025-01-15` |
| `datetime` | Date + time | `2025-01-15T10:30:00` |
| `datetime-tz` | With timezone | `2025-01-15T10:30:00+08:00` |
| `duration` | ISO 8601 duration | `P1Y2M3DT4H5M6S` |

### Value Literals in Queries

```typeql
insert $u isa user,
    has active true,
    has age 30,
    has score 95.5,
    has balance 1234.56,
    has name "Alice",
    has birth_date 1994-05-15,
    has created_at 2025-01-15T10:30:00,
    has created_with_tz 2025-01-15T10:30:00+08:00;
```

---

## Python Driver

### Installation

```bash
pip install typedb-driver
```

### Connection

```python
from typedb.driver import TypeDB, Credentials, DriverOptions, TransactionType

# Community Edition (no auth, no TLS)
driver = TypeDB.driver("localhost:1729")

# TypeDB Cloud / Enterprise
credentials = Credentials("username", "password")
options = DriverOptions(
    is_tls_enabled=True,
    tls_root_ca_path="/path/to/ca.pem"  # Optional for custom CA
)
driver = TypeDB.driver(
    "https://cluster.typedb.com:80",
    credentials,
    options
)

# Context manager recommended
with TypeDB.driver(address, credentials, options) as driver:
    # Operations here
    pass
```

### Database Management

```python
# List databases
databases = driver.databases.all()

# Check if exists
exists = driver.databases.contains("my-database")

# Create database
driver.databases.create("my-database")

# Get database
db = driver.databases.get("my-database")

# Delete database
db.delete()

# Get schema
schema_str = db.schema()
```

### Transaction Types

```python
from typedb.driver import TransactionType

# READ: Read-only queries, concurrent
TransactionType.READ

# WRITE: Data modifications (insert, delete, update, put)
TransactionType.WRITE

# SCHEMA: Schema modifications (define, undefine, redefine)
TransactionType.SCHEMA
```

### Query Execution

```python
# Read transaction
with driver.transaction("my-database", TransactionType.READ) as tx:
    # Execute query
    promise = tx.query("match $u isa user; select $u; limit 10;")
    result = promise.resolve()

    # Process results
    for row in result.as_concept_rows():
        user = row.get("u")
        print(f"User: {user.get_iid()}")

        # Get attributes
        if user.is_entity():
            entity = user.as_entity()
            # Access via subsequent queries

# Write transaction
with driver.transaction("my-database", TransactionType.WRITE) as tx:
    tx.query('insert $u isa user, has name "Alice";').resolve()
    tx.commit()  # MUST commit!

# Schema transaction
with driver.transaction("my-database", TransactionType.SCHEMA) as tx:
    tx.query("define entity new_type;").resolve()
    tx.commit()
```

### Result Processing

```python
# Concept Rows (for select queries)
result = tx.query("match $u isa user, has name $n; select $u, $n;").resolve()
for row in result.as_concept_rows():
    user = row.get("u")           # Get by variable name
    name = row.get("n")

    # Type checking
    if user.is_entity():
        entity = user.as_entity()
        iid = entity.get_iid()

    if name.is_attribute():
        attr = name.as_attribute()
        value = attr.get_string()  # or get_integer(), get_double(), etc.

# Concept Documents (for fetch queries)
result = tx.query("""
    match $u isa user;
    fetch { "name": $u.name, "age": $u.age };
""").resolve()
for doc in result.as_concept_documents():
    print(doc["name"])
    print(doc["age"])

# Schema queries (define/undefine/redefine)
result = tx.query("define entity new_entity;").resolve()
if result.is_ok():
    print("Schema updated successfully")
```

### Type Checking and Casting

```python
# Type checks
concept.is_entity()
concept.is_relation()
concept.is_attribute()
concept.is_entity_type()
concept.is_relation_type()
concept.is_attribute_type()
concept.is_type()
concept.is_instance()
concept.is_value()

# Type casting
entity = concept.as_entity()
relation = concept.as_relation()
attribute = concept.as_attribute()

# Value extraction
attr.get_string()
attr.get_integer()
attr.get_double()
attr.get_decimal()
attr.get_boolean()
attr.get_date()
attr.get_datetime()
attr.get_datetime_tz()
attr.get_duration()

# Safe extraction (returns None if wrong type)
attr.try_get_string()
attr.try_get_integer()
```

### Transaction Options

```python
from typedb.driver import TransactionOptions

# Set transaction timeout (default 5 minutes)
options = TransactionOptions(transaction_timeout_millis=120_000)  # 2 minutes

# Set schema lock timeout (default 30 seconds)
options = TransactionOptions(schema_lock_acquire_timeout_millis=60_000)

with driver.transaction("db", TransactionType.WRITE, options=options) as tx:
    # ...
```

### Error Handling

```python
from typedb.driver import TypeDBDriverException

try:
    with driver.transaction("db", TransactionType.WRITE) as tx:
        tx.query("insert $u isa user, has name 'Alice';").resolve()
        tx.commit()
except TypeDBDriverException as e:
    if "QEX" in str(e).upper():
        print("Query execution error")
    elif "TQL" in str(e).upper():
        print("TypeQL parsing error")
    else:
        print(f"Driver error: {e}")
```

### Batch Operations

```python
# Batch insert with concurrent promises
with driver.transaction("db", TransactionType.WRITE) as tx:
    promises = []
    for item in items:
        query = f"insert $x isa item, has name '{item}';"
        promises.append(tx.query(query))

    # Resolve all
    for p in promises:
        p.resolve()

    tx.commit()

# Chunked batch processing
def insert_batch(driver, items, chunk_size=100):
    for i in range(0, len(items), chunk_size):
        chunk = items[i:i + chunk_size]
        with driver.transaction("db", TransactionType.WRITE) as tx:
            for item in chunk:
                tx.query(f"insert $x isa item, has name '{item}';").resolve()
            tx.commit()
```

---

## Transaction Management

### Transaction Characteristics

| Type | Reads | Data Writes | Schema Writes | Concurrency |
|------|-------|-------------|---------------|-------------|
| READ | Yes | No | No | Fully concurrent |
| WRITE | Yes | Yes | No | May conflict on commit |
| SCHEMA | Yes | Yes | Yes | Exclusive (blocks writes) |

### Snapshot Isolation

- Transactions operate on snapshots taken at open time
- Changes visible within transaction, not to others until commit
- ACID guarantees up to snapshot isolation

### Commit Behavior

```python
# Write transactions MUST commit
with driver.transaction("db", TransactionType.WRITE) as tx:
    tx.query("insert ...").resolve()
    tx.commit()  # Required!

# Read transactions auto-close, no commit needed
with driver.transaction("db", TransactionType.READ) as tx:
    result = tx.query("match ...").resolve()
    # Auto-closes when exiting context

# Explicit rollback
with driver.transaction("db", TransactionType.WRITE) as tx:
    try:
        tx.query("insert ...").resolve()
        if something_wrong:
            tx.rollback()  # Discard changes
            return
        tx.commit()
    except:
        # Transaction auto-rollbacks on exception
        raise
```

### Conflict Handling

```python
import time
import random

def write_with_retry(driver, query, max_retries=3):
    for attempt in range(max_retries):
        try:
            with driver.transaction("db", TransactionType.WRITE) as tx:
                tx.query(query).resolve()
                tx.commit()
                return True
        except TypeDBDriverException as e:
            if "conflict" in str(e).lower() and attempt < max_retries - 1:
                wait_time = 0.1 * (2 ** attempt) + random.uniform(0, 0.1)
                time.sleep(wait_time)
                continue
            raise
    return False
```

---

## Best Practices

### Connection Management

```python
# DO: Use context managers
with TypeDB.driver(address, credentials, options) as driver:
    with driver.transaction("db", TransactionType.READ) as tx:
        # ...

# DO: Reuse single driver instance
class DatabaseClient:
    def __init__(self):
        self.driver = TypeDB.driver(address, credentials, options)

    def close(self):
        self.driver.close()

# DON'T: Create new drivers per query
def bad_query():
    driver = TypeDB.driver(...)  # Expensive!
    # ...
    driver.close()
```

### Query Patterns

```python
# DO: Batch operations
with driver.transaction("db", TransactionType.WRITE) as tx:
    for item in items:
        tx.query(f"insert $x isa item, has name '{item}';")
    tx.commit()

# DON'T: One transaction per insert
for item in items:
    with driver.transaction("db", TransactionType.WRITE) as tx:
        tx.query(f"insert $x isa item, has name '{item}';").resolve()
        tx.commit()  # Too many commits!
```

### Security

```python
# DO: Use environment variables for credentials
import os
credentials = Credentials("admin", os.environ["TYPEDB_PASSWORD"])

# DO: Enable TLS in production
options = DriverOptions(is_tls_enabled=True)

# DON'T: Hardcode credentials
credentials = Credentials("admin", "password123")  # Bad!
```

---

## Query Optimization

### Predicate Pushdown

```typeql
# FAST: Constraints in single match stage
match
    $u isa user;
    $u has username "john_1";
select $u;

# SLOW: Constraints across stages
match $u isa user;
match $u has username "john_1";  # Large intermediate result!
select $u;
```

### Type Specificity

```typeql
# FAST: Use specific type
match $s isa scout, has fitness $f;
select $s, $f;

# SLOW: Generic type with late filtering
match
    $a isa ant, has fitness $f;  # Scans all ants
    $a isa scout;  # Late type restriction
select $a, $f;
```

### Avoid Cartesian Products

```typeql
# BAD: N x M combinations
match
    $a isa agent;
    $b isa agent;
select $a, $b;

# GOOD: Connected through relation
match
    $a isa agent;
    $b isa agent;
    (parent: $a, child: $b) isa reproduction;
select $a, $b;
```

### Use Limits for Exploration

```typeql
# GOOD: Limit exploratory queries
match $u isa user;
select $u;
limit 10;

# BAD: No limit on large datasets
match $u isa user;
select $u;  # Could return millions
```

### Batch Inserts

```typeql
# GOOD: Single transaction
insert
    $a1 isa agent, has id "a1";
    $a2 isa agent, has id "a2";
    $a3 isa agent, has id "a3";

# BAD: Multiple transactions
insert $a1 isa agent, has id "a1";
-- commit --
insert $a2 isa agent, has id "a2";
-- commit --
```

### Existence Checks

```typeql
# Efficient existence check
match $x isa user, has email "test@example.com";
reduce $exists = count;
-- Check if $exists > 0

# Or with early exit
match $x isa user, has email "test@example.com";
limit 1;
```

---

## Complete Keyword Reference

### Schema Keywords

| Keyword | Purpose | Example |
|---------|---------|---------|
| `define` | Begin schema definition | `define entity user;` |
| `undefine` | Remove schema element | `undefine user;` |
| `redefine` | Modify schema element | `redefine user sub page;` |
| `entity` | Define entity type | `entity person;` |
| `relation` | Define relation type | `relation friendship;` |
| `attribute` | Define attribute type | `attribute name, value string;` |
| `struct` | Define struct type | `struct address;` |
| `sub` | Define subtype | `entity employee sub person;` |
| `relates` | Define relation role | `relates friend;` |
| `plays` | Type plays role | `plays friendship:friend;` |
| `owns` | Type owns attribute | `owns name;` |
| `value` | Attribute value type | `value string;` |
| `as` | Role specialization | `relates author as subject;` |
| `fun` | Define function | `fun name() -> type:` |

### Data Pipeline Keywords

| Keyword | Purpose | Example |
|---------|---------|---------|
| `match` | Find existing data | `match $u isa user;` |
| `insert` | Create data | `insert $u isa user;` |
| `delete` | Remove data | `delete $u;` |
| `update` | Modify data | `update $u has age 31;` |
| `put` | Insert if not exists | `put $u isa user;` |
| `fetch` | JSON output | `fetch { "name": $u.name };` |
| `select` | Project variables | `select $u, $n;` |
| `reduce` | Aggregate | `reduce $count = count;` |
| `sort` | Order results | `sort $a desc;` |
| `limit` | Restrict count | `limit 10;` |
| `offset` | Skip results | `offset 20;` |
| `distinct` | Remove duplicates | `distinct;` |
| `require` | Filter nulls | `require $optional;` |
| `with` | Ad-hoc functions | `with fun f() -> ...` |

### Pattern Keywords

| Keyword | Purpose | Example |
|---------|---------|---------|
| `or` | Disjunction | `{ ... } or { ... };` |
| `not` | Negation | `not { $u has status "deleted"; };` |
| `try` | Optional | `try { $u has email $e; };` |
| `isa` | Type constraint | `$u isa user;` |
| `has` | Attribute ownership | `$u has name "Alice";` |
| `links` | Relation role | `links (friend: $u);` |
| `is` | Variable equality | `$a is $b;` |
| `let` | Assign expression | `let $x = $a + $b;` |
| `in` | Iterate stream | `let $x in function();` |
| `contains` | Substring match | `$s contains "test";` |
| `like` | Regex match | `$s like "^test.*";` |

### Aggregation Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `count` | Count items | `reduce $c = count;` |
| `sum` | Sum values | `reduce $s = sum($val);` |
| `mean` | Average | `reduce $avg = mean($val);` |
| `median` | Median | `reduce $med = median($val);` |
| `min` | Minimum | `reduce $min = min($val);` |
| `max` | Maximum | `reduce $max = max($val);` |
| `std` | Std deviation | `reduce $std = std($val);` |
| `list` | Collect to list | `reduce $items = list($item);` |

### Annotations

| Annotation | Purpose | Example |
|------------|---------|---------|
| `@abstract` | Cannot instantiate | `entity content @abstract;` |
| `@key` | Unique identifier | `owns id @key;` |
| `@unique` | Unique optional | `owns email @unique;` |
| `@subkey` | Composite key | `owns part @subkey("composite");` |
| `@card` | Cardinality | `owns name @card(1..3);` |
| `@values` | Enum values | `@values("a", "b", "c");` |
| `@range` | Value range | `@range(0..100);` |
| `@regex` | String pattern | `@regex("^[a-z]+$");` |
| `@distinct` | Unique in list | `owns tag @distinct;` |
| `@independent` | Survives unowned | `@independent;` |
| `@cascade` | Delete behavior | `relates owner @cascade;` |

---

## Project-Specific Patterns

### Signal-Edge Operations (Trading)

```typeql
# Define signal-edge
define
attribute edge-id, value string;
attribute from-state-id, value string;
attribute to-signal-direction, value string;
attribute win-count, value integer;
attribute loss-count, value integer;
attribute total-pnl, value double;
attribute edge-trail-level, value double;

entity signal-edge,
    owns edge-id @key,
    owns from-state-id,
    owns to-signal-direction,
    owns win-count,
    owns loss-count,
    owns total-pnl,
    owns edge-trail-level;

# Query high-performing edges
match
    $e isa signal-edge,
        has edge-id $id,
        has edge-trail-level $level,
        has total-pnl $pnl;
    $level >= 20.0;
    $pnl > 0;
select $id, $level, $pnl;
sort $pnl desc;
limit 20;

# Update edge statistics
match
    $e isa signal-edge, has edge-id "edge-001";
    $e has win-count $old_wins;
delete $old_wins;
insert $e has win-count 15;
```

### Pheromone Trail Patterns

```typeql
# Deposit pheromone
match $e isa signal-edge, has edge-id "edge-001";
update $e has edge-trail-level 25.5;

# Find superhighways (high-pheromone trails)
match
    $e isa signal-edge,
        has edge-id $id,
        has edge-trail-level $level;
    $level >= 20.0;
select $id, $level;
sort $level desc;
limit 10;

# Decay all pheromones by 10%
match
    $e isa signal-edge, has edge-trail-level $old;
    let $new = $old * 0.9;
delete $old;
insert $e has edge-trail-level $new;
```

### Live Prediction Tracking

```typeql
define
attribute prediction-id, value string;
attribute pattern-name, value string;
attribute predicted-direction, value string;
attribute verified-1m, value boolean;
attribute verified-5m, value boolean;
attribute verified-1h, value boolean;

entity live-prediction,
    owns prediction-id @key,
    owns pattern-name,
    owns predicted-direction,
    owns verified-1m,
    owns verified-5m,
    owns verified-1h;

# Insert prediction
insert $p isa live-prediction,
    has prediction-id "pred-001",
    has pattern-name "volume_breakout",
    has predicted-direction "long";

# Update verification
match $p isa live-prediction, has prediction-id "pred-001";
update $p has verified-1m true;

# Query pattern accuracy
match
    $p isa live-prediction,
        has pattern-name $name,
        has verified-1h $correct;
    $correct == true;
reduce $wins = count groupby $name;
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│  TypeDB 3.0 Quick Reference                                 │
├─────────────────────────────────────────────────────────────┤
│  CONNECT                                                    │
│  driver = TypeDB.driver(url, Credentials(u, p), Options)    │
│                                                             │
│  TRANSACTIONS (no sessions!)                                │
│  with driver.transaction(db, TransactionType.READ) as tx:   │
│      result = tx.query("...").resolve()                     │
│      tx.commit()  # only for WRITE/SCHEMA                   │
│                                                             │
│  TRANSACTION TYPES                                          │
│  READ   - read only, concurrent                             │
│  WRITE  - data modifications                                │
│  SCHEMA - schema changes                                    │
│                                                             │
│  SCHEMA: define / undefine / redefine                       │
│  DATA:   match / insert / delete / update / put             │
│  OUTPUT: select / fetch / reduce                            │
│  STREAM: sort / limit / offset / distinct                   │
│                                                             │
│  VALUE TYPES                                                │
│  integer (not long!), double, decimal, boolean              │
│  string, date, datetime, datetime-tz, duration              │
│                                                             │
│  DELETE SYNTAX (3.0)                                        │
│  delete $attr;           # delete attribute                 │
│  delete has $attr of $e; # delete ownership                 │
│  delete $e;              # delete entity/relation           │
│                                                             │
│  ANNOTATIONS                                                │
│  @key, @unique, @card(n..m), @abstract                      │
│  @values(), @range(), @regex(), @independent                │
└─────────────────────────────────────────────────────────────┘
```

---

## References

- [TypeDB Documentation](https://typedb.com/docs)
- [TypeQL Reference](https://typedb.com/docs/typeql-reference/)
- [Python Driver Reference](https://typedb.com/docs/reference/typedb-grpc-drivers/python/)
- [TypeDB 2.x to 3.x Migration](https://typedb.com/docs/reference/typedb-2-vs-3/)
- [Query Optimization Guide](https://typedb.com/docs/maintenance-operation/troubleshooting/optimizing-queries/)
