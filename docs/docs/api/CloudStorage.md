---
sidebar_position: 1
---

# CloudStorage

The `CloudStorage` provides the core functionality of the library. File operations loosely follow the conventions of Node's `fs`.

```ts
import { CloudStorage } from 'react-native-cloud-storage';
```

## Definitions

### `path`

When a method takes a `path` parameter, you should provide a full path with a leading slash, but no trailing slashes:

- ❌ `some/file.txt`
- ❌ `file:///some/file.txt`
- ❌ `/some/directory/`
- ✅ `/some/file.txt`
- ✅ `/some/directory`

Because of legacy reasons, the library will also accept paths without a leading slash and will automatically prefix it with one. However, this will generate a warning and may be removed in a future version.

:::caution

When creating files or directories, always make sure that all directories in the tree already exist. Otherwise the library will throw a [`CloudStorageErrorCode.DIRECTORY_NOT_FOUND`](./enums/CloudStorageErrorCode).

:::

## Methods

### `appendFile(path, data, scope)`

Appends the data to the file at the given path. Creates the file if it doesn't exist yet.

**Parameters**:

- `path` (`string`): Required. The path including the filename to append data to.
- `content` (`string`): Required. The content to append.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setDefaultScope()`](#setdefaultscopescope).

**Returns**: A `Promise` that resolves to `void` once the data has been appended.

### `downloadFile(path, scope)`

When a file has been uploaded to iCloud, it is not immediately synced across devices. In this case, those files will have an `.icloud` extension, so trying to read them will fail. This method will download the file from iCloud so you can safely process it afterwards. If it has already been downloaded, this will not do anything and immediately return. Does not have any effect on Google Drive.

**Parameters**:

- `path` (`string`): Required. The path including the filename to download.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setDefaultScope()`](#setdefaultscopescope).

**Returns**: A `Promise` that resolves to `void` once the download has been triggered.

### `exists(path, scope)`

Tests whether or not the file or directory at the given path exists.

**Parameters**:

- `path` (`string`): Required. The path to test.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setDefaultScope()`](#setdefaultscopescope).

**Returns**: A `Promise` that resolves to a `boolean`. `true` if a file or directory exists at the given path, `false` otherwise.

### `getDefaultScope()`

Gets the currently stored default [`CloudStorageScope`](./enums/CloudStorageScope) (see [`setDefaultScope()`](#setdefaultscopescope)).

### `getGoogleDriveAccessToken()`

Gets the currently stored Google Drive access token (see [`setGoogleDriveAccessToken()`](#setgoogledriveaccesstokenaccesstoken)).

**Returns**: A `Promise` that resolves to the `string` value of the access token, or `null` if it hasn't been set so far.

### `isCloudAvailable()`

Tests whether or not the cloud storage is available.
On iOS, this actually verifies with the system whether or not iCloud is available. This might not be the case right at app launch or when the user is not logged into iCloud.
On all other platforms, this simply checks whether or not a Google Drive API access token has been set using [setGoogleDriveAccessToken](#setgoogledriveaccesstokenaccesstoken).

**Returns**: A `Promise` that resolves to a `boolean`. `true` if the cloud storage is available, `false` otherwise.

### `mkdir(path, scope)`

Creates a new directory at the given path.

**Parameters**:

- `path` (`string`): Required. The path of the new directory to create. All parent directories must already exist.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setDefaultScope()`](#setdefaultscopescope).

**Returns**: A `Promise` that resolves once the directory has been created.

### `readdir(path, scope)`

Reads the files and directories contained in the directory at the given path. Does not include `.` and `..` entries.

**Parameters**:

- `path` (`string`): Required. The full pathname of the directory to read.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setDefaultScope()`](#setdefaultscopescope).

**Returns**: A `Promise` that resolves to an array of `string`s containing the names of the files and directories in the given directory.

### `readFile(path, scope)`

Reads the file at the given path into a `string`.

**Parameters**:

- `path` (`string`): Required. The full pathname of the file to read.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setDefaultScope()`](#setdefaultscopescope).

**Returns**: A `Promise` that resolves to a `string` containing the file's content.

### `rmdir(path, options, scope)`

Deletes the directory at the given path. Can optionally delete the directory including all its contents (recursively).

- `path` (`string`): Required. The full pathname of the directory to delete.
- `options` (`{ recursive?: boolean }`): Optional. An object containing the `recursive` property which, if set to `true`, will delete the directory including all its contents (recursively). If set to `false` (or omitted), the library will throw a [`CloudStorageErrorCode.DIRECTORY_NOT_EMPTY`](./enums/CloudStorageErrorCode) if the directory is not empty. Defaults to `{ recursive: false }`.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setDefaultScope()`](#setdefaultscopescope).

**Returns**: A `Promise` that resolves once the directory has been deleted.

**Parameters**:

### `setDefaultScope(scope)`

Sets the default [`CloudStorageScope`](./enums/CloudStorageScope) to use when no scope is explicitly provided to a method. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope).

The default scope is stored statically and therefore only needs to be provided once but is available throughout the whole project.

**Parameters**:

- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Required. The default storage scope to use for all methods when no scope is explicitly provided.

**Returns**: `void`

### `setGoogleDriveAccessToken(accessToken)`

Provide a valid Google Drive access token to the library which in order to make calls to the Google Drive API.

The access token is stored statically and therefore only needs to be provided once (until the token expires!) but is available throughout the whole project.

**Parameters**:

- `accessToken` (`string | null`): Required. The access token to use, or `null` to clear the currently stored access token.

**Returns**: `void`

### `setThrowOnFilesWithSameName(enable)`

If enabled, the library will throw **before** a file operation if there are multiple files with the given path found. Does not have any effect on iOS. Enabling this will disable any subscribers created via [`subscribeToFilesWithSameName()`](#subscribetofileswithsamenamesubscriber). For more information, [see here](../guides/google-drive-files-same-name).

### `setTimeout(timeout)`

Sets the timeout for fetch operations on Google Drive API. Defaults to 3000 milliseconds.

### `stat(path, scope)`

Gets several file statistics of the file at the given path.

**Parameters**:

- `path` (`string`): Required. The full pathname of the file to stat.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setDefaultScope()`](#setdefaultscopescope).

**Returns**: A `Promise` that resolves to [`CloudStorageFileStat`](./interfaces/CloudStorageFileStat) object containing the statistics.

### `subscribeToFilesWithSameName(subscriber)`

Creates a subscription that receives events when files with the same filename in the same parent directory are detected. Does not fire anything on iOS. For more information, [see here](../guides/google-drive-files-same-name).

**Parameters**:

- `subscriber` (`({ path: string, fileIds: string[] }) => void`): A callback which is fired when files with the same filenames were detected during a file operation. The callback will include an object which includes the `path` of the files and an array of `fileIds` from the Google Drive API.

**Returns**: An object which contains a `remove()` method to unsubscribe again.

### `unlink(path, scope)`

Deletes the file at the given path.

**Parameters**:

- `path` (`string`): Required. The full pathname of the file to delete.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setDefaultScope()`](#setdefaultscopescope).

**Returns**: A `Promise` that resolves to `void` once the file has been deleted.

### `writeFile(path, data, scope)`

Writes the data to the given path. Creates the file if it doesn't exist yet and overwrites it otherwise.

**Parameters**:

- `path` (`string`): Required. The path including the filename to write to.
- `content` (`string`): Required. The content to write.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setDefaultScope()`](#setdefaultscopescope).

**Returns**: A `Promise` that resolves to `void` once the file has been written.
