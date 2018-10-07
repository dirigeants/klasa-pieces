# Klasa Pieces repository

This repository contains the various *Pieces* submitted by users and collaborators.

## What are Pieces?

*Pieces* are simply parts of code that can be downloaded and installed straight into your [Klasa](https://github.com/dirigeants/klasa) bot installation.

Pieces can include:

- **Commands**: Chat commands that generally respond with a message after taking some actions.
- **Events**: Pieces that get executed when a Discord event triggers.
- **Extendables**: Pieces that act passively, attaching new [getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get), [setters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set) or [methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions) or [static](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static) to the current Discord.js classes. They're executed at startup before any other piece.
- **Finalizers**: Pieces that run on messages after a successful command.
- **Inhibitors**: Inhibitors are pieces that run before a command is executed and may take action on the message received, and block a command from running in certain cases (thus *inhibit* a command).
- **Monitors**: Monitors are pieces that can run on every message, whether or not it triggers a command. Useful for spam monitoring, swear filters, etc.
- **Providers**: Support for a specific database type. By default a very small amount of DBs are supported, but you can extend the support by adding a provider for whatever database you choose, and configure it to point to your own database.
- **Tasks**: Pieces that get executed on scheduled tasks.

## Submitting Pieces

See (our contribution guidelines)[https://github.com/dirigeants/klasa-pieces/blob/master/CONTRIBUTING.md]
