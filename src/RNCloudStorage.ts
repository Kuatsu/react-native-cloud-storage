import { Platform } from 'react-native';
import createRNCloudStorage from './createRNCloudStorage';
import GoogleDrive from './google-drive';
import { CloudStorageScope, type CloudStorageFileStat } from './types/main';
import { verifyLeadingSlash } from './utils/helpers';

const nativeInstance = createRNCloudStorage();
let defaultScope = CloudStorageScope.AppData;

const RNCloudStorage = {
  getDefaultScope: () => defaultScope,
  setDefaultScope: (scope: CloudStorageScope) => (defaultScope = scope),
  getGoogleDriveAccessToken: () => GoogleDrive.accessToken,
  setGoogleDriveAccessToken: (accessToken: string | null) => (GoogleDrive.accessToken = accessToken),
  setThrowOnFilesWithSameName: (enable: boolean) => (GoogleDrive.throwOnFilesWithSameName = enable),
  setTimeout: (timeout: number) => (GoogleDrive.timeout = timeout),
  /* eslint-disable @typescript-eslint/no-unused-vars */
  subscribeToFilesWithSameName:
    Platform.OS === 'ios'
      ? // @ts-expect-error - subscriber is undefined; just a mock
        (subscriber: ({ path, fileIds }: { path: string; fileIds: string[] }) => void) => ({ remove: () => {} })
      : (nativeInstance as GoogleDrive).subscribeToFilesWithSameName.bind(nativeInstance),
  /* eslint-enable @typescript-eslint/no-unused-vars */

  /**
   * Tests whether or not the cloud storage is available. Always returns true for Google Drive. iCloud may be
   * unavailable right after app launch or if the user is not logged in.
   * @returns A promise that resolves to true if the cloud storage is available, false otherwise.
   */
  isCloudAvailable: async (): Promise<boolean> => {
    return nativeInstance.isCloudAvailable();
  },

  /**
   * Appends the data to the file at the given path, creating the file if it doesn't exist.
   * @param path The file to append to.
   * @param data The data to append.
   * @param scope The directory scope the path is in. Defaults to the set default scope.
   * @returns A promise that resolves when the data has been appended.
   */
  appendFile: (path: string, data: string, scope?: CloudStorageScope): Promise<void> => {
    return nativeInstance.appendToFile(verifyLeadingSlash(path), data, scope ?? defaultScope);
  },

  /**
   * Tests whether or not the file at the given path exists.
   * @param path The path to test.
   * @param scope The directory scope the path is in. Defaults to the set default scope.
   * @returns A promise that resolves to true if the path exists, false otherwise.
   */
  exists: (path: string, scope?: CloudStorageScope): Promise<boolean> => {
    return nativeInstance.fileExists(verifyLeadingSlash(path), scope ?? defaultScope);
  },

  /**
   * Writes to the file at the given path, creating it if it doesn't exist or overwriting it if it does.
   * @param path The file to write to.
   * @param data The data to write.
   * @param scope The directory scope the path is in. Defaults to the set default scope.
   * @returns A promise that resolves when the file has been written.
   */
  writeFile: (path: string, data: string, scope?: CloudStorageScope): Promise<void> => {
    return nativeInstance.createFile(verifyLeadingSlash(path), data, scope ?? defaultScope, true);
  },

  /**
   * Creates a new directory at the given path.
   * @param path The directory to create.
   * @param scope The directory scope the path is in. Defaults to the set default scope.
   * @returns A promise that resolves when the directory has been created.
   */
  mkdir: (path: string, scope?: CloudStorageScope): Promise<void> => {
    return nativeInstance.createDirectory(verifyLeadingSlash(path), scope ?? defaultScope);
  },

  /**
   * Lists the contents of the directory at the given path.
   * @param path The directory to list.
   * @param scope The directory scope the path is in. Defaults to the set default scope.
   * @returns A promise that resolves to an array of file names, excluding '.' and '..'.
   */
  readdir: (path: string, scope?: CloudStorageScope): Promise<string[]> => {
    return nativeInstance.listFiles(verifyLeadingSlash(path), scope ?? defaultScope);
  },

  /**
   * Reads the contents of the file at the given path.
   * @param path The file to read.
   * @param scope The directory scope the path is in. Defaults to the set default scope.
   * @returns A promise that resolves to the contents of the file.
   */
  readFile: (path: string, scope?: CloudStorageScope): Promise<string> => {
    return nativeInstance.readFile(verifyLeadingSlash(path), scope ?? defaultScope);
  },

  /**
   * Downloads the file at the given path from iCloud. Does not have any effect on Google Drive.
   * @param path The file to trigger the download for.
   * @param scope The directory scope the path is in. Defaults to the set default scope.
   * @returns A promise that resolves once the download has been triggered.
   */
  downloadFile: (path: string, scope?: CloudStorageScope): Promise<void> => {
    return nativeInstance.downloadFile(verifyLeadingSlash(path), scope ?? defaultScope);
  },

  /**
   * Deletes the file at the given path.
   * @param path The file to delete.
   * @param scope The directory scope the path is in. Defaults to the set default scope.
   * @returns A promise that resolves when the file has been deleted.
   */
  unlink: (path: string, scope?: CloudStorageScope): Promise<void> => {
    return nativeInstance.deleteFile(verifyLeadingSlash(path), scope ?? defaultScope);
  },

  /**
   * Deletes the directory at the given path.
   * @param path The directory to delete.
   * @param options Options for the delete operation. Defaults to { recursive: false }.
   * @param scope The directory scope the path is in. Defaults to the set default scope.
   * @returns A promise that resolves when the directory has been deleted.
   */
  rmdir: (path: string, options?: { recursive?: boolean }, scope?: CloudStorageScope): Promise<void> => {
    return nativeInstance.deleteDirectory(verifyLeadingSlash(path), options?.recursive ?? false, scope ?? defaultScope);
  },

  /**
   * Gets the size, creation time, and modification time of the file at the given path.
   * @param path The file to stat.
   * @param scope The directory scope the path is in. Defaults to the set default scope.
   * @returns A promise that resolves to the CloudStorageFileStat object.
   */
  stat: async (path: string, scope?: CloudStorageScope): Promise<CloudStorageFileStat> => {
    const native = await nativeInstance.statFile(verifyLeadingSlash(path), scope ?? defaultScope);

    return {
      ...native,
      birthtime: new Date(native.birthtimeMs),
      mtime: new Date(native.mtimeMs),
      isDirectory: () => native.isDirectory,
      isFile: () => native.isFile,
    };
  },
};

export default RNCloudStorage;
