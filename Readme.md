
**This repo is deprecated**

Please use https://github.com/adl-lang/local-setup

----------------------

# Local Setup Deno Library
_and example `tools` code_

## TL;DR

To set this up for a new project;
- Add code the tools directory into your project
- Run `source tools/local-setup.sh`
- Add `/.local/` to your `.gitignore`

## Making Changes

### Local Dev

Clone this repo and change the `import_map.json` to point to the local checkout.

### Contribution

- Fork this repo and push your changes.
- Tags the commit and push the tag.
- Change the `import_map.json` to point to the tag in our repo.
- Test it.
- Create a PR.

## Accepting PRs

_until automated_

After merge a PR, push a new tag.
