// Copyright 2021 Dhruvil Dave

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface WalkEntry
  extends Pick<
    fs.Dirent,
    'name' | 'isFile' | 'isDirectory' | 'isSymbolicLink'
  > {
  path: string;
}

export interface WalkOptions {
  maxDepth?: number;
  includeFiles?: boolean;
  includeDirs?: boolean;
  followSymlinks?: boolean;
  exts?: string[];
  match?: RegExp[];
  skip?: RegExp[];
}

function _createWalkEntrySync(p: string): WalkEntry {
  p = path.normalize(p);
  const name = path.basename(p);
  const info = fs.statSync(p);
  return {
    name,
    path: p,
    isFile: info.isFile,
    isDirectory: info.isDirectory,
    isSymbolicLink: info.isSymbolicLink,
  };
}

async function _createWalkEntry(p: string): Promise<WalkEntry> {
  p = path.normalize(p);
  const name = path.basename(p);
  const info = await fs.promises.stat(p);
  return {
    name,
    path: p,
    isFile: info.isFile,
    isDirectory: info.isDirectory,
    isSymbolicLink: info.isSymbolicLink,
  };
}

function include(
  path: string,
  exts?: string[],
  match?: RegExp[],
  skip?: RegExp[],
): boolean {
  if (exts && !exts.some((ext): boolean => path.endsWith(ext))) {
    return false;
  }
  if (match && !match.some((pattern): boolean => !!path.match(pattern))) {
    return false;
  }
  if (skip && skip.some((pattern): boolean => !!path.match(pattern))) {
    return false;
  }
  return true;
}

/**
 * Walks the file tree rooted at root, yielding each file or directory in the
 * tree filtered according to the given options.
 * Options:
 * - maxDepth?: number = Infinity;
 * - includeFiles?: boolean = true;
 * - includeDirs?: boolean = true;
 * - followSymlinks?: boolean = false;
 * - exts?: string[];
 * - match?: RegExp[];
 * - skip?: RegExp[];
 *
 */
export async function* walk(
  root: string,
  {
    maxDepth = Infinity,
    includeFiles = true,
    includeDirs = true,
    followSymlinks = false,
    exts = undefined,
    match = undefined,
    skip = undefined,
  }: WalkOptions = {},
): AsyncIterableIterator<WalkEntry> {
  if (maxDepth < 0) {
    return;
  }

  if (includeDirs && include(root, exts, match, skip)) {
    yield await _createWalkEntry(root);
  }

  if (maxDepth < 1 || !include(root, undefined, undefined, skip)) {
    return;
  }
  for await (const entry of await fs.promises.readdir(root, {
    withFileTypes: true,
  })) {
    if (entry.name === null) {
      throw new Error('Null Entry');
    }

    let p = path.join(root, entry.name);
    if (entry.isSymbolicLink()) {
      if (followSymlinks) {
        p = await fs.promises.realpath(p);
      } else {
        continue;
      }
    }

    if (entry.isFile()) {
      if (includeFiles && include(p, exts, match, skip)) {
        yield {
          path: p,
          name: entry.name,
          isDirectory: entry.isDirectory,
          isFile: entry.isFile,
          isSymbolicLink: entry.isSymbolicLink,
        };
      }
    } else {
      yield* walk(p, {
        maxDepth: maxDepth - 1,
        includeFiles,
        includeDirs,
        followSymlinks,
        exts,
        match,
        skip,
      });
    }
  }
}

/**
 * Synchronously Walks the file tree rooted at root,
 * yielding each file or directory in the
 * tree filtered according to the given options.
 * Options:
 * - maxDepth?: number = Infinity;
 * - includeFiles?: boolean = true;
 * - includeDirs?: boolean = true;
 * - followSymlinks?: boolean = false;
 * - exts?: string[];
 * - match?: RegExp[];
 * - skip?: RegExp[];
 *
 */
export function* walkSync(
  root: string,
  {
    maxDepth = Infinity,
    includeFiles = true,
    includeDirs = true,
    followSymlinks = false,
    exts = undefined,
    match = undefined,
    skip = undefined,
  }: WalkOptions = {},
): IterableIterator<WalkEntry> {
  if (maxDepth < 0) {
    return;
  }

  if (includeDirs && include(root, exts, match, skip)) {
    yield _createWalkEntrySync(root);
  }

  if (maxDepth < 1 || !include(root, undefined, undefined, skip)) {
    return;
  }
  for (const entry of fs.readdirSync(root, {
    withFileTypes: true,
  })) {
    if (entry.name === null) {
      throw new Error('Null Entry');
    }

    let p = path.join(root, entry.name);
    if (entry.isSymbolicLink()) {
      if (followSymlinks) {
        p = fs.realpathSync(p);
      } else {
        continue;
      }
    }

    if (entry.isFile()) {
      if (includeFiles && include(p, exts, match, skip)) {
        yield {
          path: p,
          name: entry.name,
          isDirectory: entry.isDirectory,
          isFile: entry.isFile,
          isSymbolicLink: entry.isSymbolicLink,
        };
      }
    } else {
      yield* walkSync(p, {
        maxDepth: maxDepth - 1,
        includeFiles,
        includeDirs,
        followSymlinks,
        exts,
        match,
        skip,
      });
    }
  }
}
