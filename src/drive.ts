import { gapi } from 'gapi-script';
import * as CryptoJS from 'crypto-js';

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


export async function download(fileId: string, fileSize: number, onProgressPercent: (percent: number) => void): Promise<{ fileBlob: Blob, md5Checksum: string }> {
    return new Promise((resolve, reject) => {
        try {
            // We're using XHR b/c it offers a way to monitor download progress.  An alternative would be
            // to use resumable downloads, but it is more complex for our needs.  (The media download type works
            // fine for my connection and filesizes -- this might vary for other uses though.)
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, true);
            xhr.setRequestHeader('Authorization', `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`);

            xhr.onprogress = (event) => {
                if (event.lengthComputable) {
                    onProgressPercent(Math.round((event.loaded / fileSize) * 100));
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const responseArrayBuffer = xhr.response;
                    const fileBlob = new Blob([responseArrayBuffer], { type: 'application/octet-stream' });
                    const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(responseArrayBuffer));
                    const md5Checksum = CryptoJS.MD5(wordArray).toString(CryptoJS.enc.Hex);
                    resolve({ fileBlob, md5Checksum });
                } else {
                    reject(new Error(`Error downloading file ${fileId}: ${xhr.statusText}`));
                }
            };

            xhr.onerror = () => {
                reject(new Error(`Error during the download process for file ${fileId}`));
            };

            xhr.send();
        } catch (error) {
            reject(error);
        }
    });
}

export async function newFolderInRoot(name: string): Promise<string> {
    const newFolder = (await gapi.client.drive.files.create({
        resource: {
            name: name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: ['root']
        }
    })).result

    return newFolder.id;
}

export async function copy(fileId: string, fileName: string, parentId: string, newParentId: string) {
    const copy = (await gapi.client.drive.files.copy({
        fileId: fileId
    })).result
    await gapi.client.drive.files.update({
        fileId: copy.id,
        addParents: newParentId,
        removeParents: parentId,
        resource: {
            name: `Drive-by-Fix Copy of ${fileName}`,
        },
        fields: 'id, parents'
    })
}
