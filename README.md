# fs-walk

A generator-based lightweight memory efficient recursive directory walk for Node.js.

## Installation

npm: `npm install @0xdd/fs-walk`

yarn: `yarn add @0xdd/fs-walk`

pnpm: `pnpm add @0xdd/fs-walk`

## Usage

```ts
import { walk, walkSync } from '@0xdd/fs-walk';

(async () => {
  for await (const i of walk('.')) {
    console.log(i);
  }
})();

for (const i of walkSync('.', { skip: [/node_modules/, /\.git/] })) {
  console.log(i.path);
}
```

## Motivation

`fs.readdir` does not do recursive traversal of directory tree. The solutions available online sometimes fail to work on large directories due to recursion limits.

## Attribution

Documentation and interface for walk were adapted from Go
Copyright 2009 The Go Authors. All rights reserved. BSD license.

TypeScript interface inspired by Deno
Copyright 2018-2021 the Deno authors.
