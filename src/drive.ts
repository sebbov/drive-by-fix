import { gapi } from 'gapi-script';

export interface Capabilities {
    canEdit: boolean;
    canCopy: boolean;
    canDelete: boolean;
    canDownload: boolean;
}

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    md5Checksum: string;
    size: string;
    version: string;
    parents: string[];
    sharedWithMeTime: string;
    modifiedTime: string;
    capabilities: Capabilities;
}

export async function findFile(name: string): Promise<DriveFile[]> {
    const response = await gapi.client.drive.files.list({
        q: `name = '${name}' and 'me' in owners and trashed = false`,
        fields: "nextPageToken, files(id, name, mimeType, md5Checksum, size, version, parents, sharedWithMeTime, modifiedTime, capabilities)",
    });
    return response.result.files as DriveFile[];
}
