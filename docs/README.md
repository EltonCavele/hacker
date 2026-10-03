# Package guides

These guides describe the main packages in this project. Read the guide for a package before changing its code. Keep provider details in `lib/` and application behavior in `features/` or `app/`.

## Guides

- [Authentication and data access](auth-and-data-access.md)
- [Email](email.md)
- [Messaging](messaging.md)
- [Caching](caching.md)
- [Storage](storage.md)
- [Payments](payments.md)
- [Queues and workers](queues-and-workers.md)
- [Database](database.md)
- [Deployment and rollback](deployment.md)
- [Design system](design-system.md)
- [Internationalization](i18n.md) — languages, first-visit detection by IP, adding strings
- [Operations: configuration, security and monitoring](operations.md)

Use the existing types and public exports when adding integrations. Keep secrets on the server and validate untrusted input at application entry points.

- [Push notifications](push-notifications.md) — PWA, VAPID setup, sending pushes
