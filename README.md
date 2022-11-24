oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![License](https://img.shields.io/npm/l/oclif-hello-world.svg)](https://github.com/oclif/hello-world/blob/main/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g prefab-tools
$ prefab-tools COMMAND
running command...
$ prefab-tools (--version)
prefab-tools/0.0.0 darwin-x64 node-v14.20.0
$ prefab-tools --help [COMMAND]
USAGE
  $ prefab-tools COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`prefab-tools hello PERSON`](#prefab-tools-hello-person)
* [`prefab-tools hello world`](#prefab-tools-hello-world)
* [`prefab-tools help [COMMAND]`](#prefab-tools-help-command)
* [`prefab-tools plugins`](#prefab-tools-plugins)
* [`prefab-tools plugins:install PLUGIN...`](#prefab-tools-pluginsinstall-plugin)
* [`prefab-tools plugins:inspect PLUGIN...`](#prefab-tools-pluginsinspect-plugin)
* [`prefab-tools plugins:install PLUGIN...`](#prefab-tools-pluginsinstall-plugin-1)
* [`prefab-tools plugins:link PLUGIN`](#prefab-tools-pluginslink-plugin)
* [`prefab-tools plugins:uninstall PLUGIN...`](#prefab-tools-pluginsuninstall-plugin)
* [`prefab-tools plugins:uninstall PLUGIN...`](#prefab-tools-pluginsuninstall-plugin-1)
* [`prefab-tools plugins:uninstall PLUGIN...`](#prefab-tools-pluginsuninstall-plugin-2)
* [`prefab-tools plugins update`](#prefab-tools-plugins-update)

## `prefab-tools hello PERSON`

Say hello

```
USAGE
  $ prefab-tools hello [PERSON] -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [dist/commands/hello/index.ts](https://github.com/axe312ger/7dtd-prefab-tools/blob/v0.0.0/dist/commands/hello/index.ts)_

## `prefab-tools hello world`

Say hello world

```
USAGE
  $ prefab-tools hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ prefab-tools hello world
  hello world! (./src/commands/hello/world.ts)
```

## `prefab-tools help [COMMAND]`

Display help for prefab-tools.

```
USAGE
  $ prefab-tools help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for prefab-tools.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.19/src/commands/help.ts)_

## `prefab-tools plugins`

List installed plugins.

```
USAGE
  $ prefab-tools plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ prefab-tools plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.7/src/commands/plugins/index.ts)_

## `prefab-tools plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ prefab-tools plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ prefab-tools plugins add

EXAMPLES
  $ prefab-tools plugins:install myplugin 

  $ prefab-tools plugins:install https://github.com/someuser/someplugin

  $ prefab-tools plugins:install someuser/someplugin
```

## `prefab-tools plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ prefab-tools plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ prefab-tools plugins:inspect myplugin
```

## `prefab-tools plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ prefab-tools plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ prefab-tools plugins add

EXAMPLES
  $ prefab-tools plugins:install myplugin 

  $ prefab-tools plugins:install https://github.com/someuser/someplugin

  $ prefab-tools plugins:install someuser/someplugin
```

## `prefab-tools plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ prefab-tools plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ prefab-tools plugins:link myplugin
```

## `prefab-tools plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ prefab-tools plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ prefab-tools plugins unlink
  $ prefab-tools plugins remove
```

## `prefab-tools plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ prefab-tools plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ prefab-tools plugins unlink
  $ prefab-tools plugins remove
```

## `prefab-tools plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ prefab-tools plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ prefab-tools plugins unlink
  $ prefab-tools plugins remove
```

## `prefab-tools plugins update`

Update installed plugins.

```
USAGE
  $ prefab-tools plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
