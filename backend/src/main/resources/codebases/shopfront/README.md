# Shopfront

Shopfront is the backend of a small online shop. It manages the shop's
**users** (customers who can log in), its **products** (things the shop sells)
and the **orders** customers place.

It is a plain Spring Boot 3 application:

- `user/` — register and look up customers
- `product/` — create, list and update products in the catalogue
- `order/` — checkout, order history and shipping costs
- `report/` — the weekly sales report for the shop owner
- `common/` — shared error handling

Each domain follows the same layers:

```
Controller  (HTTP)  →  Service  (business rules)  →  Repository  (database)
```

## Running locally

```bash
./mvnw spring-boot:run
```

The app starts on <http://localhost:8080> with an in-memory H2 database.

## Known gaps

- There is no endpoint to list all users yet.
- Customers can't change their name or close their account.
- Product prices are not validated (negative prices are accepted).
- Two customers ordering the last item at the same moment can both succeed.
