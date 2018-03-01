# Klasa Pieces repository

This repository contains the various *Pieces* submitted by users and collaborators.

## What are Pieces?

*Pieces* are simply parts of code that can be downloaded and installed straight into your [Klasa](https://github.com/dirigeants/klasa) bot installation.

Pieces can include:

- **Commands**: Chat commands that generally respond with a message after taking some actions.
- **Events**: Pieces that get executed when a Discord event triggers.
- **Inhibitors**: Inhibitors are pieces that run before a command is executed and may take action on the message received, and block a command from running in certain cases (thus *inhibit* a command).
- **Monitors**: Monitors are pieces that can run on every message, whether or not it triggers a command. Useful for spam monitoring, swear filters, etc.
- **Providers**: Support for a specific database type. By default a very small amount of DBs are supported, but you can extend the support by adding a provider for whatever database you choose, and configure it to point to your own database.
- **Finalizers**: Pieces that run on messages after a successful command.
- **Extendables**: Pieces that act passively, attaching new [getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get), [setters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set) or [methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions) to the current Discord.js classes. They're executed at startup before any other piece.

## Submitting Pieces

Check out the documentation:

- **[Getting Started](https://klasa.js.org/#/docs/main/master/Getting%20Started/GettingStarted)**

- **[Creating Commands](https://klasa.js.org/#/docs/main/master/Piece%20Basics/CreatingCommands)**
- **[Creating Events](https://klasa.js.org/#/docs/main/master/Piece%20Basics/CreatingEvents)**
- **[Creating Extendables](https://klasa.js.org/#/docs/main/master/Piece%20Basics/CreatingExtendables)**
- **[Creating Finalizers](https://klasa.js.org/#/docs/main/master/Piece%20Basics/CreatingFinalizers)**
- **[Creating Inhibitors](https://klasa.js.org/#/docs/main/master/Piece%20Basics/CreatingInhibitors)**
- **[Creating Languages](https://klasa.js.org/#/docs/main/master/Piece%20Basics/CreatingLanguages)**
- **[Creating Monitors](https://klasa.js.org/#/docs/main/master/Piece%20Basics/CreatingMonitors)**
- **[Creating Providers](https://klasa.js.org/#/docs/main/master/Piece%20Basics/CreatingProviders)**
- **[Creating Tasks](https://klasa.js.org/#/docs/main/master/Piece%20Basics/CreatingTasks)**

To submit your own pieces for approval (quick steps):

- Fork this repository
- Create a new piece in the appropriate folder
- Create a Pull Request to the repository.
- Be patient. Someone will approve/deny it as soon as they can.

We will automatically deny PRs that:

- Have identical functionality to an existing *Piece*
- Have code that breaks/does not catch errors/etc
- Contain NSFW, NSFL contents or contents we deem to be unacceptable.
- Contain hacks/exploits/etc
- Have code that might cause a bot to break the TOS or Ratelimits
- Any reason **WE** feel is valid.

> WE RESERVE THE RIGHT TO REFUSE ANY CONTENTS FOR ANY REASON WHETHER YOU ACCEPT THEM OR NOT.
