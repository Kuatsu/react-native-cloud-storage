import {
  MimeTypes,
  type GoogleDriveFile,
  type GoogleDriveFileSpace,
  type GoogleDriveListOperationQueryParameters,
  type GoogleDriveListOperationResponse,
} from './types';

const BASE_URL = 'https://www.googleapis.com/drive/v3';
const BASE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';
const MULTIPART_BOUNDARY = 'foo_bar_baz';

export class GoogleDriveHttpError extends Error {
  public status: number;
  public json: any;

  constructor(message: string, status: number, json: any) {
    super(message);
    this.status = status;
    this.json = json;
  }
}

// TODO: fetch timeout
// TODO: properly handle errors
export default class GoogleDriveApiClient {
  public accessToken: string;
  public timeout: number;
  private _fetchTimeout: any;

  constructor(accessToken: string = '') {
    this.accessToken = accessToken;
    this.timeout = 3000;
  }

  private buildQueryString(query: object): string {
    let res = Object.entries(query)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        if (typeof value === 'boolean') return `${encodeURIComponent(key)}=${value ? 'true' : 'false'}`;
        return `${encodeURIComponent(key)}=${encodeURIComponent(value!)}`;
      })
      .join('&');

    if (res) {
      res = `?${res}`;
    }
    return res;
  }

  private async request<T extends Record<string, any> | string | void = void>(
    operation: `/${string}`,
    { queryParameters, baseUrl, ...options }: RequestInit & { queryParameters?: object; baseUrl?: string } = {}
  ): Promise<T> {
    let path = `${baseUrl ?? BASE_URL}${operation}`;
    if (queryParameters) {
      path += this.buildQueryString(queryParameters);
    }
    clearTimeout(this._fetchTimeout);
    const abortController: AbortController = new AbortController();
    this._fetchTimeout = setTimeout(() => {
      abortController.abort();
    }, this.timeout);
    const response = await fetch(path, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.accessToken}`,
      },
      signal: abortController.signal,
    });
    if (!response.ok) {
      let errorMessage: string;
      let json: any = null;
      try {
        json = await response.json();
        errorMessage = json.error?.message ?? `Request failed with status ${response.status}`;
      } catch (e) {
        errorMessage = `Request failed with status ${response.status}`;
      }
      throw new GoogleDriveHttpError(errorMessage, response.status, json);
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }
    if (options?.headers && 'Accept' in options.headers && options.headers.Accept !== 'application/json') {
      return response.text() as unknown as Promise<T>;
    }
    return response.json();
  }

  private buildMultiPartBody(metadata: object, media: { mimeType: string; body: string }): string {
    const body: string[] = [];
    body.push(`--${MULTIPART_BOUNDARY}\r\n`);
    body.push(`Content-Type: ${MimeTypes.JSON}; charset=UTF-8\r\n\r\n`);
    body.push(`${JSON.stringify(metadata)}\r\n`);
    body.push(`--${MULTIPART_BOUNDARY}\r\n`);
    body.push(`Content-Type: ${media.mimeType}\r\n\r\n`);
    body.push(`${media.body}\r\n`);
    body.push(`--${MULTIPART_BOUNDARY}--`);

    return body.join('');
  }

  public async listFiles(space: GoogleDriveFileSpace): Promise<GoogleDriveFile[]> {
    const files: GoogleDriveFile[] = [];
    let pageToken: string | undefined;
    const fields = ['id', 'kind', 'mimeType', 'name', 'parents', 'spaces', 'size', 'createdTime', 'modifiedTime'];
    do {
      const queryParameters: GoogleDriveListOperationQueryParameters = {
        fields: `files(${fields.join(',')}),nextPageToken`,
        spaces: space,
      };
      const response = await this.request<GoogleDriveListOperationResponse>(`/files`, {
        queryParameters,
      });

      files.push(...response.files);
      pageToken = response.nextPageToken ?? undefined;
    } while (pageToken);

    return files;
  }

  public async getFile(fileId: string): Promise<GoogleDriveFile> {
    const queryParameters: GoogleDriveListOperationQueryParameters = {
      fields: ['id', 'kind', 'mimeType', 'name', 'parents', 'spaces', 'size', 'createdTime', 'modifiedTime'].join(','),
    };
    return this.request<GoogleDriveFile>(`/files/${fileId}`, {
      queryParameters,
    });
  }

  public async getFileText(fileId: string): Promise<string> {
    return this.request<string>(`/files/${fileId}`, {
      queryParameters: { alt: 'media' },
      headers: { Accept: 'text/plain' },
    });
  }

  public async deleteFile(fileId: string): Promise<void> {
    return this.request(`/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  public async createFile(
    metadata: { name: string; parents?: string[] },
    media: { mimeType: string; body: string }
  ): Promise<void> {
    const multipartRequestBody = this.buildMultiPartBody(metadata, media);

    await this.request(`/files`, {
      queryParameters: { uploadType: 'multipart' },
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${MULTIPART_BOUNDARY}`,
        'Content-Length': multipartRequestBody.length.toString(),
      },
      body: multipartRequestBody,
      baseUrl: BASE_UPLOAD_URL,
    });
  }

  public async createDirectory(metadata: { name: string; parents?: string[] }): Promise<void> {
    await this.request(`/files`, {
      method: 'POST',
      headers: {
        'Content-Type': `application/json`,
      },
      body: JSON.stringify({ ...metadata, mimeType: MimeTypes.FOLDER }),
    });
  }

  public async updateFile(fileId: string, media: { mimeType: string; body: string }): Promise<void> {
    await this.request(`/files/${fileId}`, {
      queryParameters: { uploadType: 'media' },
      method: 'PATCH',
      headers: {
        'Content-Type': media.mimeType,
        'Content-Length': media.body.length.toString(),
      },
      body: media.body,
      baseUrl: BASE_UPLOAD_URL,
    });
  }
}
