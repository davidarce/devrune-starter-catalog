# Flow Data Schema

The `FLOW` object is the single source of truth embedded in the HTML. The template engine reads this to render nodes, connections, details, and walkthrough steps.

## Top-level structure

```javascript
window.FLOW = {
  title: "string",           // Display title (e.g., "Order Creation Flow")
  description: "string",     // 1-2 sentence summary of the end-to-end flow
  components: Component[],   // All system components
  steps: Step[]              // Ordered sequence for walkthrough mode
};
```

## Component

```javascript
{
  id: "string",              // Unique identifier (kebab-case, e.g., "order-service")
  label: "string",           // Display name (e.g., "Order Service")
  type: "string",            // One of the types below
  x: number,                 // X position in pixels (from left of diagram panel)
  y: number,                 // Y position in pixels (from top, offset by header height)
  description: "string",     // What this component does (1-2 sentences, be specific)
  tech: "string",            // Technology stack (e.g., "Express.js · Node.js 20")
  details: ["string"],       // Specific details: endpoints, collection names, topics, configs
  connections: ["string"]    // Array of target component IDs this connects to
}
```

### Component Types

| Type | Color | Use for | Examples |
|------|-------|---------|----------|
| `entry` | `#10b981` green | Entry points to the system | API Gateway, Webhook receiver, CLI |
| `service` | `#6366f1` indigo | Business logic services | Order Service, Auth Service, Payment Service |
| `database` | `#f59e0b` amber | Data stores | MongoDB, PostgreSQL, DynamoDB |
| `messaging` | `#ec4899` pink | Event/message systems | Kafka, RabbitMQ, Change Streams, SQS |
| `cache` | `#06b6d4` cyan | Caching layers | Redis, Memcached, ElastiCache |
| `external` | `#8b5cf6` purple | External/third-party services | Stripe, SendGrid, Sinch, S3 |
| `worker` | `#f97316` orange | Background processors | Consumers, Cron jobs, Lambda functions |

## Step

Steps define the chronological sequence of the flow. The walkthrough mode iterates through these in order.

```javascript
{
  from: "string",            // Source component ID
  to: "string",              // Target component ID
  label: "string",           // Short action description (e.g., "Persists order document")
  description: "string",     // Detailed explanation of what happens in this step
  async: boolean             // true = dashed line (event/queue), false = solid line (HTTP/direct)
}
```

## Positioning Guide

Layout nodes in a logical flow: left-to-right and top-to-bottom.

```
Row 1 (y: 30):    [Entry]  →  [Service]  →  [Cache/Producer]
Row 2 (y: 220):   [Database]    [Messaging]
Row 3 (y: 400):   [Change Streams]  [Workers]
Row 4 (y: 570):   [Search/Analytics]  [External APIs]
```

- **X spacing**: ~230-250px between nodes in the same row
- **Y spacing**: ~170-190px between rows
- **Min width**: Each node renders at ~150px wide, account for this in spacing

## Example: Minimal flow

```javascript
window.FLOW = {
  title: "User Registration",
  description: "New user signup from API to email confirmation.",
  components: [
    {
      id: "api",
      label: "Auth API",
      type: "entry",
      x: 60, y: 30,
      description: "Receives signup POST request with email and password.",
      tech: "Express.js · Node.js 20",
      details: ["POST /api/v1/auth/register", "Zod validation", "Rate limit: 10 req/min"],
      connections: ["user-service"]
    },
    {
      id: "user-service",
      label: "User Service",
      type: "service",
      x: 310, y: 30,
      description: "Hashes password, creates user record, publishes signup event.",
      tech: "Node.js microservice",
      details: ["bcrypt password hashing", "UUID generation", "Duplicate email check"],
      connections: ["mongodb", "kafka"]
    },
    {
      id: "mongodb",
      label: "MongoDB",
      type: "database",
      x: 120, y: 220,
      description: "Persists user document with unique email index.",
      tech: "MongoDB Atlas 7.0",
      details: ["Collection: users", "Unique index on email", "Write concern: majority"],
      connections: []
    },
    {
      id: "kafka",
      label: "Kafka",
      type: "messaging",
      x: 370, y: 220,
      description: "Publishes user.registered event for async processing.",
      tech: "KafkaJS · Confluent",
      details: ["Topic: users.registered", "Partition key: user_id"],
      connections: ["email-worker"]
    },
    {
      id: "email-worker",
      label: "Email Worker",
      type: "worker",
      x: 240, y: 400,
      description: "Consumes signup event and sends confirmation email.",
      tech: "Node.js consumer · SendGrid",
      details: ["Consumer group: email-service", "SendGrid API v3", "Retry: 3x"],
      connections: []
    }
  ],
  steps: [
    {
      from: "api", to: "user-service",
      label: "Forwards validated signup request",
      description: "Auth API validates email format and password strength, then passes the clean payload to User Service.",
      async: false
    },
    {
      from: "user-service", to: "mongodb",
      label: "Persists user document",
      description: "User Service hashes the password with bcrypt, generates a UUID, and inserts the user document. Fails if email already exists (unique index).",
      async: false
    },
    {
      from: "user-service", to: "kafka",
      label: "Publishes user.registered event",
      description: "After successful DB write, publishes event with user_id, email, and timestamp to Kafka.",
      async: false
    },
    {
      from: "kafka", to: "email-worker",
      label: "Email worker consumes event",
      description: "Email Worker picks up the event and sends a confirmation email via SendGrid with a verification link.",
      async: true
    }
  ]
};
```
