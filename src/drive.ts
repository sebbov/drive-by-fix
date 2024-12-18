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


export async function download(fileId: string, mimeType: string, fileSize: number, onProgressPercent: (percent: number) => void): Promise<{ fileBlob: Blob, md5Checksum: string }> {
    return new Promise((resolve, reject) => {
        try {
            // We're using XHR b/c it offers a way to monitor download progress.  An alternative would be
            // to use resumable downloads, but it is more complex for our needs.  (The media download type works
            // fine for my connection and filesizes -- this might vary for other uses though.)
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, true);
            xhr.setRequestHeader('Authorization', `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`);
            xhr.responseType = 'arraybuffer';

            xhr.onprogress = (event) => {
                if (event.lengthComputable) {
                    onProgressPercent(Math.round((event.loaded / fileSize) * 100));
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const fileBlob = new Blob([xhr.response], { type: mimeType });
                    const wordArray = CryptoJS.lib.WordArray.create(xhr.response);
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

export async function upload(
    fileId: string,
    contents: Blob,
    onProgressPercent: (percent: number) => void
): Promise<{ fileId: string }> {
    return new Promise((resolve, reject) => {
        try {
            // C.f. download() on why we're using XHR.
            const xhr = new XMLHttpRequest();
            xhr.open(
                'PATCH',
                `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=id`,
                true
            );

            xhr.setRequestHeader(
                'Authorization',
                `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
            );

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    onProgressPercent(Math.round((event.loaded / event.total) * 100));
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const result = JSON.parse(xhr.responseText);
                    console.log(result);
                    resolve({ fileId: result.id });
                } else {
                    reject(new Error(`Failed to upload file ${fileId}: ${xhr.statusText}`));
                }
            };

            xhr.onerror = () => {
                reject(new Error(`Error during the upload process for file ${fileId}`));
            };

            const form = new FormData();
            form.append(
                'metadata',
                new Blob([JSON.stringify({})], { type: 'application/json' })
            );
            form.append('file', contents);

            xhr.send(form);
        } catch (error) {
            reject(error);
        }
    });
}
