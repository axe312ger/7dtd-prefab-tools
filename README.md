prefab-tools for 7 Days To Die
=================

> Toolkit to analyze, trim, repopulate and manipulate your 7 Days To Die map

**⚠️⚠️⚠️ Alpha status: Use with caution, make backups, manually check the files the script generates! ⚠️⚠️⚠️**

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
prefab-tools/0.1.0 darwin-arm64 node-v16.16.0
$ prefab-tools --help [COMMAND]
USAGE
  $ prefab-tools COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`prefab-tools align`](#prefab-tools-align)
* [`prefab-tools analyze [FILE]`](#prefab-tools-analyze-file)
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
* [`prefab-tools populate`](#prefab-tools-populate)
* [`prefab-tools trim`](#prefab-tools-trim)

## `prefab-tools align`

Align all POIs and tiles to the heightmap of your map

```
USAGE
  $ prefab-tools align

DESCRIPTION
  Align all POIs and tiles to the heightmap of your map

EXAMPLES
  $ prefab-tools align
```

_See code: [dist/commands/align.ts](https://github.com/axe312ger/7dtd-prefab-tools/blob/v0.1.0/dist/commands/align.ts)_

## `prefab-tools analyze [FILE]`

Analyze your maps prefabs.xml and get detailed stats about your spawned POIs

```
USAGE
  $ prefab-tools analyze [FILE]

DESCRIPTION
  Analyze your maps prefabs.xml and get detailed stats about your spawned POIs

EXAMPLES
  $ prefab-tools analyze
```

_See code: [dist/commands/analyze.ts](https://github.com/axe312ger/7dtd-prefab-tools/blob/v0.1.0/dist/commands/analyze.ts)_

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

## `prefab-tools populate`

Populate all empty tiles in a prefab.xml

```
USAGE
  $ prefab-tools populate

DESCRIPTION
  Populate all empty tiles in a prefab.xml

EXAMPLES
  $ prefab-tools populate
```

_See code: [dist/commands/populate.ts](https://github.com/axe312ger/7dtd-prefab-tools/blob/v0.1.0/dist/commands/populate.ts)_

## `prefab-tools trim`

remove spawned decorations and parts from the prefabs

```
USAGE
  $ prefab-tools trim

DESCRIPTION
  remove spawned decorations and parts from the prefabs

EXAMPLES
  $ prefab-tools trim
```

_See code: [dist/commands/trim.ts](https://github.com/axe312ger/7dtd-prefab-tools/blob/v0.1.0/dist/commands/trim.ts)_
<!-- commandsstop -->
