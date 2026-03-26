# Database Integration Tests

Reference for database setup, teardown, data management, and assertion strategies in integration tests.

## Setup and teardown strategy

**Preferred: transaction rollback per test** (fast, no data leakage)
```java
@Transactional  // Spring rolls back after each test
@Test
void shouldFindOrdersByCustomerId() { ... }
```

**Alternative: delete-all after each test**
```typescript
afterEach(async () => {
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
})
```

**Avoid: full schema recreation per test** — too slow.

## Test data management

- Insert only the data the test needs
- Use the adapter under test for setup when possible (tests the write path too)
- For complex setups, use SQL scripts or seed helpers

## Assert on the storage layer

Don't just assert on return values — verify persistence directly:
```typescript
await repo.save(order)

// Assert via a raw query to verify actual DB state
const row = await prisma.order.findUnique({ where: { id: order.id } })
expect(row?.status).toBe('PENDING')
expect(row?.customerId).toBe('customer-1')
```

## Messaging Integration Tests

```typescript
describe('KafkaOrderEventPublisher', () => {
  it('publishes OrderPlaced event to the correct topic', async () => {
    const event = new OrderPlacedEvent({ orderId: 'o-1', customerId: 'c-1' })

    await publisher.publish(event)

    const messages = await testConsumer.consume('orders.placed', { timeout: 3000 })
    expect(messages).toHaveLength(1)
    expect(JSON.parse(messages[0].value)).toMatchObject({
      type: 'OrderPlaced',
      orderId: 'o-1'
    })
  })
})
```
